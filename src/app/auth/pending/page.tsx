'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Ban, LogOut, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Status = 'pending' | 'approved' | 'banned' | 'loading'

export default function PendingPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [status,   setStatus]   = useState<Status>('loading')
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)

  const checkStatus = async () => {
    setChecking(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('status, username')
      .eq('id', user.id)
      .single()

    setChecking(false)

    if (!profile) return
    setUsername(profile.username)
    setStatus(profile.status as Status)

    if (profile.status === 'approved') {
      setTimeout(() => router.push('/dashboard'), 1200)
    }
  }

  // Initial check
  useEffect(() => { checkStatus() }, [])

  // Poll every 12 seconds
  useEffect(() => {
    const interval = setInterval(checkStatus, 12_000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // ── Approved ───────────────────────────────
  if (status === 'approved') {
    return (
      <div className="card-purple p-8 text-center">
        <div className="text-5xl mb-4 animate-float">⚡</div>
        <h2 className="font-hud text-2xl font-bold text-purple-400 text-glow-purple tracking-widest uppercase mb-2">
          Access Granted
        </h2>
        <p className="text-slate-500 font-hud text-sm">
          Welcome to the arc, {username}. Redirecting…
        </p>
        <div className="mt-4 flex justify-center">
          <span className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ── Banned ────────────────────────────────
  if (status === 'banned') {
    return (
      <div className="card p-8 border-red-500/30 text-center">
        <Ban size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-hud text-xl font-bold text-red-400 tracking-widest uppercase mb-2">
          Access Denied
        </h2>
        <p className="text-slate-500 font-hud text-sm mb-6">
          Your account has been suspended. Contact an admin if you think this is wrong.
        </p>
        <button onClick={handleSignOut} className="btn-danger flex items-center gap-2 mx-auto">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    )
  }

  // ── Pending / Loading ─────────────────────
  return (
    <div className="card-purple p-8 text-center">
      {/* Animated waiting icon */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-spin-slow"
             style={{ animationDirection: 'reverse', animationDuration: '6s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock size={28} className="text-purple-400 animate-aura-pulse" />
        </div>
      </div>

      <h2 className="font-hud text-xl font-bold text-slate-100 tracking-widest uppercase mb-2">
        Awaiting Approval
      </h2>

      {username && (
        <p className="text-slate-500 font-hud text-sm mb-1">
          Application submitted for <span className="text-purple-400 font-bold">{username}</span>
        </p>
      )}

      <p className="text-slate-600 font-hud text-xs tracking-wide mb-6">
        An admin will review your request. This page checks automatically.
      </p>

      {/* Status steps */}
      <div className="space-y-2 text-left mb-6 bg-white/[0.02] rounded-lg p-4 border border-white/[0.05]">
        {[
          { label: 'Account created',        done: true  },
          { label: 'Awaiting admin review',  done: false },
          { label: 'Access granted',         done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              step.done
                ? 'bg-purple-500 text-white'
                : i === 1
                  ? 'border border-purple-500/50 text-purple-500 animate-aura-pulse'
                  : 'border border-white/10 text-slate-700'
            }`}>
              {step.done ? '✓' : i + 1}
            </div>
            <span className={`font-hud text-sm ${step.done ? 'text-slate-400' : i === 1 ? 'text-purple-400' : 'text-slate-700'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={checkStatus}
          disabled={checking}
          className="btn-secondary flex items-center gap-2 text-xs py-2"
        >
          <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking…' : 'Check Now'}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-400 text-xs font-hud uppercase tracking-wider transition-colors"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>

      <p className="text-[10px] text-slate-700 mt-5 font-hud tracking-widest">
        Auto-checking every 12 seconds
      </p>
    </div>
  )
}
