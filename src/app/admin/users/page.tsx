'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  CheckCircle2, Ban, Search, RefreshCw,
  Users, Clock, Shield, AlertTriangle,
  ChevronDown, Zap, Flame, RotateCcw,
} from 'lucide-react'
import { PageHeader }  from '@/components/ui/PageHeader'
import { RankBadge }   from '@/components/ui/RankBadge'
import { StatCard }    from '@/components/ui/StatCard'
import { PageLoading } from '@/components/ui/Loading'
import { useProfile }  from '@/hooks/useProfile'
import { adminService } from '@/services/adminService'
import { useRouter }    from 'next/navigation'
import { formatAura, cn, plural } from '@/utils/helpers'
import type { Profile, UserStatus } from '@/types'

type FilterStatus = 'all' | UserStatus

const STATUS_COLORS: Record<UserStatus, string> = {
  pending:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  approved: 'text-green-400 bg-green-500/10 border-green-500/30',
  banned:   'text-red-400 bg-red-500/10 border-red-500/30',
}

const STATUS_ICONS: Record<UserStatus, string> = {
  pending:  '⏳',
  approved: '✓',
  banned:   '✗',
}

export default function AdminUsersPage() {
  const profile = useProfile()
  const router  = useRouter()

  const [users,      setUsers]      = useState<Profile[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<FilterStatus>('all')
  const [search,     setSearch]     = useState('')
  const [actionMap,  setActionMap]  = useState<Record<string, boolean>>({})  // userId → loading
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone,    setResetDone]    = useState(false)
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // Guard — non-admins get bounced
  useEffect(() => {
    if (profile && profile.role !== 'admin') router.push('/dashboard')
  }, [profile])

  const loadUsers = async () => {
    const data = await adminService.getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  // ── Derived counts ────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      users.length,
    pending:  users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    banned:   users.filter(u => u.status === 'banned').length,
  }), [users])

  // ── Filtered + searched list ──────────────────────────────
  const visible = useMemo(() => {
    let list = filter === 'all' ? users : users.filter(u => u.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
      )
    }
    return list
  }, [users, filter, search])

  // ── Actions ───────────────────────────────────────────────
  const setAction = (id: string, val: boolean) =>
    setActionMap(prev => ({ ...prev, [id]: val }))

  const handleApprove = async (userId: string) => {
    setAction(userId, true)
    await adminService.approveUser(userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u))
    setAction(userId, false)
  }

  const handleBan = async (userId: string) => {
    if (!confirm('Ban this user? They will lose access immediately.')) return
    setAction(userId, true)
    await adminService.banUser(userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u))
    setAction(userId, false)
  }

  const handleUnban = async (userId: string) => {
    setAction(userId, true)
    await adminService.approveUser(userId)   // re-approve = unban
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u))
    setAction(userId, false)
  }

  const handleResetAura = async (userId: string) => {
    if (!confirm('Reset this user weekly aura to 0?')) return
    setAction(userId, true)
    await adminService.resetUserWeeklyAura(userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, weekly_aura: 0 } : u))
    setAction(userId, false)
  }

  const handleWeeklyReset = async () => {
    setResetLoading(true)
    await adminService.triggerWeeklyReset()
    setResetLoading(false)
    setResetDone(true)
    setConfirmReset(false)
    await loadUsers()
    setTimeout(() => setResetDone(false), 3000)
  }

  if (!profile || loading) return <PageLoading />
  if (profile.role !== 'admin') return null

  return (
    <div className="min-h-full">
      <PageHeader
        title="Admin — Users"
        subtitle={`${counts.pending} pending · ${counts.approved} approved · ${counts.banned} banned`}
        right={
          <div className="flex items-center gap-2">
            {/* Weekly reset */}
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="font-hud text-xs text-red-400 uppercase tracking-wider">Confirm reset?</span>
                <button
                  onClick={handleWeeklyReset}
                  disabled={resetLoading}
                  className="btn-danger py-1.5 px-3 text-xs flex items-center gap-1"
                >
                  {resetLoading
                    ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    : <RotateCcw size={11} />}
                  Yes, reset all
                </button>
                <button onClick={() => setConfirmReset(false)}
                  className="text-slate-600 hover:text-slate-400 font-hud text-xs uppercase tracking-wider">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <RotateCcw size={11} />
                Weekly Reset
              </button>
            )}
            <button onClick={loadUsers} className="text-slate-600 hover:text-purple-400 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        }
      />

      <div className="p-5 space-y-5">

        {/* Reset success banner */}
        {resetDone && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="font-hud text-sm text-green-400">Weekly reset complete. All aura zeroed and leaderboard snapshot saved.</span>
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Users"    value={counts.all}      icon={Users}         />
          <StatCard label="Pending"        value={counts.pending}  icon={Clock}         variant={counts.pending > 0 ? 'gold' : 'default'} sub={counts.pending > 0 ? 'Needs review' : 'All clear'} />
          <StatCard label="Approved"       value={counts.approved} icon={Shield}        variant="purple" />
          <StatCard label="Banned"         value={counts.banned}   icon={AlertTriangle} variant={counts.banned > 0 ? 'red' : 'default'} />
        </div>

        {/* ── FILTERS + SEARCH ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'pending', 'approved', 'banned'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'font-hud font-bold text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all duration-200',
                  filter === s
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'border-white/10 text-slate-600 hover:border-purple-500/40 hover:text-slate-400',
                )}
              >
                {s === 'all' ? `All (${counts.all})` :
                 s === 'pending'  ? `⏳ Pending (${counts.pending})` :
                 s === 'approved' ? `✓ Approved (${counts.approved})` :
                                    `✗ Banned (${counts.banned})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search username or email…"
              className="input-cyber pl-8 py-2 text-xs"
            />
          </div>
        </div>

        {/* ── USER TABLE ── */}
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_1.5fr_100px_80px_80px_160px] gap-4 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
            {['User', 'Email', 'Status', 'Streak', 'Aura', 'Actions'].map(h => (
              <span key={h} className="font-hud font-bold text-[10px] uppercase tracking-widest text-slate-600">{h}</span>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="py-16 text-center text-slate-700 font-hud text-xs uppercase tracking-widest">
              No users match this filter.
            </div>
          )}

          {visible.map(user => {
            const isBusy     = !!actionMap[user.id]
            const isExpanded = expandedId === user.id
            const isMe       = user.id === profile.id

            return (
              <div key={user.id} className={cn(
                'border-b border-white/[0.04] last:border-none',
                isMe && 'bg-purple-500/[0.03]',
              )}>
                {/* Main row */}
                <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1.5fr_100px_80px_80px_160px] gap-4 px-4 py-3 items-center">

                  {/* Username + avatar */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold font-hud flex-shrink-0">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-hud font-bold text-sm text-slate-200 truncate">
                        {user.username}{isMe && <span className="text-purple-500 text-[10px] ml-1">(you)</span>}
                      </div>
                      <RankBadge tier={user.rank_tier} size="sm" className="mt-0.5" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="hidden md:block font-hud text-xs text-slate-500 truncate">{user.email}</div>

                  {/* Status badge */}
                  <div className="hidden md:block">
                    <span className={cn(
                      'font-hud font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded border',
                      STATUS_COLORS[user.status],
                    )}>
                      {STATUS_ICONS[user.status]} {user.status}
                    </span>
                  </div>

                  {/* Streak */}
                  <div className="hidden md:flex items-center gap-1">
                    <Flame size={11} className="text-yellow-500" />
                    <span className="font-hud text-xs text-yellow-500 font-bold">{user.daily_streak}</span>
                  </div>

                  {/* Weekly aura */}
                  <div className="hidden md:flex items-center gap-1">
                    <Zap size={11} className="text-purple-400" />
                    <span className="font-hud text-xs text-purple-400 font-bold">
                      {formatAura(user.weekly_aura)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                    <ActionButtons
                      user={user} isMe={isMe} isBusy={isBusy}
                      onApprove={() => handleApprove(user.id)}
                      onBan={() => handleBan(user.id)}
                      onUnban={() => handleUnban(user.id)}
                      onResetAura={() => handleResetAura(user.id)}
                    />
                  </div>

                  {/* Mobile expand toggle */}
                  <button
                    className="md:hidden text-slate-600 hover:text-slate-400 p-1"
                    onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  >
                    <ChevronDown size={14} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                </div>

                {/* Mobile expanded row */}
                {isExpanded && (
                  <div className="md:hidden px-4 pb-3 space-y-2 bg-white/[0.02]">
                    <div className="font-hud text-[10px] text-slate-600">{user.email}</div>
                    <div className="flex items-center gap-3 text-xs font-hud">
                      <span className={cn('px-2 py-0.5 rounded border font-bold uppercase tracking-wider text-[10px]', STATUS_COLORS[user.status])}>
                        {user.status}
                      </span>
                      <span className="text-yellow-500">🔥{user.daily_streak}</span>
                      <span className="text-purple-400">⚡{formatAura(user.weekly_aura)}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <ActionButtons
                        user={user} isMe={isMe} isBusy={isBusy}
                        onApprove={() => handleApprove(user.id)}
                        onBan={() => handleBan(user.id)}
                        onUnban={() => handleUnban(user.id)}
                        onResetAura={() => handleResetAura(user.id)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Showing count */}
        <div className="font-hud text-[11px] text-slate-700 text-center uppercase tracking-widest">
          Showing {visible.length} of {counts.all} {plural(counts.all, 'user')}
        </div>
      </div>
    </div>
  )
}

// ── Action buttons per user ────────────────────────────────
function ActionButtons({
  user, isMe, isBusy, onApprove, onBan, onUnban, onResetAura,
}: {
  user:        Profile
  isMe:        boolean
  isBusy:      boolean
  onApprove:   () => void
  onBan:       () => void
  onUnban:     () => void
  onResetAura: () => void
}) {
  const spinner = (
    <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
  )

  return (
    <>
      {user.status === 'pending' && (
        <button
          onClick={onApprove}
          disabled={isBusy}
          title="Approve"
          className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded px-2 py-1 font-hud text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isBusy ? spinner : <CheckCircle2 size={11} />}
          Approve
        </button>
      )}

      {user.status === 'approved' && !isMe && (
        <button
          onClick={onBan}
          disabled={isBusy}
          title="Ban user"
          className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded px-2 py-1 font-hud text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isBusy ? spinner : <Ban size={11} />}
          Ban
        </button>
      )}

      {user.status === 'banned' && (
        <button
          onClick={onUnban}
          disabled={isBusy}
          title="Unban (re-approve)"
          className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded px-2 py-1 font-hud text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isBusy ? spinner : <CheckCircle2 size={11} />}
          Unban
        </button>
      )}

      {user.status === 'approved' && (
        <button
          onClick={onResetAura}
          disabled={isBusy || isMe}
          title={isMe ? 'Cannot reset your own aura' : 'Reset weekly aura'}
          className="flex items-center gap-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-slate-500 hover:text-slate-400 rounded px-2 py-1 font-hud text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isBusy ? spinner : <RotateCcw size={11} />}
          Reset
        </button>
      )}
    </>
  )
}
