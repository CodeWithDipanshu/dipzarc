import { notFound }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankBadge }    from '@/components/ui/RankBadge'
import { RANK_CONFIG, auraToNextTier, tierProgress } from '@/utils/ranks'
import { formatAura }   from '@/utils/helpers'
import type { RankTier } from '@/types'
import Link             from 'next/link'

interface Props {
  params: { username: string }
}

const ICONS: Record<string, string> = {
  workout: '💪', study: '📚', coding: '💻',
  reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
}

export default async function PublicProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .eq('status', 'approved')
    .single()

  if (!profile) notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, task:tasks(title, category)')
    .eq('user_id', profile.id)
    .eq('completed', true)
    .order('started_at', { ascending: false })
    .limit(10)

  const rankCfg  = RANK_CONFIG[profile.rank_tier as RankTier]
  const progress = tierProgress(profile.rank_tier as RankTier, profile.total_aura)
  const nextAura = auraToNextTier(profile.rank_tier as RankTier, profile.total_aura)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* bg orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #9333ea, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      </div>

      <div className="relative w-full max-w-lg space-y-4">

        {/* LOGO */}
        <div className="text-center mb-6">
          <Link href="/" className="font-hud text-3xl font-bold tracking-[0.2em]">
            <span className="text-purple-400 text-glow-purple">DIPZ</span>
            <span className="text-blue-400">ARC</span>
          </Link>
        </div>

        {/* PROFILE HERO CARD */}
        <div className="card-purple p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 0% 50%, #9333ea, transparent 60%)' }} />
          <div className="relative flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600
                              flex items-center justify-center text-2xl font-bold font-hud shadow-glow-purple">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2
                               border-[#0f0f1a] flex items-center justify-center text-sm
                               ${rankCfg.bg}`}>
                {rankCfg.icon}
              </div>
            </div>

            {/* Name + rank */}
            <div>
              <h1 className="font-hud font-bold text-2xl text-slate-100 tracking-wider mb-1">
                {profile.username}
              </h1>
              <RankBadge tier={profile.rank_tier as RankTier} size="md" />
              <p className="font-hud text-xs text-slate-600 mt-2">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Weekly Aura', value: formatAura(profile.weekly_aura), color: 'text-purple-400' },
            { label: 'Total Aura',  value: formatAura(profile.total_aura),  color: 'text-blue-400'   },
            { label: 'Streak',      value: `🔥 ${profile.daily_streak}`,   color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`font-hud font-bold text-xl ${color}`}>{value}</div>
              <div className="font-hud text-[10px] text-slate-600 uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* RANK PROGRESS */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="section-header mb-0">Rank Progress</span>
            <span className={`font-hud text-xs font-bold ${rankCfg.color}`}>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`font-hud text-[10px] font-bold ${rankCfg.color}`}>
              {rankCfg.icon} {rankCfg.label}
            </span>
            {nextAura !== null && (
              <span className="font-hud text-[10px] text-slate-600">
                {formatAura(nextAura)} to next rank
              </span>
            )}
          </div>
        </div>

        {/* RECENT SESSIONS */}
        {sessions && sessions.length > 0 && (
          <div className="card divide-y divide-white/[0.04]">
            <div className="px-4 py-3 section-header">Recent Sessions</div>
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{ICONS[s.task?.category] ?? '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-hud font-semibold text-xs text-slate-300 truncate">
                    {s.task?.title ?? 'Task'}
                  </div>
                  <div className="font-hud text-[10px] text-slate-600">
                    {new Date(s.started_at).toLocaleDateString()} ·{' '}
                    {Math.floor(s.duration_completed / 60)}min
                  </div>
                </div>
                <span className="font-hud font-bold text-xs text-purple-400 flex-shrink-0">
                  +{s.aura_earned.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Share card image preview */}
        <div className="card p-4">
          <div className="section-header mb-3">Share Card</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/share-card?u=${profile.username}`}
            alt={`${profile.username}'s share card`}
            className="w-full rounded-lg border border-white/[0.05]"
          />
          <a
            href={`/api/share-card?u=${profile.username}`}
            download={`${profile.username}-dipzarc.svg`}
            className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 text-xs"
          >
            ↓ Download Card
          </a>
        </div>

        {/* CTA */}
        <div className="text-center pt-2 pb-6">
          <p className="font-hud text-xs text-slate-600 mb-3 uppercase tracking-widest">
            Want to build your own arc?
          </p>
          <Link href="/auth/signup" className="btn-primary inline-flex items-center gap-2 text-xs">
            ⚡ Join DipzArc
          </Link>
        </div>
      </div>
    </div>
  )
}
