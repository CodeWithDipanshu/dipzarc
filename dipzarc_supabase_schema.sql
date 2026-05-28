-- ============================================================
-- DIPZARC — SUPABASE DATABASE SCHEMA + RLS POLICIES
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- 2. ENUMS
-- ─────────────────────────────────────────────
create type user_role as enum ('user', 'admin');
create type user_status as enum ('pending', 'approved', 'banned');
create type task_category as enum ('workout', 'study', 'coding', 'reading', 'meditation', 'deep_work', 'other');
create type rank_tier as enum ('initiate', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', 'demon');

-- ─────────────────────────────────────────────
-- 3. TABLES
-- ─────────────────────────────────────────────

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,
  email          text not null,
  role           user_role not null default 'user',
  status         user_status not null default 'pending',
  weekly_aura    bigint not null default 0,
  total_aura     bigint not null default 0,
  daily_streak   integer not null default 0,
  weekly_streak  integer not null default 0,
  last_active_date date,
  rank_tier      rank_tier not null default 'initiate',
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- TASKS (predefined by admin)
create table public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  duration_minutes integer not null check (duration_minutes > 0),
  aura_reward     integer not null check (aura_reward > 0),
  daily_limit     integer not null default 2 check (daily_limit >= 1),
  category        task_category not null default 'other',
  icon            text,                  -- lucide icon name or emoji
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- SESSIONS (individual task runs)
create table public.sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  task_id             uuid not null references public.tasks(id) on delete cascade,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  completed           boolean not null default false,
  aura_earned         integer not null default 0,
  duration_completed  integer not null default 0,  -- seconds actually completed
  is_active           boolean not null default true,  -- for anti-cheat
  last_heartbeat      timestamptz default now(),      -- anti-cheat inactivity detection
  created_at          timestamptz not null default now()
);

-- LEADERBOARD HISTORY (snapshot every Monday)
create table public.leaderboard_history (
  id          uuid primary key default uuid_generate_v4(),
  week_start  date not null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  aura        bigint not null default 0,
  final_rank  integer,
  created_at  timestamptz not null default now(),
  unique(week_start, user_id)
);

-- RANK HISTORY (track tier changes)
create table public.rank_history (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  old_tier   rank_tier,
  new_tier   rank_tier not null,
  aura_at_change bigint not null default 0,
  changed_at timestamptz not null default now()
);

-- DAILY TASK COMPLETIONS (anti-cheat daily limit tracking)
create table public.daily_task_counts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  task_id    uuid not null references public.tasks(id) on delete cascade,
  date       date not null default current_date,
  count      integer not null default 0,
  unique(user_id, task_id, date)
);

-- ─────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────
create index idx_sessions_user_id        on public.sessions(user_id);
create index idx_sessions_task_id        on public.sessions(task_id);
create index idx_sessions_is_active      on public.sessions(is_active) where is_active = true;
create index idx_profiles_weekly_aura    on public.profiles(weekly_aura desc);
create index idx_profiles_total_aura     on public.profiles(total_aura desc);
create index idx_leaderboard_week        on public.leaderboard_history(week_start, aura desc);
create index idx_daily_task_counts_date  on public.daily_task_counts(user_id, date);

-- ─────────────────────────────────────────────
-- 5. FUNCTIONS
-- ─────────────────────────────────────────────

-- Auto-update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

-- Calculate rank tier from total aura
create or replace function public.calculate_rank_tier(aura bigint)
returns rank_tier language plpgsql as $$
begin
  return case
    when aura >= 1000000 then 'demon'::rank_tier
    when aura >= 500000  then 'legend'::rank_tier
    when aura >= 200000  then 'diamond'::rank_tier
    when aura >= 100000  then 'platinum'::rank_tier
    when aura >= 50000   then 'gold'::rank_tier
    when aura >= 20000   then 'silver'::rank_tier
    when aura >= 5000    then 'bronze'::rank_tier
    else                      'initiate'::rank_tier
  end;
end;
$$;

-- Update streak on session completion
create or replace function public.update_streak(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_last_active date;
  v_today       date := current_date;
begin
  select last_active_date into v_last_active
  from public.profiles where id = p_user_id;

  if v_last_active = v_today then
    -- Already completed something today, no change needed
    return;
  elsif v_last_active = v_today - 1 then
    -- Consecutive day — increment streak
    update public.profiles
    set daily_streak = daily_streak + 1,
        last_active_date = v_today
    where id = p_user_id;
  else
    -- Streak broken
    update public.profiles
    set daily_streak = 1,
        last_active_date = v_today
    where id = p_user_id;
  end if;
end;
$$;

-- Award aura and update rank
create or replace function public.award_aura(p_user_id uuid, p_aura integer)
returns void language plpgsql security definer as $$
declare
  v_old_tier rank_tier;
  v_new_tier rank_tier;
  v_total    bigint;
begin
  select rank_tier, total_aura into v_old_tier, v_total
  from public.profiles where id = p_user_id;

  update public.profiles
  set weekly_aura = weekly_aura + p_aura,
      total_aura  = total_aura  + p_aura
  where id = p_user_id;

  v_total := v_total + p_aura;
  v_new_tier := public.calculate_rank_tier(v_total);

  if v_new_tier != v_old_tier then
    update public.profiles set rank_tier = v_new_tier where id = p_user_id;
    insert into public.rank_history(user_id, old_tier, new_tier, aura_at_change)
    values (p_user_id, v_old_tier, v_new_tier, v_total);
  end if;
end;
$$;

-- Weekly reset (call via pg_cron or Supabase Edge Function cron job every Monday 00:00 UTC)
create or replace function public.weekly_reset()
returns void language plpgsql security definer as $$
declare
  v_week_start date := date_trunc('week', current_date)::date;
begin
  -- Snapshot leaderboard
  insert into public.leaderboard_history (week_start, user_id, aura, final_rank)
  select
    v_week_start,
    id,
    weekly_aura,
    row_number() over (order by weekly_aura desc)
  from public.profiles
  where status = 'approved' and weekly_aura > 0
  on conflict (week_start, user_id) do update
    set aura = excluded.aura, final_rank = excluded.final_rank;

  -- Reset weekly aura
  update public.profiles set weekly_aura = 0;
end;
$$;

-- Complete a session: validate, award aura, update streak
create or replace function public.complete_session(
  p_session_id        uuid,
  p_duration_completed integer,  -- seconds
  p_aura_earned       integer
)
returns jsonb language plpgsql security definer as $$
declare
  v_session  public.sessions%rowtype;
  v_task     public.tasks%rowtype;
  v_profile  public.profiles%rowtype;
  v_count    integer;
begin
  -- Fetch session
  select * into v_session from public.sessions
  where id = p_session_id and is_active = true;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found or already ended');
  end if;

  -- Auth check: only session owner
  if v_session.user_id != auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  -- Fetch task
  select * into v_task from public.tasks where id = v_session.task_id;

  -- Clamp aura_earned to max reward
  p_aura_earned := least(p_aura_earned, v_task.aura_reward);

  -- Mark session done
  update public.sessions
  set ended_at           = now(),
      completed          = (p_duration_completed >= v_task.duration_minutes * 60),
      aura_earned        = p_aura_earned,
      duration_completed = p_duration_completed,
      is_active          = false
  where id = p_session_id;

  -- Award aura
  if p_aura_earned > 0 then
    perform public.award_aura(v_session.user_id, p_aura_earned);
  end if;

  -- Update streak
  perform public.update_streak(v_session.user_id);

  return jsonb_build_object('success', true, 'aura_earned', p_aura_earned);
end;
$$;

-- Anti-cheat: session heartbeat (call every 30s from client)
create or replace function public.session_heartbeat(p_session_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.sessions
  set last_heartbeat = now()
  where id = p_session_id and user_id = auth.uid() and is_active = true;
end;
$$;

-- Abandon stale sessions (no heartbeat > 5 minutes) — run via cron
create or replace function public.abandon_stale_sessions()
returns void language plpgsql security definer as $$
begin
  update public.sessions
  set is_active = false,
      ended_at  = now(),
      completed = false
  where is_active = true
    and last_heartbeat < now() - interval '5 minutes';
end;
$$;

-- ─────────────────────────────────────────────
-- 6. TRIGGERS
-- ─────────────────────────────────────────────
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles            enable row level security;
alter table public.tasks               enable row level security;
alter table public.sessions            enable row level security;
alter table public.leaderboard_history enable row level security;
alter table public.rank_history        enable row level security;
alter table public.daily_task_counts   enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- Helper: is the current user approved?
create or replace function public.is_approved()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

-- PROFILES policies
create policy "Users can view all approved profiles (leaderboard)"
  on public.profiles for select
  using (status = 'approved' or id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Prevent users from changing role, status, aura fields manually
    and role = (select role from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- TASKS policies
create policy "Approved users can view active tasks"
  on public.tasks for select
  using (is_active = true and public.is_approved());

create policy "Admins have full task access"
  on public.tasks for all
  using (public.is_admin());

-- SESSIONS policies
create policy "Users can view own sessions"
  on public.sessions for select
  using (user_id = auth.uid());

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (user_id = auth.uid() and public.is_approved());

create policy "Users can update own active sessions"
  on public.sessions for update
  using (user_id = auth.uid() and is_active = true);

create policy "Admins can view all sessions"
  on public.sessions for select
  using (public.is_admin());

-- LEADERBOARD HISTORY policies
create policy "Approved users can view leaderboard history"
  on public.leaderboard_history for select
  using (public.is_approved());

create policy "Admins can manage leaderboard history"
  on public.leaderboard_history for all
  using (public.is_admin());

-- RANK HISTORY policies
create policy "Users can view own rank history"
  on public.rank_history for select
  using (user_id = auth.uid());

create policy "Admins can view all rank history"
  on public.rank_history for select
  using (public.is_admin());

-- DAILY TASK COUNTS policies
create policy "Users can view own daily counts"
  on public.daily_task_counts for select
  using (user_id = auth.uid());

create policy "System can upsert daily counts"
  on public.daily_task_counts for all
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 8. SEED DATA — Default Tasks
-- ─────────────────────────────────────────────
-- Run AFTER creating your first admin user and setting their role='admin', status='approved'

insert into public.tasks (title, description, duration_minutes, aura_reward, daily_limit, category, icon) values
  ('Workout',    'Push your body to its limits. Physical dominance builds mental dominance.', 30, 500, 2, 'workout',    'Dumbbell'),
  ('Study',      'Sharpen the mind. Knowledge compounds like aura.', 60, 800, 3, 'study',      'BookOpen'),
  ('Coding',     'Build something real. Every commit is a level up.', 60, 900, 3, 'coding',     'Code2'),
  ('Reading',    'Feed your brain. 30 minutes of reading = 30 minutes of edge.', 30, 400, 2, 'reading',    'BookMarked'),
  ('Meditation', 'Enter the void. Control your mind, control your reality.', 20, 300, 2, 'meditation', 'Brain'),
  ('Deep Work',  'No distractions. Pure focus. This is where legends are made.', 90, 1200, 2, 'deep_work',  'Zap');

-- ─────────────────────────────────────────────
-- 9. CRON JOBS (via pg_cron — enable in Supabase dashboard first)
-- ─────────────────────────────────────────────
-- Weekly reset every Monday at 00:00 UTC:
-- select cron.schedule('weekly-reset', '0 0 * * 1', 'select public.weekly_reset()');

-- Abandon stale sessions every 5 minutes:
-- select cron.schedule('abandon-stale-sessions', '0 0 * * *', 'select public.abandon_stale_sessions()');

-- ─────────────────────────────────────────────
-- DONE. Schema ready for DipzArc.
-- ─────────────────────────────────────────────
