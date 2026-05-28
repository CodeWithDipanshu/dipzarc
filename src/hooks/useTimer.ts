'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAppStore }    from '@/store/useAppStore'
import { sessionService } from '@/services/sessionService'
import { auraPerSecond }  from '@/utils/ranks'

const HEARTBEAT_INTERVAL = 30_000  // 30s
const TICK_INTERVAL      = 1_000   // 1s

export function useTimer() {
  const { activeTimer, updateTimerElapsed, setActiveTimer } = useAppStore()
  const tickRef      = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  const stopIntervals = useCallback(() => {
    if (tickRef.current)      clearInterval(tickRef.current)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    tickRef.current      = null
    heartbeatRef.current = null
  }, [])

  // Tick every second + heartbeat every 30s while running
  useEffect(() => {
    if (!activeTimer?.isRunning) {
      stopIntervals()
      return
    }

    tickRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - activeTimer.startedAt.getTime()) / 1000,
      )
      const aura = Math.floor(elapsed * auraPerSecond(activeTimer.task))
      updateTimerElapsed(elapsed, aura)
    }, TICK_INTERVAL)

    heartbeatRef.current = setInterval(() => {
      if (activeTimer.sessionId) {
        sessionService.heartbeat(activeTimer.sessionId).catch(console.error)
      }
    }, HEARTBEAT_INTERVAL)

    return stopIntervals
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimer?.isRunning, activeTimer?.sessionId])

  // Complete session — awards aura, increments daily count
  const complete = useCallback(async () => {
    if (!activeTimer) return null
    stopIntervals()
    try {
      const result = await sessionService.completeSession(
        activeTimer.sessionId,
        activeTimer.elapsedSeconds,
        activeTimer.auraEarned,
      )
      if (result?.success) {
        const supabase = (await import('@/lib/supabase/client')).createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await sessionService.incrementDailyCount(user.id, activeTimer.task.id)
        }
      }
      setActiveTimer({ ...activeTimer, isRunning: false, isComplete: true })
      return result
    } catch (err) {
      console.error('Complete session error:', err)
      return null
    }
  }, [activeTimer, stopIntervals, setActiveTimer])

  // Abandon session — no aura awarded
  const abandon = useCallback(async () => {
    if (!activeTimer) return
    stopIntervals()
    try {
      await sessionService.abandonSession(activeTimer.sessionId)
    } catch (err) {
      console.error('Abandon session error:', err)
    } finally {
      setActiveTimer(null)
    }
  }, [activeTimer, stopIntervals, setActiveTimer])

  const progress = activeTimer
    ? Math.min(activeTimer.elapsedSeconds / (activeTimer.task.duration_minutes * 60), 1)
    : 0

  const isOvertime = activeTimer
    ? activeTimer.elapsedSeconds > activeTimer.task.duration_minutes * 60
    : false

  return { activeTimer, progress, isOvertime, complete, abandon }
}
