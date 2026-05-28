'use client'

import { useEffect, useState } from 'react'
import { Zap, Flame, Target, Edit2, Check, X } from 'lucide-react'

import { ShareButton } from '@/components/profile/ShareButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { RankBadge } from '@/components/ui/RankBadge'
import { AuraCounter } from '@/components/ui/AuraCounter'
import { StatCard } from '@/components/ui/StatCard'
import { PageLoading } from '@/components/ui/Loading'

import { useProfile } from '@/hooks/useProfile'
import { useAppStore } from '@/store/useAppStore'

import { profileService } from '@/services/profileService'

import {
  RANK_CONFIG,
  auraToNextTier,
  tierProgress,
  RANK_ORDER,
} from '@/utils/ranks'

import { formatAura, cn } from '@/utils/helpers'

import type { Session } from '@/types'

const ICONS: Record<string, string> = {
  workout: '💪',
  study: '📚',
  coding: '💻',
  reading: '📖',
  meditation: '🧠',
  deep_work: '⚡',
  other: '🎯',
}

export default function ProfilePage() {
  const profile = useProfile()
  const { setProfile } = useAppStore()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')

  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return

    profileService
      .getSessionHistory(profile.id, 30)
      .then((s) => {
        setSessions(s as Session[])
        setLoading(false)
      })
  }, [profile?.id])

  if (!profile || loading) {
    return <PageLoading />
  }

  const rankCfg = RANK_CONFIG[profile.rank_tier]

  const nextAura = auraToNextTier(
    profile.rank_tier,
    profile.total_aura
  )

  const progress = tierProgress(
    profile.rank_tier,
    profile.total_aura
  )

  const totalSessions = sessions.length

  const totalMinutes = sessions.reduce(
    (acc, s) => acc + Math.floor(s.duration_completed / 60),
    0
  )

  // Category breakdown
  const catBreakdown = sessions.reduce<Record<string, number>>(
    (acc, s) => {
      const cat = (s as any).task?.category ?? 'other'

      acc[cat] = (acc[cat] ?? 0) + 1

      return acc
    },
    {}
  )

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return

    setSaving(true)
    setSaveErr(null)

    try {
      const updated = await profileService.updateProfile({
        username: newUsername.toLowerCase(),
      })

      setProfile(updated)
      setEditing(false)
    } catch (err: any) {
      setSaveErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Profile"
        subtitle="Your arc, your legacy."
      />

      <div className="p-5 space-y-5">

        {/* PROFILE HERO */}
        <div className="card-purple p-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background:
                'radial-gradient(ellipse at 0% 50%, #9333ea, transparent 60%)',
            }}
          />

          <div className="relative flex items-start gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-bold font-hud shadow-glow-purple">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>

              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0f0f1a] flex items-center justify-center text-[8px]',
                  rankCfg.bg
                )}
              >
                {rankCfg.icon}
              </div>
            </div>

            {/* Name + rank */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">

                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={newUsername}
                      onChange={(e) =>
                        setNewUsername(e.target.value)
                      }
                      className="input-cyber py-1.5 px-3 text-sm w-40"
                      placeholder={profile.username}
                      autoFocus
                    />

                    <button
                      onClick={handleSaveUsername}
                      disabled={saving}
                      className="text-green-500 hover:text-green-400"
                    >
                      {saving ? (
                        <span className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditing(false)
                        setSaveErr(null)
                      }}
                      className="text-slate-600 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-hud font-bold text-xl text-slate-100 tracking-wider">
                      {profile.username}
                    </h2>

                    <button
                      onClick={() => {
                        setEditing(true)
                        setNewUsername(profile.username)
                      }}
                      className="text-slate-700 hover:text-purple-400 transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                  </>
                )}

              </div>

              {saveErr && (
                <p className="text-red-400 text-xs font-hud mb-1">
                  {saveErr}
                </p>
              )}

              <RankBadge
                tier={profile.rank_tier}
                size="md"
              />

              <p className="font-hud text-xs text-slate-600 mt-2">
                Member since{' '}
                {new Date(profile.created_at).toLocaleDateString(
                  'en-US',
                  {
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </p>
            </div>

            {/* Share button */}
            <ShareButton
              username={profile.username}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <StatCard
            label="Weekly Aura"
            value={<AuraCounter value={profile.weekly_aura} />}
            variant="purple"
            icon={Zap}
          />

          <StatCard
            label="Total Aura"
            value={formatAura(profile.total_aura)}
            variant="blue"
            icon={Zap}
          />

          <StatCard
            label="Daily Streak"
            value={`🔥 ${profile.daily_streak}`}
            variant="gold"
            icon={Flame}
          />

          <StatCard
            label="Sessions"
            value={totalSessions}
            sub={`${totalMinutes} min total`}
            icon={Target}
          />
        </div>

        {/* RANK PROGRESS */}
        <div className="card p-5">

          <div className="section-header mb-3">
            Rank Journey
          </div>

          <div className="flex gap-1 mb-3">
            {RANK_ORDER.map((tier, i) => {
              const cfg = RANK_CONFIG[tier]

              const reached =
                RANK_ORDER.indexOf(profile.rank_tier) >= i

              return (
                <div
                  key={tier}
                  title={cfg.label}
                  className={cn(
                    'flex-1 h-2 rounded-full transition-all',
                    reached
                      ? 'opacity-100'
                      : 'opacity-20',
                    reached
                      ? cfg.border
                          .replace('border-', 'bg-')
                          .replace('/30', '')
                      : 'bg-white/10'
                  )}
                  style={
                    reached
                      ? {
                          background:
                            tier === profile.rank_tier
                              ? undefined
                              : '#334155',
                        }
                      : {}
                  }
                />
              )
            })}
          </div>

          <div className="flex items-center justify-between">

            <span
              className={cn(
                'font-hud text-xs font-bold',
                rankCfg.color
              )}
            >
              {rankCfg.icon} {rankCfg.label} · {progress}%
            </span>

            {nextAura !== null && (
              <span className="font-hud text-[11px] text-slate-600">
                {formatAura(nextAura)} aura to next rank
              </span>
            )}

          </div>

          <div className="progress-bar-track mt-2">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CATEGORY BREAKDOWN + SESSION HISTORY */}
        <div className="grid lg:grid-cols-5 gap-4">

          {/* Category breakdown */}
          <div className="lg:col-span-2 card p-5">

            <div className="section-header mb-3">
              Activity Breakdown
            </div>

            <div className="space-y-2.5">

              {Object.entries(catBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const pct = Math.round(
                    (count / totalSessions) * 100
                  )

                  return (
                    <div key={cat}>

                      <div className="flex items-center justify-between mb-1">
                        <span className="font-hud text-xs text-slate-400">
                          {ICONS[cat]}{' '}
                          {cat.replace('_', ' ')}
                        </span>

                        <span className="font-hud text-xs text-slate-600">
                          {count} · {pct}%
                        </span>
                      </div>

                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

              {Object.keys(catBreakdown).length === 0 && (
                <p className="text-slate-700 font-hud text-xs">
                  No sessions yet.
                </p>
              )}

            </div>
          </div>

          {/* Session history */}
          <div className="lg:col-span-3 card divide-y divide-white/[0.04]">

            <div className="px-4 py-3 section-header mb-0">
              Recent Sessions
            </div>

            {sessions.slice(0, 12).map((s) => {
              const task = (s as any).task

              const mins = Math.floor(
                s.duration_completed / 60
              )

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3"
                >

                  <span className="text-lg flex-shrink-0">
                    {ICONS[task?.category] ?? '🎯'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="font-hud font-semibold text-xs text-slate-300 truncate">
                      {task?.title ?? 'Task'}
                    </div>

                    <div className="font-hud text-[10px] text-slate-600">
                      {new Date(
                        s.started_at
                      ).toLocaleDateString()}
                      {' · '}
                      {mins}min
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">

                    {s.completed ? (
                      <span className="font-hud font-bold text-xs text-purple-400">
                        +{s.aura_earned.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-hud text-xs text-slate-700">
                        —
                      </span>
                    )}

                    <div className="font-hud text-[9px] mt-0.5">

                      {s.completed ? (
                        <span className="text-green-600">
                          DONE
                        </span>
                      ) : (
                        <span className="text-slate-700">
                          QUIT
                        </span>
                      )}

                    </div>
                  </div>
                </div>
              )
            })}

            {sessions.length === 0 && (
              <div className="py-10 text-center text-slate-700 font-hud text-xs uppercase tracking-widest">
                No sessions yet. Start one!
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}