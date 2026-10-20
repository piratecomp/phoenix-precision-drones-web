-- Preserve the existing executive report while replacing its unsafe weather fallbacks.
-- Fail the migration if the report definition has drifted so a partial rewrite cannot land.
DO $do$
DECLARE d text; old_text text; new_text text;
BEGIN
  d:=pg_get_functiondef('public.send_daily_system_report()'::regprocedure);
  old_text:=$old$  v_precip_risk numeric := 0;$old$;
  new_text:=$new$  v_precip_risk numeric := 0;
  v_weather_updated_at timestamp;$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing declaration changed'; END IF;
  d:=replace(d,old_text,new_text);

  old_text:=$old$select coalesce(round(avg(wind_mph)::numeric,2),0), coalesce(max(wind_gust_mph),0), coalesce(round(avg(temperature_f)::numeric,2),0), coalesce(round(max(precip_probability)::numeric,2),0)
    into v_avg_wind, v_max_gust, v_avg_temp, v_precip_risk$old$;
  new_text:=$new$select round(avg(wind_mph)::numeric,2), max(wind_gust_mph), round(avg(temperature_f)::numeric,2), round(max(precip_probability)::numeric,2), max(fetched_at)
    into v_avg_wind, v_max_gust, v_avg_temp, v_precip_risk, v_weather_updated_at$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing weather aggregate changed'; END IF;
  d:=replace(d,old_text,new_text);

  old_text:=$old$coalesce(round(zwc.temperature_f::numeric,0),0) || '°F</td>'$old$;
  new_text:=$new$coalesce(round(zwc.temperature_f::numeric,0)::text,'N/A') || '°F</td>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing temperature row changed'; END IF;
  d:=replace(d,old_text,new_text);
  old_text:=$old$coalesce(round(zwc.wind_mph::numeric,0),0) || ' mph</td>'$old$;
  new_text:=$new$coalesce(round(zwc.wind_mph::numeric,0)::text,'N/A') || ' mph</td>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing wind row changed'; END IF;
  d:=replace(d,old_text,new_text);
  old_text:=$old$coalesce(round(zwc.wind_gust_mph::numeric,0),0) || ' mph</td>'$old$;
  new_text:=$new$coalesce(round(zwc.wind_gust_mph::numeric,0)::text,'N/A') || ' mph</td>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing gust row changed'; END IF;
  d:=replace(d,old_text,new_text);
  old_text:=$old$coalesce(round(zwc.precip_probability::numeric,0),0) || '%</td>'$old$;
  new_text:=$new$coalesce(round(zwc.precip_probability::numeric,0)::text,'N/A') || '%</td>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing precipitation row changed'; END IF;
  d:=replace(d,old_text,new_text);

  old_text:=$old$'<p><b>Average Wind Across Active Zones:</b> ' || v_avg_wind || ' mph<br>' ||
    '<b>Max Gust Across Active Zones:</b> ' || v_max_gust || ' mph<br>' ||
    '<b>Average Temperature Across Active Zones:</b> ' || v_avg_temp || '°F<br>' ||
    '<b>Max Precipitation Risk:</b> ' || v_precip_risk || '%</p>'$old$;
  new_text:=$new$'<p><b>NOAA data refreshed:</b> ' || coalesce(to_char(v_weather_updated_at,'YYYY-MM-DD HH24:MI') || ' UTC','Unavailable — verify conditions before flight') || '<br>' ||
    '<b>Average Wind Across Active Zones:</b> ' || coalesce(v_avg_wind::text || ' mph','Unavailable') || '<br>' ||
    '<b>Max Gust Across Active Zones:</b> ' || coalesce(v_max_gust::text || ' mph','Unavailable') || '<br>' ||
    '<b>Average Temperature Across Active Zones:</b> ' || coalesce(v_avg_temp::text || '°F','Unavailable') || '<br>' ||
    '<b>Max Precipitation Risk (hourly forecast):</b> ' || coalesce(v_precip_risk::text || '%','Unavailable') || '</p>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing weather summary changed'; END IF;
  d:=replace(d,old_text,new_text);
  EXECUTE d;
END;
$do$;
