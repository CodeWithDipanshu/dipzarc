import { createClient } from '@/lib/supabase/client'
import type { Session, CompleteSessionResponse } from '@/types'

const supabase = createClient()

export const sessionService = {
  /** Start a new session for a task */
  async startSession(taskId: string): Promise<Session> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check for existing active session (anti-cheat)
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (existing) throw new Error('You already have an active session. Complete it first.')

    const { data, error } = await supabase
      .from('sessions')
      .insert({ user_id: user.id, task_id: taskId })
      .select('*, task:tasks(*)')
      .single()

    if (error) throw error
    return data as Session
  },

  /** Send a heartbeat to keep the session alive (call every 30s) */
  async heartbeat(sessionId: string): Promise<void> {
    const { error } = await supabase.rpc('session_heartbeat', { p_session_id: sessionId })
    if (error) console.error('Heartbeat failed:', error)
  },

  /** Complete a session and award aura via DB function */
  async completeSession(
    sessionId: string,
    durationCompleted: number,
    auraEarned: number,
  ): Promise<CompleteSessionResponse> {
    const { data, error } = await supabase.rpc('complete_session', {
      p_session_id:         sessionId,
      p_duration_completed: durationCompleted,
      p_aura_earned:        auraEarned,
    })
    if (error) throw error
    return data as CompleteSessionResponse
  },

  /** Abandon (cancel) an active session — no aura awarded */
  async abandonSession(sessionId: string): Promise<void> {
    await supabase
      .from('sessions')
      .update({ is_active: false, ended_at: new Date().toISOString(), completed: false })
      .eq('id', sessionId)
  },

  /** Fetch the user's active session (if any) */
  async getActiveSession(userId: string): Promise<Session | null> {
    const { data } = await supabase
      .from('sessions')
      .select('*, task:tasks(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    return data ?? null
  },

  /** Increment daily task count (called after completion) */
  async incrementDailyCount(userId: string, taskId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    await supabase.rpc('increment_daily_count', {
      p_user_id: userId,
      p_task_id: taskId,
      p_date:    today,
    })
  },
}
