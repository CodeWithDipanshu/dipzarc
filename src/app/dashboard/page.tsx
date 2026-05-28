'use client'

import { useEffect, useState } from 'react'
import { Zap, Flame, Target, Trophy, TrendingUp, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageHeader }   from '@/components/ui/PageHeader'
import { StatCard }     from '@/components/ui/StatCard'
import { AuraCounter }  from '@/components/ui/AuraCounter'
import { RankBadge }    from '@/components/ui/RankBadge'
import { PageLoading }  from '@/components/ui/Loading'
import { ActiveTimerWidget } from '@/components/timer/ActiveTimerWidget'
import { useAppStore }  from '@/store/useAppStore'
import { useProfile }   from '@/hooks/useProfile'
import { taskService }  from '@/services/taskService'
import { leaderboardService } from '@/services/leaderboardService'
import { sessionService }     from '@/services/sessionService'
import { RANK_CONFIG, auraToNextTier, tierProgress } from '@/utils/ranks'
import { formatAura, cn } from '@/utils/helpers'
import type { TaskWithCount, LeaderboardRow } from '@/types'

export default function DashboardPage() {
  const router  = useRouter()
  const profile = useProfile()
  const { activeTimer, setActiveTimer } = useAppStore()

  const [tasks,    setTasks]    = useState<TaskWithCount[]>([])
  const [topUsers, setTopUsers] = useState<LeaderboardRow[]>([])
  const [myRank,   setMyRank]   = useState<number | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const [t, lb, existingSession] = await Promise.all([
        taskService.getTasksWithCounts(profile.id),
        leaderboardService.getCurrentWeek(6),
        sessionService.getActiveSession(profile.id),
      ])
      setTasks(t.slice(0, 6))
      setTopUsers(lb)
      setMyRank(lb.find(r => r.user_id === profile.id)?.rank ?? null)

      // Restore active session if page was refreshed mid-session
      if (existingSession && !activeTimer) {
        setActiveTimer({
          sessionId:      existingSession.id,
          task:           existingSession.task!,
          startedAt:      new Date(existingSession.started_at),
          elapsedSeconds: Math.floor((Date.now() - new Date(existingSession.started_at).getTime()) / 1000),
          auraEarned:     0,
          isRunning:      true,
          isComplete:     false,
        })
      }
      setLoading(false)
    }
    load()
  }, [profile?.id])

  const startTask = async (taskId: string) => {
    if (activeTimer) return
    try {
      const session = await sessionService.startSession(taskId)
      const task    = tasks.find(t => t.id === taskId)!
      setActiveTimer({
        sessionId:      session.id,
        task,
        startedAt:      new Date(session.started_at),
        elapsedSeconds: 0,
        auraEarned:     0,
        isRunning:      true,
        isComplete:     false,
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (!profile || loading) return <PageLoading />

  const rankCfg      = RANK_CONFIG[profile.rank_tier]
  const nextAura     = auraToNextTier(profile.rank_tier, profile.total_aura)
  const progress     = tierProgress(profile.rank_tier, profile.total_aura)

  return (
    <div className="min-h-full">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${profile.username}`}
        right={
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-aura-pulse" />
            <span className="font-hud font-bold text-purple-400 text-sm">
              {formatAura(profile.weekly_aura)} AURA
            </span>
          </div>
        }
      />

      <div className="p-5 space-y-5">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Weekly Aura"
            value={<AuraCounter value={profile.weekly_aura} />}
            sub={myRank ? `Rank #${myRank} this week` : undefined}
            icon={Zap}
            variant="purple"
          />
          <StatCard
            label="Daily Streak"
            value={`🔥 ${profile.daily_streak}`}
            sub={profile.daily_streak >= 7 ? 'On fire!' : 'Keep going!'}
            icon={Flame}
            variant="gold"
          />
          <StatCard
            label="Total Aura"
            value={formatAura(profile.total_aura)}
            sub="all time"
            icon={TrendingUp}
            variant="blue"
          />
          <StatCard
            label="Rank"
            value={<RankBadge tier={profile.rank_tier} size="sm" />}
            sub={nextAura ? `${formatAura(nextAura)} to next tier` : 'Max rank!'}
            icon={Trophy}
          />
        </div>

        {/* ── RANK PROGRESS BAR ── */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="section-header mb-0">Rank Progress</span>
            <span className={cn('font-hud text-xs font-bold', rankCfg.color)}>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={cn('font-hud text-[10px] font-bold', rankCfg.color)}>{rankCfg.label}</span>
            {nextAura !== null && (
              <span className="font-hud text-[10px] text-slate-600">
                {formatAura(nextAura)} to next
              </span>
            )}
          </div>
        </div>

        {/* ── ACTIVE TIMER (if running) ── */}
        {activeTimer && (
          <ActiveTimerWidget />
        )}

        {/* ── MAIN GRID: tasks + leaderboard ── */}
        <div className="grid lg:grid-cols-5 gap-4">

          {/* QUICK START TASKS */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <span className="section-header mb-0">Start a Session</span>
              <button onClick={() => router.push('/tasks')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-hud uppercase tracking-wider transition-colors">
                View All →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {tasks.map(task => (
                <TaskQuickCard
                  key={task.id}
                  task={task}
                  locked={!!activeTimer || !task.canStart}
                  onStart={() => startTask(task.id)}
                />
              ))}
            </div>
          </div>

          {/* LEADERBOARD PREVIEW */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <span className="section-header mb-0">This Week</span>
              <button onClick={() => router.push('/leaderboard')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-hud uppercase tracking-wider transition-colors">
                Full Board →
              </button>
            </div>
            <div className="card divide-y divide-white/[0.04]">
              {topUsers.map((user, i) => (
                <div key={user.user_id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    user.user_id === profile.id && 'bg-purple-500/5',
                  )}>
                  <span className={cn(
                    'font-hud font-bold text-sm w-5 text-center',
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-600',
                  )}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold font-hud flex-shrink-0">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-hud font-semibold text-xs truncate',
                      user.user_id === profile.id ? 'text-purple-400' : 'text-slate-300',
                    )}>
                      {user.username}{user.user_id === profile.id && ' (you)'}
                    </div>
                    <div className="text-[10px] text-yellow-500">🔥{user.daily_streak}</div>
                  </div>
                  <span className="font-hud font-bold text-xs text-purple-400">
                    {formatAura(user.weekly_aura)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Task quick-start card ──────────────────────────────────
function TaskQuickCard({
  task, locked, onStart,
}: {
  task:    TaskWithCount
  locked:  boolean
  onStart: () => void
}) {
  const ICONS: Record<string, string> = {
    workout: '💪', study: '📚', coding: '💻',
    reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
  }

  return (
    <button
      onClick={onStart}
      disabled={locked}
      className={cn(
        'card text-left p-4 transition-all duration-200 group relative overflow-hidden',
        locked
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-purple-500/40 hover:shadow-[0_0_16px_rgba(147,51,234,0.08)] cursor-pointer',
        !task.canStart && 'opacity-40',
      )}
    >
      {/* shimmer on hover */}
      {!locked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
             style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.04), transparent)' }} />
      )}
      <div className="relative">
        <div className="text-2xl mb-2">{ICONS[task.category] ?? '🎯'}</div>
        <div className="font-hud font-bold text-sm text-slate-200 mb-0.5">{task.title}</div>
        <div className="text-[10px] text-slate-600 font-hud mb-2">
          {task.duration_minutes}min · {task.completedToday}/{task.daily_limit} today
        </div>
        <div className="flex items-center gap-1">
          <Zap size={10} className="text-purple-400" />
          <span className="font-hud font-bold text-xs text-purple-400">+{task.aura_reward.toLocaleString()} AURA</span>
        </div>
      </div>
    </button>
  )
}
