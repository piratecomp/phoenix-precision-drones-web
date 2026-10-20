-- Never leave an old 'safe' label on a job when the new observation is stale or incomplete.
create or replace function public.refresh_jobs_from_weather_cache()
returns void language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare j record; v_status text;
begin
  for j in select id from public.jobs where status in ('scheduled','deposit_paid','in_progress') loop
    perform public.apply_job_weather_from_cache(j.id,'scheduled_refresh');
    v_status:=public.evaluate_job_weather_safety(j.id);
    perform set_config('app.execution_mode','ai_engine',true);
    update public.jobs set weather_status=v_status,weather_checked_at=now(),updated_at=now()
     where id=j.id;
  end loop;
end $$;
