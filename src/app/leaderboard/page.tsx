'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, Zap, Flame, RefreshCw } from 'lucide-react'
import { PageHeader }  from '@/components/ui/PageHeader'
import { RankBadge }   from '@/components/ui/RankBadge'
import { PageLoading } from '@/components/ui/Loading'
import { useProfile }  from '@/hooks/useProfile'
import { leaderboardService } from '@/services/leaderboardService'
import { createClient }       from '@/lib/supabase/client'
import { formatAura, cn, ordinal } from '@/utils/helpers'
import type { LeaderboardRow } from '@/types'

type Tab = 'weekly' | 'alltime'

export default function LeaderboardPage() {
  const profile  = useProfile()
  const supabase = createClient()

  const [tab,       setTab]       = useState<Tab>('weekly')
  const [rows,      setRows]      = useState<LeaderboardRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myRow,     setMyRow]     = useState<LeaderboardRow | null>(null)

  const load = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    const data = tab === 'weekly'
      ? await leaderboardService.getCurrentWeek(100)
      : await leaderboardService.getAllTime(100)
    setRows(data)
    if (profile) {
      setMyRow(data.find(r => r.user_id === profile.id) ?? null)
    }
    setLoading(false)
    setRefreshing(false)
  }, [tab, profile?.id])

  useEffect(() => { load() }, [load])

  // Real-time: refresh when any profile's weekly_aura changes
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tab])

  if (!profile || loading) return <PageLoading />

  const top3  = rows.slice(0, 3)
  const rest  = rows.slice(3)

  return (
    <div className="min-h-full">
      <PageHeader
        title="Leaderboard"
        subtitle={tab === 'weekly' ? 'Resets every Monday 00:00 UTC' : 'All-time total aura'}
        right={
          <button
            onClick={() => load(true)}
            className={cn('text-slate-600 hover:text-purple-400 transition-colors', refreshing && 'animate-spin')}
          >
            <RefreshCw size={15} />
          </button>
        }
      />

      <div className="p-5 space-y-5">

        {/* Tab toggle */}
        <div className="flex gap-1 bg-[#14142a] rounded-lg p-1 w-fit">
          {(['weekly', 'alltime'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'font-hud font-bold text-xs uppercase tracking-widest px-5 py-2 rounded-md transition-all duration-200',
                tab === t ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-400',
              )}
            >
              {t === 'weekly' ? '⚡ This Week' : '🏆 All Time'}
            </button>
          ))}
        </div>

        {/* My position callout */}
        {myRow && (
          <div className="card border-purple-500/30 px-5 py-3 flex items-center gap-4">
            <span className="font-hud font-bold text-2xl text-purple-400">{ordinal(myRow.rank)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-hud text-xs text-slate-500 uppercase tracking-wider">Your Position</div>
              <div className="font-hud font-bold text-sm text-slate-200">{formatAura(myRow.weekly_aura)} aura this week</div>
            </div>
            <RankBadge tier={myRow.rank_tier} size="sm" />
          </div>
        )}

        {/* ── PODIUM (top 3) ── */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 items-end pt-4">
            {/* 2nd */}
            <PodiumCard row={top3[1]} position={2} isMe={top3[1].user_id === profile.id} height="h-24" />
            {/* 1st */}
            <PodiumCard row={top3[0]} position={1} isMe={top3[0].user_id === profile.id} height="h-32" />
            {/* 3rd */}
            <PodiumCard row={top3[2]} position={3} isMe={top3[2].user_id === profile.id} height="h-20" />
          </div>
        )}

        {/* ── RANKED LIST ── */}
        <div className="card divide-y divide-white/[0.04]">
          {rest.map(row => (
            <LeaderboardRow
              key={row.user_id}
              row={row}
              isMe={row.user_id === profile.id}
            />
          ))}
          {rows.length === 0 && (
            <div className="py-12 text-center text-slate-700 font-hud uppercase tracking-widest text-sm">
              No data yet. Start a session!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Podium card ─────────────────────────────────────────────
function PodiumCard({
  row, position, isMe, height,
}: {
  row:      LeaderboardRow
  position: number
  isMe:     boolean
  height:   string
}) {
  const medals = ['', '🥇', '🥈', '🥉']
  return (
    <div className={cn(
      'flex flex-col items-center gap-2 rounded-xl p-3',
      isMe ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/[0.02] border border-white/[0.05]',
    )}>
      <span className="text-xl">{medals[position]}</span>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold font-hud">
        {row.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="text-center">
        <div className={cn('font-hud font-bold text-xs truncate max-w-[80px]', isMe ? 'text-purple-400' : 'text-slate-300')}>
          {row.username}
        </div>
        <div className="font-hud font-bold text-xs text-purple-400 mt-0.5">
          {formatAura(row.weekly_aura)}
        </div>
      </div>
    </div>
  )
}

// ── Ranked list row ──────────────────────────────────────────
function LeaderboardRow({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 transition-colors',
      isMe && 'bg-purple-500/5',
    )}>
      {/* Rank */}
      <span className={cn(
        'font-hud font-bold text-sm w-7 text-center flex-shrink-0',
        row.rank <= 10 ? 'text-slate-400' : 'text-slate-700',
      )}>
        {row.rank}
      </span>

      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold font-hud flex-shrink-0',
        isMe
          ? 'bg-gradient-to-br from-purple-600 to-blue-600'
          : 'bg-[#14142a]',
      )}>
        {row.username.slice(0, 2).toUpperCase()}
      </div>

      {/* Name + rank badge */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-hud font-semibold text-sm truncate',
          isMe ? 'text-purple-400' : 'text-slate-300',
        )}>
          {row.username}{isMe && <span className="text-slate-600 text-[10px] ml-1">(you)</span>}
        </div>
        <RankBadge tier={row.rank_tier} size="sm" className="mt-0.5" />
      </div>

      {/* Streak */}
      <div className="hidden sm:flex items-center gap-1">
        <Flame size={11} className="text-yellow-500" />
        <span className="font-hud text-[11px] text-yellow-500 font-bold">{row.daily_streak}</span>
      </div>

      {/* Aura */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Zap size={11} className="text-purple-400" />
        <span className="font-hud font-bold text-sm text-purple-400">
          {formatAura(row.weekly_aura)}
        </span>
      </div>
    </div>
  )
}
