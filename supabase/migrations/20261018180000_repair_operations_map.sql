CREATE OR REPLACE FUNCTION public.ppd_get_live_operations_map()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := public.portal_current_public_user_id();
  v_staff boolean := public.portal_current_user_has_role('owner')
    OR public.portal_current_user_has_role('admin')
    OR public.portal_current_user_has_role('safety')
    OR public.portal_current_user_has_role('maintenance');
  v_pilot boolean := public.portal_current_user_has_role('pilot_w2')
    OR public.portal_current_user_has_role('pilot_1099');
  v_jobs jsonb := '[]'::jsonb;
  v_pilots jsonb := '[]'::jsonb;
  v_drones jsonb := '[]'::jsonb;
  v_lat numeric := 33.4484;
  v_lng numeric := -112.0740;
BEGIN
  IF v_user_id IS NULL OR NOT (v_staff OR v_pilot) THEN
    RAISE EXCEPTION 'PPD access denied: operations map requires active operations role'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', j.id, 'type', 'job', 'label', substring(j.id::text, 1, 8),
    'title', COALESCE(s.name, 'PPD Job'), 'status', j.status::text,
    'address', j.job_address, 'lat', j.latitude, 'lng', j.longitude,
    'priority', CASE WHEN j.requires_manual_approval THEN 'high' ELSE 'normal' END
  ) ORDER BY j.created_at DESC), '[]'::jsonb)
  INTO v_jobs
  FROM (
    SELECT j.*
    FROM public.jobs j
    WHERE j.latitude BETWEEN -90 AND 90
      AND j.longitude BETWEEN -180 AND 180
      AND COALESCE(j.is_system_build, false) = false
      AND COALESCE(j.status::text, '') NOT IN ('completed', 'cancelled', 'closed', 'paid')
      AND (v_staff OR (
        v_pilot AND (j.accepted_pilot_id = v_user_id OR EXISTS (
          SELECT 1 FROM public.job_crew jc WHERE jc.job_id = j.id AND jc.pilot_id = v_user_id
        ))
      ))
    ORDER BY j.created_at DESC
    LIMIT 40
  ) j
  LEFT JOIN public.services s ON s.id = j.service_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.pilot_id, 'type', 'pilot', 'label', COALESCE(u.full_name, 'Pilot'),
    'title', 'Pilot', 'status', p.status, 'lat', p.latitude, 'lng', p.longitude,
    'updated_at', p.updated_at
  ) ORDER BY p.updated_at DESC), '[]'::jsonb)
  INTO v_pilots
  FROM public.pilot_live_state p
  JOIN public.users u ON u.id = p.pilot_id AND u.status::text = 'active'
  WHERE p.latitude BETWEEN -90 AND 90 AND p.longitude BETWEEN -180 AND 180
    AND COALESCE(p.last_seen, p.updated_at) >= now() - interval '15 minutes'
    AND (v_staff OR (v_pilot AND p.pilot_id = v_user_id));

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', d.drone_id, 'type', 'drone', 'label', COALESCE(dr.model, 'Drone'),
    'title', COALESCE(dr.model, 'Drone'), 'status', d.status,
    'lat', COALESCE(d.gps_lat, d.latitude), 'lng', COALESCE(d.gps_lng, d.longitude),
    'updated_at', d.updated_at
  ) ORDER BY d.updated_at DESC), '[]'::jsonb)
  INTO v_drones
  FROM public.drone_live_state d
  JOIN public.drones dr ON dr.id = d.drone_id
  WHERE COALESCE(d.gps_lat, d.latitude) BETWEEN -90 AND 90
    AND COALESCE(d.gps_lng, d.longitude) BETWEEN -180 AND 180
    AND d.updated_at >= now() - interval '15 minutes'
    AND (v_staff OR (v_pilot AND (
      d.pilot_id = v_user_id OR EXISTS (
        SELECT 1 FROM public.job_drones jd
        JOIN public.jobs j ON j.id = jd.job_id
        WHERE jd.drone_id = d.drone_id
          AND (j.accepted_pilot_id = v_user_id OR EXISTS (
            SELECT 1 FROM public.job_crew jc WHERE jc.job_id = j.id AND jc.pilot_id = v_user_id
          ))
      )
    )));

  IF jsonb_array_length(v_jobs) > 0 THEN
    v_lat := (v_jobs->0->>'lat')::numeric;
    v_lng := (v_jobs->0->>'lng')::numeric;
  ELSIF jsonb_array_length(v_pilots) > 0 THEN
    v_lat := (v_pilots->0->>'lat')::numeric;
    v_lng := (v_pilots->0->>'lng')::numeric;
  ELSIF jsonb_array_length(v_drones) > 0 THEN
    v_lat := (v_drones->0->>'lat')::numeric;
    v_lng := (v_drones->0->>'lng')::numeric;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'provider', 'google_maps',
    'center', jsonb_build_object('lat', v_lat, 'lng', v_lng),
    'zoom', 10, 'jobs', v_jobs, 'pilots', v_pilots,
    'drones', v_drones, 'generated_at', now()
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ppd_get_live_operations_map() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_live_operations_map() TO authenticated, service_role;
