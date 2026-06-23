import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://emxgkftxbpoqnmzxwcop.supabase.co";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type WeatherIntent = {
  isWeather: boolean;
  location: string | null;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function normalizeWeatherLocation(raw: string) {
  return raw
    .replace(/[?.!]+$/g, "")
    .replace(/\b(today|tomorrow|this week|right now|now|currently|please)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectWeatherIntent(message: string): WeatherIntent {
  const normalized = message
    .trim()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ");

  const weatherWords =
    /\b(weather|forecast|temperature|temp|wind|rain|storm|snow|humidity|conditions|hot|cold|cloudy|sunny)\b/i;

  if (!weatherWords.test(normalized)) {
    return { isWeather: false, location: null };
  }

  const locationPatterns = [
    // What's the weather like in Phoenix?
    /\bwhat(?:'s|s| is)?\s+the\s+weather\s+like\s+(?:in|for|at|near)\s+(.+)$/i,

    // What is the weather in Phoenix?
    /\bwhat(?:'s|s| is)?\s+the\s+(?:weather|forecast|temperature|temp|wind|rain|conditions)\s+(?:like\s+)?(?:in|for|at|near)\s+(.+)$/i,

    // How is the weather in Phoenix?
    /\bhow(?:'s|s| is)?\s+the\s+weather\s+(?:in|for|at|near)\s+(.+)$/i,

    // Forecast for Phoenix / weather in Phoenix
    /\b(?:weather|forecast|temperature|temp|wind|rain|conditions)\s+(?:like\s+)?(?:in|for|at|near)\s+(.+)$/i,

    // Phoenix weather / Phoenix forecast
    /^([A-Za-z][A-Za-z\s.'-]+,\s*[A-Za-z]{2,}|[A-Za-z][A-Za-z\s.'-]+)\s+(?:weather|forecast|temperature|temp|wind|rain|conditions)\b/i,

    // Is it windy in Tucson? / Is it raining in Dallas?
    /\bis\s+it\s+(?:windy|raining|snowing|hot|cold|cloudy|sunny|stormy)\s+(?:in|for|at|near)\s+(.+)$/i,
  ];

  for (const pattern of locationPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const location = normalizeWeatherLocation(match[1]);

      if (location.length >= 2) {
        return { isWeather: true, location };
      }
    }
  }

  return { isWeather: true, location: null };
}

function weatherCodeDescription(code: number) {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return descriptions[code] || "Weather data available";
}

function mph(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "not available";
  return `${Math.round(value)} mph`;
}

function degF(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "not available";
  return `${Math.round(value)}°F`;
}

async function getWeatherReply(message: string) {
  const intent = detectWeatherIntent(message);

  if (!intent.isWeather) {
    return null;
  }

  if (!intent.location) {
    return {
      ok: true,
      source: "website_weather",
      intent: "weather_question",
      reply:
        "I can help with weather forecasts for flight planning, but I need a city first. Please ask something like: “What is the weather in Phoenix?” or “Forecast for Dallas, TX.”",
    };
  }

  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", intent.location);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", "en");
  geocodeUrl.searchParams.set("format", "json");

  const geocodeResponse = await fetch(geocodeUrl.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!geocodeResponse.ok) {
    return {
      ok: false,
      source: "website_weather",
      intent: "weather_question",
      reply:
        "I had trouble finding that city for the weather forecast. Please try again with a city and state, like Phoenix, AZ.",
    };
  }

  const geocodeData = await geocodeResponse.json();
  const place = geocodeData?.results?.[0];

  if (!place?.latitude || !place?.longitude) {
    return {
      ok: false,
      source: "website_weather",
      intent: "weather_question",
      reply:
        "I could not find that city for the weather forecast. Please try again with a city and state, like Phoenix, AZ.",
    };
  }

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(place.latitude));
  forecastUrl.searchParams.set("longitude", String(place.longitude));
  forecastUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m");
  forecastUrl.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max");
  forecastUrl.searchParams.set("temperature_unit", "fahrenheit");
  forecastUrl.searchParams.set("wind_speed_unit", "mph");
  forecastUrl.searchParams.set("precipitation_unit", "inch");
  forecastUrl.searchParams.set("timezone", "auto");
  forecastUrl.searchParams.set("forecast_days", "3");

  const forecastResponse = await fetch(forecastUrl.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!forecastResponse.ok) {
    return {
      ok: false,
      source: "website_weather",
      intent: "weather_question",
      reply:
        "I found the city, but I had trouble getting the forecast. Please try again in a few minutes.",
    };
  }

  const forecastData = await forecastResponse.json();
  const current = forecastData?.current;
  const daily = forecastData?.daily;

  const placeName = [place.name, place.admin1, place.country_code].filter(Boolean).join(", ");

  const today = {
    date: daily?.time?.[0],
    code: daily?.weather_code?.[0],
    high: daily?.temperature_2m_max?.[0],
    low: daily?.temperature_2m_min?.[0],
    precip: daily?.precipitation_probability_max?.[0],
    wind: daily?.wind_speed_10m_max?.[0],
    gust: daily?.wind_gusts_10m_max?.[0],
  };

  const tomorrow = {
    date: daily?.time?.[1],
    code: daily?.weather_code?.[1],
    high: daily?.temperature_2m_max?.[1],
    low: daily?.temperature_2m_min?.[1],
    precip: daily?.precipitation_probability_max?.[1],
    wind: daily?.wind_speed_10m_max?.[1],
    gust: daily?.wind_gusts_10m_max?.[1],
  };

  const dayAfter = {
    date: daily?.time?.[2],
    code: daily?.weather_code?.[2],
    high: daily?.temperature_2m_max?.[2],
    low: daily?.temperature_2m_min?.[2],
    precip: daily?.precipitation_probability_max?.[2],
    wind: daily?.wind_speed_10m_max?.[2],
    gust: daily?.wind_gusts_10m_max?.[2],
  };

  const reply = [
    `Weather forecast for ${placeName}:`,
    "",
    `Current: ${degF(current?.temperature_2m)}, ${weatherCodeDescription(current?.weather_code)}, wind ${mph(current?.wind_speed_10m)}, gusts ${mph(current?.wind_gusts_10m)}, humidity ${typeof current?.relative_humidity_2m === "number" ? `${Math.round(current.relative_humidity_2m)}%` : "not available"}.`,
    "",
    `Today (${today.date}): ${weatherCodeDescription(today.code)}, high ${degF(today.high)}, low ${degF(today.low)}, max rain chance ${typeof today.precip === "number" ? `${Math.round(today.precip)}%` : "not available"}, wind up to ${mph(today.wind)}, gusts up to ${mph(today.gust)}.`,
    `Tomorrow (${tomorrow.date}): ${weatherCodeDescription(tomorrow.code)}, high ${degF(tomorrow.high)}, low ${degF(tomorrow.low)}, max rain chance ${typeof tomorrow.precip === "number" ? `${Math.round(tomorrow.precip)}%` : "not available"}, wind up to ${mph(tomorrow.wind)}, gusts up to ${mph(tomorrow.gust)}.`,
    `Next day (${dayAfter.date}): ${weatherCodeDescription(dayAfter.code)}, high ${degF(dayAfter.high)}, low ${degF(dayAfter.low)}, max rain chance ${typeof dayAfter.precip === "number" ? `${Math.round(dayAfter.precip)}%` : "not available"}, wind up to ${mph(dayAfter.wind)}, gusts up to ${mph(dayAfter.gust)}.`,
    "",
    "For drone work, weather is only one safety factor. Real flight decisions also need site review, airspace review, pilot judgment, equipment limits, visibility, wind gusts, and current FAA requirements. Phoenix Precision Drones is currently in prelaunch mode, so this forecast is informational only and does not confirm a flight.",
  ].join("\n");

  return {
    ok: true,
    source: "website_weather",
    intent: "weather_question",
    location: placeName,
    reply,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message = cleanText(body?.message, 1200);
    if (!message) {
      return NextResponse.json({
        ok: false,
        reply: "Please type a message so I can help.",
        error: "empty_message",
      });
    }

    const weatherReply = await getWeatherReply(message);
    if (weatherReply) {
      return NextResponse.json(weatherReply);
    }

    if (!SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          ok: false,
          reply:
            "The website chat is installed, but the secure Supabase server key is not configured yet. Please email sales@phoenixprecisiondrones.com.",
          error: "missing_supabase_service_role_key",
        },
        { status: 500 }
      );
    }

    const sessionId =
      cleanText(body?.sessionId, 120) ||
      `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/website_chat_message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        p_session_id: sessionId,
        p_message: message,
        p_name: cleanText(body?.name, 120),
        p_email: cleanText(body?.email, 180),
        p_page_url: cleanText(body?.pageUrl, 500),
        p_user_agent: cleanText(request.headers.get("user-agent"), 500),
        p_ip:
          cleanText(request.headers.get("x-forwarded-for"), 120) ||
          cleanText(request.headers.get("x-real-ip"), 120),
      }),
    });

    const data = await rpcResponse.json();

    if (!rpcResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          reply:
            "I’m having trouble reaching the Phoenix Precision Drones AI right now. Please email sales@phoenixprecisiondrones.com.",
          error: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reply:
          "I’m having trouble connecting right now. Please email sales@phoenixprecisiondrones.com.",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
