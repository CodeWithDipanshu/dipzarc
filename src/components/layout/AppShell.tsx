'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Target, Trophy, User,
  BarChart2, Shield, LogOut, Zap, Menu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore }  from '@/store/useAppStore'
import { adminService } from '@/services/adminService'
import { cn, formatAura } from '@/utils/helpers'
import { RANK_CONFIG }  from '@/utils/ranks'
import type { Profile, RankTier } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/tasks',       label: 'Tasks',        icon: Target },
  { href: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
  { href: '/profile',     label: 'Profile',      icon: User },
  { href: '/stats',       label: 'Stats',        icon: BarChart2 },
]

const ADMIN_NAV = [
  { href: '/admin/users', label: 'Users',  icon: Shield },
  { href: '/admin/tasks', label: 'Tasks',  icon: Target },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { profile, setProfile } = useAppStore()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Load profile into store
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data as Profile)
        if (data.role === 'admin') {
          adminService.getPendingCount().then(setPendingCount)
        }
      }
    }
    loadProfile()

    // Real-time profile sync (aura updates from other sessions)
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'profiles',
        filter: `id=eq.${profile?.id}`,
      }, (payload) => {
        setProfile(payload.new as Profile)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/auth/login')
  }

  const rankConfig = profile ? RANK_CONFIG[profile.rank_tier as RankTier] : null

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="font-hud text-2xl font-bold tracking-[0.15em]">
          <span className="text-purple-400 text-glow-purple">DIPZ</span>
          <span className="text-blue-400">ARC</span>
        </div>
        <div className="text-[10px] text-slate-600 tracking-widest uppercase mt-0.5 font-hud">
          Train. Grind. Ascend.
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn('nav-link', pathname.startsWith(href) && 'active')}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {/* Admin section */}
        {profile?.role === 'admin' && (
          <>
            <div className="px-4 pt-4 pb-1">
              <div className="section-header">Admin</div>
            </div>
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn('nav-link', pathname.startsWith(href) && 'active')}
              >
                <Icon size={16} />
                {label}
                {href === '/admin/users' && pendingCount > 0 && (
                  <span className="ml-auto bg-yellow-500 text-yellow-950 text-[9px] font-bold font-hud rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User pill */}
      {profile && (
        <div className="p-3 border-t border-white/5">
          {/* Aura badge */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Zap size={12} className="text-purple-400 animate-aura-pulse" />
            <span className="font-hud font-bold text-purple-400 text-sm">
              {formatAura(profile.weekly_aura)}
            </span>
            <span className="text-[10px] text-slate-600 font-hud uppercase tracking-wider ml-auto">
              this week
            </span>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
               onClick={() => { router.push('/profile'); setMobileOpen(false) }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold font-hud flex-shrink-0">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-hud font-semibold text-slate-200 truncate">
                {profile.username}
              </div>
              {rankConfig && (
                <div className={cn('text-[10px] font-hud font-bold uppercase tracking-wider', rankConfig.color)}>
                  {rankConfig.icon} {rankConfig.label}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSignOut() }}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 flex-col bg-[#0f0f1a] border-r border-white/[0.06] flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-52 flex flex-col bg-[#0f0f1a] border-r border-white/[0.06]">
            <NavContent />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f0f1a] border-b border-white/[0.06]">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400">
            <Menu size={20} />
          </button>
          <span className="font-hud font-bold text-purple-400 tracking-widest">DIPZARC</span>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
