'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { PageHeader }  from '@/components/ui/PageHeader'
import { StatCard }    from '@/components/ui/StatCard'
import { PageLoading } from '@/components/ui/Loading'
import { useProfile }  from '@/hooks/useProfile'
import { profileService }     from '@/services/profileService'
import { leaderboardService } from '@/services/leaderboardService'
import { createClient }       from '@/lib/supabase/client'
import { formatAura, cn } from '@/utils/helpers'
import { Zap, TrendingUp, Clock, Target } from 'lucide-react'
import type { Session } from '@/types'

const ICONS: Record<string, string> = {
  workout: '💪', study: '📚', coding: '💻',
  reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
}

// Custom recharts tooltip
function AuraTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#14142a] border border-purple-500/30 rounded-lg px-3 py-2 shadow-lg">
      <div className="font-hud text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-hud font-bold text-sm text-purple-400">
        {Number(payload[0].value).toLocaleString()} aura
      </div>
    </div>
  )
}

export default function StatsPage() {
  const profile  = useProfile()
  const supabase = createClient()

  const [sessions, setSessions]   = useState<Session[]>([])
  const [weeklyLb, setWeeklyLb]   = useState<{ week: string; aura: number; rank: number | null }[]>([])
  const [loading,  setLoading]    = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const [sess, history] = await Promise.all([
        profileService.getSessionHistory(profile.id, 90),
        supabase
          .from('leaderboard_history')
          .select('week_start, aura, final_rank')
          .eq('user_id', profile.id)
          .order('week_start', { ascending: false })
          .limit(12),
      ])
      setSessions(sess as Session[])
      setWeeklyLb((history.data ?? []).map((r: any) => ({
        week: new Date(r.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aura: r.aura,
        rank: r.final_rank,
      })).reverse())
      setLoading(false)
    }
    load()
  }, [profile?.id])

  if (!profile || loading) return <PageLoading />

  // ── Derived stats ────────────────────────────────────────

  const completedSessions = sessions.filter(s => s.completed)
  const totalAuraEarned   = completedSessions.reduce((a, s) => a + s.aura_earned, 0)
  const totalMinutes      = sessions.reduce((a, s) => a + Math.floor(s.duration_completed / 60), 0)
  const completionRate    = sessions.length
    ? Math.round((completedSessions.length / sessions.length) * 100)
    : 0

  // Daily aura for last 30 days
  const dailyMap: Record<string, number> = {}
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dailyMap[d.toISOString().split('T')[0]] = 0
  }
  for (const s of completedSessions) {
    const day = s.started_at.split('T')[0]
    if (day in dailyMap) dailyMap[day] += s.aura_earned
  }
  const dailyData = Object.entries(dailyMap).map(([date, aura]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    aura,
  }))

  // Category totals
  const catAura: Record<string, number> = {}
  for (const s of completedSessions) {
    const cat = (s as any).task?.category ?? 'other'
    catAura[cat] = (catAura[cat] ?? 0) + s.aura_earned
  }
  const catData = Object.entries(catAura)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, aura]) => ({ cat, aura, icon: ICONS[cat] ?? '🎯' }))

  // Heatmap — last 10 weeks × 7 days
  const heatmap: Record<string, number> = {}
  for (const s of completedSessions) {
    const day = s.started_at.split('T')[0]
    heatmap[day] = (heatmap[day] ?? 0) + 1
  }
  const heatDays: { date: string; count: number }[] = []
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    heatDays.push({ date: key, count: heatmap[key] ?? 0 })
  }

  const heatColor = (c: number) =>
    c === 0 ? 'bg-white/[0.03]' :
    c === 1 ? 'bg-purple-900/60' :
    c === 2 ? 'bg-purple-700/70' :
              'bg-purple-500'

  return (
    <div className="min-h-full">
      <PageHeader title="Stats" subtitle="Your numbers don't lie." />

      <div className="p-5 space-y-5">

        {/* ── TOP STATS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Aura (90d)"
            value={formatAura(totalAuraEarned)}
            sub="last 90 days"
            icon={Zap}
            variant="purple"
          />
          <StatCard
            label="Hours Logged"
            value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
            sub={`${sessions.length} sessions`}
            icon={Clock}
            variant="blue"
          />
          <StatCard
            label="Completion"
            value={`${completionRate}%`}
            sub={`${completedSessions.length} completed`}
            icon={Target}
            variant={completionRate >= 80 ? 'gold' : 'default'}
          />
          <StatCard
            label="Best Week"
            value={weeklyLb.length ? formatAura(Math.max(...weeklyLb.map(w => w.aura))) : '—'}
            sub="aura in a week"
            icon={TrendingUp}
          />
        </div>

        {/* ── DAILY AURA CHART ── */}
        <div className="card p-5">
          <div className="section-header mb-4">Daily Aura — Last 30 Days</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="auraGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#334155', fontSize: 9, fontFamily: 'Rajdhani' }}
                tickLine={false} axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#334155', fontSize: 9, fontFamily: 'Rajdhani' }}
                tickLine={false} axisLine={false}
                tickFormatter={v => v > 0 ? formatAura(v) : ''}
              />
              <Tooltip content={<AuraTooltip />} cursor={{ stroke: 'rgba(147,51,234,0.3)', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="aura"
                stroke="#9333ea" strokeWidth={2}
                fill="url(#auraGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── WEEKLY RANK HISTORY ── */}
        {weeklyLb.length > 0 && (
          <div className="card p-5">
            <div className="section-header mb-4">Weekly Aura History</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyLb} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#334155', fontSize: 9, fontFamily: 'Rajdhani' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#334155', fontSize: 9, fontFamily: 'Rajdhani' }}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => v > 0 ? formatAura(v) : ''}
                />
                <Tooltip content={<AuraTooltip />} cursor={{ fill: 'rgba(147,51,234,0.08)' }} />
                <Bar dataKey="aura" fill="#9333ea" radius={[4, 4, 0, 0]}
                     style={{ filter: 'drop-shadow(0 0 4px rgba(147,51,234,0.5))' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── HEATMAP + CATEGORY ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Activity heatmap */}
          <div className="lg:col-span-2 card p-5">
            <div className="section-header mb-3">Activity Heatmap — Last 10 Weeks</div>
            <div className="grid grid-cols-[repeat(70,1fr)] gap-0.5">
              {heatDays.map(({ date, count }) => (
                <div
                  key={date}
                  title={`${date}: ${count} session${count !== 1 ? 's' : ''}`}
                  className={cn('aspect-square rounded-[2px] transition-colors', heatColor(count))}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="font-hud text-[10px] text-slate-700">Less</span>
              {['bg-white/[0.03]', 'bg-purple-900/60', 'bg-purple-700/70', 'bg-purple-500'].map(c => (
                <div key={c} className={cn('w-3 h-3 rounded-[2px]', c)} />
              ))}
              <span className="font-hud text-[10px] text-slate-700">More</span>
            </div>
          </div>

          {/* Category aura breakdown */}
          <div className="card p-5">
            <div className="section-header mb-3">Aura by Category</div>
            <div className="space-y-3">
              {catData.map(({ cat, aura, icon }) => {
                const pct = totalAuraEarned > 0 ? Math.round((aura / totalAuraEarned) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-hud text-xs text-slate-400">
                        {icon} {cat.replace('_', ' ')}
                      </span>
                      <span className="font-hud text-[10px] text-slate-600">
                        {formatAura(aura)} · {pct}%
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {catData.length === 0 && (
                <p className="text-slate-700 font-hud text-xs">Complete sessions to see data.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── WEEKLY RANK TABLE ── */}
        {weeklyLb.length > 0 && (
          <div className="card divide-y divide-white/[0.04]">
            <div className="px-4 py-3 section-header mb-0">Past Week Rankings</div>
            {[...weeklyLb].reverse().slice(0, 8).map((w, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="font-hud text-xs text-slate-500">{w.week}</span>
                <div className="flex items-center gap-4">
                  <span className="font-hud font-bold text-xs text-purple-400">{formatAura(w.aura)} aura</span>
                  {w.rank && (
                    <span className={cn(
                      'font-hud font-bold text-xs',
                      w.rank === 1 ? 'text-yellow-400' : w.rank <= 3 ? 'text-slate-300' : 'text-slate-600',
                    )}>
                      #{w.rank}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
