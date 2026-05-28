import { createClient } from '@/lib/supabase/client'
import type { Profile, UserStatus } from '@/types'

const supabase = createClient()

export const adminService = {
  /** Fetch all users (admin only) */
  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  /** Approve a pending user */
  async approveUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId)
    if (error) throw error
  },

  /** Ban a user */
  async banUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'banned' })
      .eq('id', userId)
    if (error) throw error
  },

  /** Reset a user's weekly aura */
  async resetUserWeeklyAura(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ weekly_aura: 0 })
      .eq('id', userId)
    if (error) throw error
  },

  /** Trigger manual weekly reset for all users (calls DB function) */
  async triggerWeeklyReset(): Promise<void> {
    const { error } = await supabase.rpc('weekly_reset')
    if (error) throw error
  },

  /** Get pending users count */
  async getPendingCount(): Promise<number> {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    return count ?? 0
  },
}
