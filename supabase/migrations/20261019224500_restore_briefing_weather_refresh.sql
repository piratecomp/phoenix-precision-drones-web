-- Refresh service-area conditions from NOAA before the executive briefing.
-- NOAA station values are observations; precipitation probability is an hourly forecast.
CREATE OR REPLACE FUNCTION public.ppd_refresh_briefing_weather()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE
  l record; response public.http_response; point jsonb; stations jsonb; observation jsonb; forecast jsonb; period jsonb;
  station_url text; forecast_url text; station_id text;
  observed_at timestamptz; forecast_at timestamptz;
  temp_f numeric; v_wind_mph numeric; gust_mph numeric; humidity numeric; heat_f numeric; precip_pct numeric;
  v_updated integer:=0; v_failed jsonb:='[]'::jsonb; v_source text;
  headers public.http_header[]:=ARRAY[public.http_header('User-Agent','PPD-Weather/1.0'),public.http_header('Accept','application/geo+json')];
BEGIN
  FOR l IN SELECT id,location_name,center_lat,center_lng FROM public.weather_locations
           WHERE active IS TRUE AND center_lat IS NOT NULL AND center_lng IS NOT NULL
           ORDER BY location_name
  LOOP
    BEGIN
      response:=public.http(('GET','https://api.weather.gov/points/'||l.center_lat||','||l.center_lng,
        headers,NULL,NULL)::public.http_request);
      IF response.status<>200 THEN RAISE EXCEPTION 'NOAA point HTTP %',response.status; END IF;
      point:=response.content::jsonb;
      station_url:=point->'properties'->>'observationStations';
      forecast_url:=point->'properties'->>'forecastHourly';
      IF station_url NOT LIKE 'https://api.weather.gov/%' OR forecast_url NOT LIKE 'https://api.weather.gov/%' THEN
        RAISE EXCEPTION 'NOAA station or hourly URL absent';
      END IF;
      response:=public.http(('GET',station_url,headers,NULL,NULL)::public.http_request);
      IF response.status<>200 THEN RAISE EXCEPTION 'NOAA stations HTTP %',response.status; END IF;
      stations:=response.content::jsonb;
      station_id:=stations->'features'->0->>'id';
      IF station_id NOT LIKE 'https://api.weather.gov/stations/%' THEN RAISE EXCEPTION 'NOAA station absent'; END IF;
      response:=public.http(('GET',station_id||'/observations/latest',headers,NULL,NULL)::public.http_request);
      IF response.status<>200 THEN RAISE EXCEPTION 'NOAA observation HTTP %',response.status; END IF;
      observation:=response.content::jsonb->'properties';
      observed_at:=NULLIF(observation->>'timestamp','')::timestamptz;
      response:=public.http(('GET',forecast_url,headers,NULL,NULL)::public.http_request);
      IF response.status<>200 THEN RAISE EXCEPTION 'NOAA hourly forecast HTTP %',response.status; END IF;
      forecast:=response.content::jsonb;
      period:=forecast->'properties'->'periods'->0;
      forecast_at:=NULLIF(period->>'startTime','')::timestamptz;
      precip_pct:=NULLIF(period->'probabilityOfPrecipitation'->>'value','')::numeric;
      IF precip_pct IS NOT NULL AND (precip_pct<0 OR precip_pct>100) THEN precip_pct:=NULL; END IF;

      v_source:='station_observation';
      IF observed_at IS NOT NULL AND observed_at BETWEEN now()-interval '90 minutes' AND now()+interval '5 minutes'
         AND observation->'temperature'->>'value' IS NOT NULL
         AND observation->'windSpeed'->>'value' IS NOT NULL THEN
        temp_f:=round(((observation->'temperature'->>'value')::numeric*9/5+32),1);
        v_wind_mph:=round(((observation->'windSpeed'->>'value')::numeric*2.236936),1);
        gust_mph:=round(((observation->'windGust'->>'value')::numeric*2.236936),1);
        humidity:=(observation->'relativeHumidity'->>'value')::numeric;
        heat_f:=round(((observation->'heatIndex'->>'value')::numeric*9/5+32),1);
      ELSE
        v_source:='hourly_forecast';
        IF forecast_at IS NULL OR forecast_at NOT BETWEEN now()-interval '90 minutes' AND now()+interval '90 minutes' THEN
          RAISE EXCEPTION 'No recent station observation or hourly forecast';
        END IF;
        temp_f:=(period->>'temperature')::numeric;
        v_wind_mph:=substring(period->>'windSpeed' FROM '[0-9]+')::numeric;
        gust_mph:=substring(period->>'windGust' FROM '[0-9]+')::numeric;
        humidity:=(period->'relativeHumidity'->>'value')::numeric;
        heat_f:=NULL;
      END IF;
      IF temp_f IS NULL OR v_wind_mph IS NULL THEN RAISE EXCEPTION 'NOAA temperature or wind missing'; END IF;
      IF v_wind_mph<0 OR v_wind_mph>250 OR temp_f< -100 OR temp_f>160 THEN RAISE EXCEPTION 'NOAA conditions out of range'; END IF;
      UPDATE public.zone_weather_cache SET location_name=l.location_name,location_lat=l.center_lat,location_lng=l.center_lng,
        temperature_f=temp_f,wind_mph=v_wind_mph,wind_gust_mph=gust_mph,precip_probability=precip_pct,
        humidity_percent=humidity,heat_index_f=heat_f,weather_status='fresh',fetched_at=now(),
        valid_until=now()+interval '45 minutes',updated_at=now(),
        raw_payload=jsonb_build_object('source','NOAA','kind',v_source,'observation_time',observed_at,
          'forecast_period_start',forecast_at,'station_url',station_id,'forecast_url',forecast_url)
      WHERE weather_location_id=l.id;
      IF NOT FOUND THEN
        INSERT INTO public.zone_weather_cache(weather_location_id,location_name,location_lat,location_lng,
          temperature_f,wind_mph,wind_gust_mph,precip_probability,humidity_percent,heat_index_f,
          weather_status,fetched_at,valid_until,raw_payload,created_at,updated_at)
        VALUES(l.id,l.location_name,l.center_lat,l.center_lng,temp_f,v_wind_mph,gust_mph,precip_pct,humidity,heat_f,
          'fresh',now(),now()+interval '45 minutes',jsonb_build_object('source','NOAA','kind',v_source,
            'observation_time',observed_at,'forecast_period_start',forecast_at,'station_url',station_id,'forecast_url',forecast_url),now(),now());
      END IF;
      v_updated:=v_updated+1;
    EXCEPTION WHEN OTHERS THEN
      v_failed:=v_failed||jsonb_build_array(jsonb_build_object('location',l.location_name,'error',SQLERRM));
    END;
  END LOOP;
  RETURN jsonb_build_object('updated',v_updated,'failed',v_failed,'source','NOAA','checked_at',now());
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_refresh_briefing_weather() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppd_refresh_briefing_weather() TO service_role;

SELECT cron.schedule('ppd_weather_refresh_30m','10,40 * * * *','select public.ppd_refresh_briefing_weather();');
SELECT cron.schedule('ppd_weather_prebrief_1255_az','55 19 * * *','select public.ppd_refresh_briefing_weather();');
