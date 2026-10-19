DO $do$
DECLARE d text; old_text text; new_text text;
BEGIN
  d:=pg_get_functiondef('public.send_daily_system_report()'::regprocedure);
  old_text:=$old$coalesce(public.evaluate_weather_status_values(zwc.wind_mph, zwc.wind_gust_mph, zwc.precip_probability, zwc.temperature_f, zwc.heat_index_f), 'unknown')$old$;
  new_text:=$new$case
        when public.evaluate_weather_status_values(zwc.wind_mph, zwc.wind_gust_mph, zwc.precip_probability, zwc.temperature_f, zwc.heat_index_f) <> 'safe'
          then public.evaluate_weather_status_values(zwc.wind_mph, zwc.wind_gust_mph, zwc.precip_probability, zwc.temperature_f, zwc.heat_index_f)
        when zwc.wind_gust_mph is null or zwc.precip_probability is null then 'review_missing_weather'
        else 'safe'
      end$new$;
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Briefing weather status changed'; END IF;
  d:=replace(d,old_text,new_text);
  EXECUTE d;
END;
$do$;
