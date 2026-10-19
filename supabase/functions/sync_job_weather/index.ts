import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();

    const jobId = payload.job_id || null;
    const zoneId = payload.zone_id || null;
    const zoneName = payload.zone_name || "Weather Location";
    const lat = payload.lat;
    const lon = payload.lon;

    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      return new Response(JSON.stringify({ error: "Missing lat or lon" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey =
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    }

    const weatherHeaders = {
      "User-Agent": "PPD-Weather/1.0",
      "Accept": "application/geo+json",
    };

    const pointRes = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`,
      { headers: weatherHeaders },
    );

    if (!pointRes.ok) {
      throw new Error(`NOAA point lookup failed: ${await pointRes.text()}`);
    }

    const pointData = await pointRes.json();
    const forecastUrl = pointData?.properties?.forecastHourly;

    if (!forecastUrl) {
      throw new Error("NOAA forecastHourly URL missing");
    }

    const forecastRes = await fetch(forecastUrl, { headers: weatherHeaders });

    if (!forecastRes.ok) {
      throw new Error(`NOAA hourly forecast failed: ${await forecastRes.text()}`);
    }

    const forecastData = await forecastRes.json();
    const periods = forecastData?.properties?.periods || [];

    if (!Array.isArray(periods) || periods.length === 0) {
      throw new Error("NOAA returned no forecast periods");
    }

    const now = new Date();
    const current = periods[0];

    function numberFromWind(value: string | null | undefined): number | null {
      if (!value) return null;
      const match = String(value).match(/\d+/);
      return match ? Number(match[0]) : null;
    }

    function heatIndex(temperature: number | null, humidity: number | null): number | null {
      if (temperature === null || humidity === null) return null;
      return (
        -42.379 +
        2.04901523 * temperature +
        10.14333127 * humidity -
        0.22475541 * temperature * humidity -
        0.00683783 * temperature * temperature -
        0.05481717 * humidity * humidity +
        0.00122874 * temperature * temperature * humidity +
        0.00085282 * temperature * humidity * humidity -
        0.00000199 * temperature * temperature * humidity * humidity
      );
    }

    const forecastRows = periods.slice(0, 24).map((period: any) => {
      const temperature = period.temperature ?? null;
      const humidity = period.relativeHumidity?.value ?? null;
      const windSpeed = numberFromWind(period.windSpeed);
      const windGust = numberFromWind(period.windGust);
      const precipitation = period.probabilityOfPrecipitation?.value ?? null;
      const forecastTime = period.startTime ? new Date(period.startTime) : now;

      return {
        job_id: jobId,
        forecast_date: forecastTime.toISOString().split("T")[0],
        forecast_time: forecastTime.toISOString(),
        location_lat: lat,
        location_lng: lon,
        wind_mph: windSpeed,
        wind_gust_mph: windGust,
        temperature_f: temperature,
        precip_probability: precipitation,
        humidity_percent: humidity,
        heat_index_f: heatIndex(temperature, humidity),
        created_at: now.toISOString(),
      };
    });

    const insertForecastRes = await fetch(`${supabaseUrl}/rest/v1/weather_forecasts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(forecastRows),
    });

    if (!insertForecastRes.ok) {
      throw new Error(`weather_forecasts insert failed: ${await insertForecastRes.text()}`);
    }

    let cacheUpdated = false;

    if (zoneId) {
      const temperature = current.temperature ?? null;
      const humidity = current.relativeHumidity?.value ?? null;
      const windSpeed = numberFromWind(current.windSpeed);
      const windGust = numberFromWind(current.windGust);
      const precipitation = current.probabilityOfPrecipitation?.value ?? null;

      const cacheRow = {
        weather_location_id: zoneId,
        location_name: zoneName,
        location_lat: lat,
        location_lng: lon,
        wind_mph: windSpeed,
        wind_gust_mph: windGust,
        temperature_f: temperature,
        precip_probability: precipitation,
        humidity_percent: humidity,
        heat_index_f: heatIndex(temperature, humidity),
        weather_status: "fresh",
        fetched_at: now.toISOString(),
        valid_until: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
        raw_payload: { source: "NOAA", kind: "hourly_forecast", forecast_period_start: current.startTime ?? null, forecast: current },
        updated_at: now.toISOString(),
      };

      const cacheRes = await fetch(
        `${supabaseUrl}/rest/v1/zone_weather_cache?on_conflict=weather_location_id`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
            "Prefer": "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(cacheRow),
        },
      );

      if (!cacheRes.ok) {
        throw new Error(`zone_weather_cache upsert failed: ${await cacheRes.text()}`);
      }

      cacheUpdated = true;
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: zoneId ? "zone_cache" : "job",
        job_id: jobId,
        zone_id: zoneId,
        zone_name: zoneName,
        rows_inserted: forecastRows.length,
        cache_updated: cacheUpdated,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
