// ─────────────────────────────────────────────
// DIPZARC — GLOBAL TYPES
// ─────────────────────────────────────────────

// ── Enums (mirror Supabase DB enums) ─────────

export type UserRole   = 'user' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'banned'
export type TaskCategory =
  | 'workout' | 'study' | 'coding'
  | 'reading' | 'meditation' | 'deep_work' | 'other'

export type RankTier =
  | 'initiate' | 'bronze' | 'silver' | 'gold'
  | 'platinum' | 'diamond' | 'legend' | 'demon'

// ── Database row types ────────────────────────

export interface Profile {
  id:               string
  username:         string
  email:            string
  role:             UserRole
  status:           UserStatus
  weekly_aura:      number
  total_aura:       number
  daily_streak:     number
  weekly_streak:    number
  last_active_date: string | null
  rank_tier:        RankTier
  avatar_url:       string | null
  created_at:       string
  updated_at:       string
}

export interface Task {
  id:               string
  title:            string
  description:      string | null
  duration_minutes: number
  aura_reward:      number
  daily_limit:      number
  category:         TaskCategory
  icon:             string | null
  is_active:        boolean
  created_by:       string | null
  created_at:       string
  updated_at:       string
}

export interface Session {
  id:                 string
  user_id:            string
  task_id:            string
  started_at:         string
  ended_at:           string | null
  completed:          boolean
  aura_earned:        number
  duration_completed: number
  is_active:          boolean
  last_heartbeat:     string | null
  created_at:         string
  // Joined fields
  task?:              Task
  user?:              Profile
}

export interface LeaderboardEntry {
  id:         string
  week_start: string
  user_id:    string
  aura:       number
  final_rank: number | null
  created_at: string
  // Joined
  user?:      Profile
}

export interface RankHistory {
  id:            string
  user_id:       string
  old_tier:      RankTier | null
  new_tier:      RankTier
  aura_at_change:number
  changed_at:    string
}

export interface DailyTaskCount {
  id:      string
  user_id: string
  task_id: string
  date:    string
  count:   number
}

// ── UI / derived types ────────────────────────

/** Leaderboard row as shown in the UI */
export interface LeaderboardRow {
  rank:        number
  user_id:     string
  username:    string
  weekly_aura: number
  daily_streak:number
  rank_tier:   RankTier
  avatar_url:  string | null
}

/** Rank config for display */
export interface RankConfig {
  tier:        RankTier
  label:       string
  minAura:     number
  color:       string      // tailwind text color class
  bg:          string      // tailwind bg color class
  border:      string      // tailwind border color class
  glow:        string      // tailwind shadow class
  icon:        string      // emoji or icon name
}

/** Task with user's daily completion count */
export interface TaskWithCount extends Task {
  completedToday: number
  canStart:       boolean   // completedToday < daily_limit
}

/** Active timer state */
export interface TimerState {
  sessionId:      string
  task:           Task
  startedAt:      Date
  elapsedSeconds: number
  auraEarned:     number
  isRunning:      boolean
  isComplete:     boolean
}

/** Share card data */
export interface ShareCardData {
  username:    string
  taskTitle:   string
  duration:    number      // minutes
  auraEarned:  number
  rank:        RankTier
  streak:      number
  completedAt: Date
}

// ── API response types ────────────────────────

export interface CompleteSessionResponse {
  success:     boolean
  aura_earned: number
  error?:      string
}

export interface ApiError {
  message: string
  code?:   string
}

// ── Store types ───────────────────────────────

export interface AppState {
  profile:    Profile | null
  activeTimer: TimerState | null
  setProfile: (p: Profile | null) => void
  setActiveTimer: (t: TimerState | null) => void
  updateTimerElapsed: (seconds: number, aura: number) => void
}
