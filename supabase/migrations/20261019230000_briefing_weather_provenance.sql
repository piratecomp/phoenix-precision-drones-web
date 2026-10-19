DO $do$
DECLARE d text; old_text text; new_text text;
BEGIN
  d:=pg_get_functiondef('public.send_daily_system_report()'::regprocedure);
  FOREACH old_text IN ARRAY ARRAY[
    'v_avg_wind numeric := 0;', 'v_max_gust numeric := 0;',
    'v_avg_temp numeric := 0;', 'v_precip_risk numeric := 0;'
  ] LOOP
    IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing weather declaration changed: %',old_text; END IF;
    d:=replace(d,old_text,replace(old_text,'numeric := 0;','numeric;'));
  END LOOP;
  old_text:=$old$'<td>' || coalesce(public.evaluate_weather_status_values(zwc.wind_mph, zwc.wind_gust_mph, zwc.precip_probability, zwc.temperature_f, zwc.heat_index_f), 'unknown') || '</td></tr>'$old$;
  new_text:=$new$'<td>' || coalesce(public.evaluate_weather_status_values(zwc.wind_mph, zwc.wind_gust_mph, zwc.precip_probability, zwc.temperature_f, zwc.heat_index_f), 'unknown') || '</td>' ||
      '<td>' || CASE WHEN zwc.raw_payload->>'kind'='station_observation' THEN 'NOAA station observation ' || coalesce(zwc.raw_payload->>'observation_time','time unavailable')
          ELSE 'NOAA hourly forecast ' || coalesce(zwc.raw_payload->>'forecast_period_start','time unavailable') END || '</td></tr>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing zone row changed'; END IF;
  d:=replace(d,old_text,new_text);
  old_text:=$old$<th>Precip</th><th>Status</th></tr>'$old$;
  new_text:=$new$<th>Precip</th><th>Status</th><th>Source / valid time</th></tr>'$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing weather table header changed'; END IF;
  d:=replace(d,old_text,new_text);
  d:=replace(d,'colspan=\"6\">No current zone weather cache available.','colspan=\"7\">Weather unavailable. Verify current conditions before flight.');
  EXECUTE d;
END;
$do$;
