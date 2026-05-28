import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const supabase = createClient()

export const profileService = {
  /** Fetch the current user's profile */
  async getMyProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return data ?? null
  },

  /** Update avatar or other user-editable fields */
  async updateProfile(updates: Partial<Pick<Profile, 'username' | 'avatar_url'>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  /** Fetch any profile by ID */
  async getProfileById(id: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    return data ?? null
  },

  /** Fetch session history for a user */
  async getSessionHistory(userId: string, limit = 20) {
    const { data } = await supabase
      .from('sessions')
      .select('*, task:tasks(title, category, icon)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  },

  /** Fetch rank history for a user */
  async getRankHistory(userId: string) {
    const { data } = await supabase
      .from('rank_history')
      .select('*')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })
    return data ?? []
  },
}
