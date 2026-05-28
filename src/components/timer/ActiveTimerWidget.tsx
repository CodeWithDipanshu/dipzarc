'use client'

import { useState } from 'react'
import { Zap, X, CheckCircle2 } from 'lucide-react'
import { useTimer }    from '@/hooks/useTimer'
import { useAppStore } from '@/store/useAppStore'
import { formatTime, cn } from '@/utils/helpers'

export function ActiveTimerWidget() {
  const { activeTimer, progress, isOvertime, complete, abandon } = useTimer()
  const { setActiveTimer } = useAppStore()
  const [completing, setCompleting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [auraWon,    setAuraWon]    = useState(0)

  if (!activeTimer) return null

  const circumference = 2 * Math.PI * 52
  const offset        = circumference * (1 - progress)

  const ICONS: Record<string, string> = {
    workout: '💪', study: '📚', coding: '💻',
    reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
  }

  const handleComplete = async () => {
    setCompleting(true)
    const result = await complete()
    if (result?.success) {
      setAuraWon(result.aura_earned)
      setDone(true)
      setTimeout(() => {
        setActiveTimer(null)
        window.location.reload()
      }, 2800)
    }
    setCompleting(false)
  }

  const handleAbandon = async () => {
    if (!confirm('Abandon session? You will earn 0 aura.')) return
    await abandon()
  }

  // ── Completion celebration ─────────────────────────────
  if (done) {
    return (
      <div className="card-purple p-8 text-center animate-rank-unlock">
        <CheckCircle2 size={44} className="text-purple-400 mx-auto mb-3 animate-float" />
        <div className="font-hud text-xl font-bold text-slate-100 tracking-widest uppercase mb-2">
          Session Complete!
        </div>
        <div className="font-hud text-4xl font-bold text-purple-400 text-glow-purple mb-1">
          +{auraWon.toLocaleString()}
        </div>
        <div className="font-hud text-sm text-purple-500 uppercase tracking-widest">AURA EARNED</div>
        <p className="text-slate-600 text-xs font-hud mt-3 tracking-wider">
          Updating your arc…
        </p>
      </div>
    )
  }

  return (
    <div
      className="card p-5 relative overflow-hidden"
      style={{
        borderColor: isOvertime ? 'rgba(34,197,94,0.5)' : 'rgba(147,51,234,0.4)',
        boxShadow: isOvertime
          ? '0 0 30px rgba(34,197,94,0.1)'
          : '0 0 30px rgba(147,51,234,0.1)',
      }}
    >
      {/* Pulsing bg glow */}
      <div
        className="absolute inset-0 opacity-5 animate-aura-pulse pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #9333ea, transparent 70%)' }}
      />

      {/* Overtime banner */}
      {isOvertime && (
        <div className="absolute top-0 left-0 right-0 bg-green-500/20 border-b border-green-500/30 py-1 text-center">
          <span className="font-hud text-[10px] font-bold text-green-400 uppercase tracking-widest">
            ⚡ Overtime — Bonus aura accumulating
          </span>
        </div>
      )}

      <div className={cn('relative flex items-center gap-6', isOvertime && 'mt-6')}>

        {/* SVG ring */}
        <div className="flex-shrink-0 relative w-28 h-28">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none"
                    stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={isOvertime ? '#22c55e' : '#9333ea'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isOvertime ? 0 : offset}
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: isOvertime
                  ? 'drop-shadow(0 0 6px rgba(34,197,94,0.8))'
                  : 'drop-shadow(0 0 6px rgba(147,51,234,0.8))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'font-hud font-bold text-xl leading-none',
              isOvertime ? 'text-green-400' : 'text-purple-400',
            )}>
              {formatTime(activeTimer.elapsedSeconds)}
            </span>
            <span className="font-hud text-[10px] text-slate-600 tracking-wider mt-0.5">
              {isOvertime ? 'OVERTIME' : `${Math.round(progress * 100)}%`}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{ICONS[activeTimer.task.category] ?? '🎯'}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-aura-pulse" />
            <span className="font-hud text-[10px] text-purple-400 uppercase tracking-widest font-bold">
              Live Session
            </span>
          </div>

          <h3 className="font-hud font-bold text-base text-slate-100 mb-0.5">
            {activeTimer.task.title}
          </h3>
          <div className="font-hud text-[11px] text-slate-600 mb-3">
            Goal: {activeTimer.task.duration_minutes}min
          </div>

          {/* Live aura ticker */}
          <div className="flex items-center gap-2 mb-4">
            <Zap size={12} className="text-purple-400" />
            <span className="font-hud font-bold text-purple-400 tabular-nums">
              +{activeTimer.auraEarned.toLocaleString()}
            </span>
            <span className="font-hud text-[10px] text-slate-600">aura earned</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 items-center">
            <button
              onClick={handleComplete}
              disabled={completing}
              className={cn(
                'btn-primary py-2 px-4 text-xs flex items-center gap-1.5',
                completing && 'opacity-60 cursor-not-allowed',
              )}
            >
              {completing
                ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                : <CheckCircle2 size={12} />}
              {completing ? 'Saving…' : 'Complete'}
            </button>
            <button
              onClick={handleAbandon}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 font-hud uppercase tracking-wider transition-colors px-3 py-2"
            >
              <X size={12} /> Abandon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
