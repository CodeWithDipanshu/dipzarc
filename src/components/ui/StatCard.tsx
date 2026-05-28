'use client'

import { cn } from '@/utils/helpers'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label:       string
  value:       string | number | React.ReactNode
  sub?:        string
  icon?:       LucideIcon
  variant?:    'default' | 'purple' | 'blue' | 'gold' | 'red'
  className?:  string
}

const VARIANTS = {
  default: 'border-white/[0.07]',
  purple:  'border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.08)]',
  blue:    'border-blue-500/25 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
  gold:    'border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]',
  red:     'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]',
}

const VALUE_COLORS = {
  default: 'text-slate-100',
  purple:  'text-purple-400 text-glow-purple',
  blue:    'text-blue-400 text-glow-blue',
  gold:    'text-yellow-400 text-glow-gold',
  red:     'text-red-400 text-glow-red',
}

export function StatCard({ label, value, sub, icon: Icon, variant = 'default', className }: StatCardProps) {
  return (
    <div className={cn('card p-4 relative overflow-hidden', VARIANTS[variant], className)}>
      {/* BG glow blob */}
      {variant !== 'default' && (
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10"
             style={{ background: variant === 'purple' ? '#9333ea' : variant === 'blue' ? '#3b82f6' : variant === 'gold' ? '#f59e0b' : '#ef4444' }} />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="section-header mb-0">{label}</span>
          {Icon && <Icon size={14} className="text-slate-600" />}
        </div>
        <div className={cn('font-hud font-bold text-2xl leading-none', VALUE_COLORS[variant])}>
          {value}
        </div>
        {sub && <div className="text-[11px] text-slate-600 mt-1.5 font-hud">{sub}</div>}
      </div>
    </div>
  )
}
