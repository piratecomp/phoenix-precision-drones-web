-- Never classify a weather snapshot as safe when critical values are unknown.
-- Known hazards still take precedence over missing fields.
DO $do$
DECLARE d text; old_text text:=$old$  RETURN 'safe';$old$;
BEGIN
  d:=pg_get_functiondef('public.evaluate_weather_status_values(numeric,numeric,numeric,numeric,numeric)'::regprocedure);
  IF position(old_text IN d)=0 THEN RAISE EXCEPTION 'Weather safety evaluator changed'; END IF;
  d:=replace(d,old_text,$new$  IF p_wind_mph IS NULL OR p_wind_gust_mph IS NULL OR p_precip_probability IS NULL OR p_temperature_f IS NULL THEN
    RETURN 'review_missing_weather';
  END IF;
  RETURN 'safe';$new$);
  EXECUTE d;
END;
$do$;
