-- ─────────────────────────────────────────────────────────────
-- DIPZARC — SCHEMA PATCH (run after dipzarc_supabase_schema.sql)
-- Adds increment_daily_count RPC referenced by sessionService
-- ─────────────────────────────────────────────────────────────

create or replace function public.increment_daily_count(
  p_user_id uuid,
  p_task_id uuid,
  p_date    date
)
returns void language plpgsql security definer as $$
begin
  insert into public.daily_task_counts (user_id, task_id, date, count)
  values (p_user_id, p_task_id, p_date, 1)
  on conflict (user_id, task_id, date)
  do update set count = daily_task_counts.count + 1;
end;
$$;
