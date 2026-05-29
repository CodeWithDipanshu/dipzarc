import { createClient } from '@/lib/supabase/client'
import type { LeaderboardRow, RankTier } from '@/types'

const supabase = createClient()

export const leaderboardService = {
  /** Current week live leaderboard — sorted by weekly_aura */
  async getCurrentWeek(limit = 50): Promise<LeaderboardRow[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, weekly_aura, daily_streak, rank_tier, avatar_url')
      .eq('status', 'approved')
      .order('weekly_aura', { ascending: false })
      .limit(limit)

    return (data ?? []).map((p, i) => ({
      rank:         i + 1,
      user_id:      p.id,
      username:     p.username,
      weekly_aura:  p.weekly_aura,
      daily_streak: p.daily_streak,
      rank_tier:    p.rank_tier as RankTier,
      avatar_url:   p.avatar_url,
    }))
  },

  /** All-time total aura leaderboard */
  async getAllTime(limit = 50): Promise<LeaderboardRow[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, total_aura, daily_streak, rank_tier, avatar_url')
      .eq('status', 'approved')
      .order('total_aura', { ascending: false })
      .limit(limit)

    return (data ?? []).map((p, i) => ({
      rank:         i + 1,
      user_id:      p.id,
      username:     p.username,
      weekly_aura:  p.total_aura,
      daily_streak: p.daily_streak,
      rank_tier:    p.rank_tier as RankTier,
      avatar_url:   p.avatar_url,
    }))
  },

  /** Get a user's current rank position */
  async getUserRank(userId: string): Promise<number | null> {
    const lb = await leaderboardService.getCurrentWeek(200)
    const entry = lb.find(r => r.user_id === userId)
    return entry?.rank ?? null
  },

  /** Historical leaderboard for a given week */
  async getHistoricalWeek(weekStart: string): Promise<LeaderboardRow[]> {
    const { data } = await supabase
      .from('leaderboard_history')
      .select('*, user:profiles(username, rank_tier, avatar_url, daily_streak)')
      .eq('week_start', weekStart)
      .order('final_rank', { ascending: true })

    return (data ?? []).map((row: any) => ({
      rank:         row.final_rank,
      user_id:      row.user_id,
      username:     row.user?.username ?? '—',
      weekly_aura:  row.aura,
      daily_streak: row.user?.daily_streak ?? 0,
      rank_tier:    (row.user?.rank_tier ?? 'initiate') as RankTier,
      avatar_url:   row.user?.avatar_url ?? null,
    }))
  },
}
