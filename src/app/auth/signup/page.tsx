'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  // Live validation
  const usernameOk = USERNAME_RE.test(username)
  const passwordOk = password.length >= 8
  const confirmOk  = password === confirm && confirm.length > 0

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!usernameOk) { setError('Username must be 3–20 chars, letters/numbers/underscore only.'); return }
    if (!passwordOk) { setError('Password must be at least 8 characters.'); return }
    if (!confirmOk)  { setError('Passwords do not match.'); return }

    setLoading(true)

    // Check username not taken
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (taken) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    // Create auth user — profile auto-created by DB trigger
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase() },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/auth/pending'), 1800)
  }

  if (done) {
    return (
      <div className="card-purple p-8 text-center">
        <CheckCircle2 size={48} className="text-purple-400 mx-auto mb-4 animate-rank-unlock" />
        <h2 className="font-hud text-xl font-bold text-slate-100 tracking-widest uppercase mb-2">
          Account Created
        </h2>
        <p className="text-slate-500 text-sm font-hud">
          Redirecting to pending screen…
        </p>
      </div>
    )
  }

  return (
    <div className="card-purple p-8">
      <div className="mb-6">
        <h2 className="font-hud text-xl font-bold tracking-widest text-slate-100 uppercase">
          Request Access
        </h2>
        <p className="text-slate-600 text-sm mt-1 font-hud">
          Submit your application. An admin will review it.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Username */}
        <div>
          <label className="section-header block mb-1.5">Username</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_arc_name"
              required
              maxLength={20}
              className="input-cyber pr-8"
            />
            {username.length > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${usernameOk ? 'text-green-500' : 'text-red-500'}`}>
                {usernameOk ? '✓' : '✗'}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-700 mt-1 font-hud tracking-wide">
            3–20 chars · letters, numbers, underscores
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="section-header block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input-cyber"
          />
        </div>

        {/* Password */}
        <div>
          <label className="section-header block mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="input-cyber pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="progress-bar-track mt-2">
              <div
                className="progress-bar-fill transition-all duration-300"
                style={{
                  width: `${Math.min(100, (password.length / 16) * 100)}%`,
                  background: password.length < 8 ? '#ef4444' : password.length < 12 ? '#f59e0b' : '#9333ea',
                }}
              />
            </div>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label className="section-header block mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              className="input-cyber pr-8"
            />
            {confirm.length > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${confirmOk ? 'text-green-500' : 'text-red-500'}`}>
                {confirmOk ? '✓' : '✗'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span className="font-hud">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus size={15} />
          )}
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-slate-600 text-sm font-hud">Already have access? </span>
        <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 text-sm font-hud font-semibold transition-colors">
          Sign In →
        </Link>
      </div>
    </div>
  )
}
