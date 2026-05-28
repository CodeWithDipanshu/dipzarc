'use client'

import { useEffect, useState } from 'react'
import { Zap, Clock, Lock, ChevronRight, X, Play } from 'lucide-react'
import { PageHeader }  from '@/components/ui/PageHeader'
import { PageLoading } from '@/components/ui/Loading'
import { RankBadge }   from '@/components/ui/RankBadge'
import { ActiveTimerWidget } from '@/components/timer/ActiveTimerWidget'
import { useProfile }  from '@/hooks/useProfile'
import { useAppStore } from '@/store/useAppStore'
import { taskService } from '@/services/taskService'
import { sessionService } from '@/services/sessionService'
import { cn } from '@/utils/helpers'
import type { TaskWithCount } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', workout: 'Workout', study: 'Study',
  coding: 'Coding', reading: 'Reading', meditation: 'Meditation',
  deep_work: 'Deep Work', other: 'Other',
}

const ICONS: Record<string, string> = {
  workout: '💪', study: '📚', coding: '💻',
  reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
}

export default function TasksPage() {
  const profile = useProfile()
  const { activeTimer, setActiveTimer } = useAppStore()

  const [tasks,    setTasks]    = useState<TaskWithCount[]>([])
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState<TaskWithCount | null>(null)
  const [starting, setStarting] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const loadTasks = async () => {
    if (!profile) return
    const data = await taskService.getTasksWithCounts(profile.id)
    setTasks(data)
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [profile?.id])

  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))]
  const visible    = filter === 'all' ? tasks : tasks.filter(t => t.category === filter)

  const handleStart = async () => {
    if (!selected) return
    setStarting(true)
    setError(null)
    try {
      const session = await sessionService.startSession(selected.id)
      setActiveTimer({
        sessionId:      session.id,
        task:           selected,
        startedAt:      new Date(session.started_at),
        elapsedSeconds: 0,
        auraEarned:     0,
        isRunning:      true,
        isComplete:     false,
      })
      setSelected(null)
      await loadTasks()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStarting(false)
    }
  }

  if (!profile || loading) return <PageLoading />

  return (
    <div className="min-h-full">
      <PageHeader title="Tasks" subtitle="Choose your grind. Earn your aura." />

      <div className="p-5 space-y-5">

        {/* Active timer pinned at top */}
        {activeTimer && <ActiveTimerWidget />}

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                'font-hud font-bold text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all duration-200',
                filter === cat
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : 'border-white/10 text-slate-600 hover:border-purple-500/40 hover:text-slate-400',
              )}
            >
              {ICONS[cat] ?? ''} {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Task grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              locked={!!activeTimer}
              onClick={() => !activeTimer && task.canStart && setSelected(task)}
            />
          ))}
        </div>

        {visible.length === 0 && (
          <div className="text-center py-16 text-slate-700 font-hud uppercase tracking-widest text-sm">
            No tasks in this category.
          </div>
        )}
      </div>

      {/* ── START SESSION MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
             onClick={() => setSelected(null)}>
          <div className="card-purple w-full max-w-sm p-6 animate-rank-unlock"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ICONS[selected.category]}</span>
                <div>
                  <h3 className="font-hud font-bold text-base text-slate-100 tracking-wider">
                    {selected.title}
                  </h3>
                  <RankBadge tier="initiate" size="sm" className="mt-1 opacity-0 h-0" />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {selected.description && (
              <p className="text-slate-500 text-sm font-hud mb-4 leading-relaxed">
                {selected.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: 'Duration',  value: `${selected.duration_minutes}m`, icon: Clock },
                { label: 'Aura',      value: `+${selected.aura_reward.toLocaleString()}`, icon: Zap },
                { label: 'Today',     value: `${selected.completedToday}/${selected.daily_limit}`, icon: ChevronRight },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/[0.05]">
                  <Icon size={12} className="text-purple-400 mx-auto mb-1" />
                  <div className="font-hud font-bold text-sm text-slate-200">{value}</div>
                  <div className="font-hud text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Aura-per-minute hint */}
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 mb-5">
              <Zap size={11} className="text-purple-400 flex-shrink-0" />
              <span className="font-hud text-[11px] text-slate-500">
                Earn <span className="text-purple-400 font-bold">
                  {(selected.aura_reward / selected.duration_minutes).toFixed(1)} aura/min
                </span> — don't quit early.
              </span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-hud rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={starting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {starting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Play size={14} />}
              {starting ? 'Starting…' : 'Start Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Individual task card ───────────────────────────────────
function TaskCard({
  task, locked, onClick,
}: {
  task:    TaskWithCount
  locked:  boolean
  onClick: () => void
}) {
  const done    = !task.canStart
  const ICONS: Record<string, string> = {
    workout: '💪', study: '📚', coding: '💻',
    reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
  }
  const pct = (task.completedToday / task.daily_limit) * 100

  return (
    <button
      onClick={onClick}
      disabled={locked || done}
      className={cn(
        'card text-left p-5 w-full transition-all duration-200 group relative overflow-hidden',
        done || locked
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(147,51,234,0.08)] cursor-pointer',
      )}
    >
      {/* hover shimmer */}
      {!locked && !done && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
             style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.05), transparent)' }} />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{ICONS[task.category] ?? '🎯'}</span>
          {done
            ? <Lock size={14} className="text-slate-700 mt-1" />
            : locked
              ? <Lock size={14} className="text-slate-700 mt-1" />
              : <ChevronRight size={14} className="text-slate-700 group-hover:text-purple-400 transition-colors mt-1" />
          }
        </div>

        <h3 className="font-hud font-bold text-sm text-slate-200 mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-[11px] text-slate-600 font-hud mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-slate-600" />
            <span className="font-hud text-[10px] text-slate-600">{task.duration_minutes}min</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-purple-400" />
            <span className="font-hud font-bold text-[11px] text-purple-400">
              +{task.aura_reward.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Daily limit progress */}
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width:      `${pct}%`,
              background: done ? '#475569' : undefined,
              boxShadow:  done ? 'none' : undefined,
            }}
          />
        </div>
        <div className="font-hud text-[9px] text-slate-700 mt-1 uppercase tracking-widest">
          {task.completedToday}/{task.daily_limit} today
        </div>
      </div>
    </button>
  )
}
