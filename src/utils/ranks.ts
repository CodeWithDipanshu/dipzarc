import type { RankConfig, RankTier } from '@/types'

// Rank thresholds and display config
export const RANK_CONFIG: Record<RankTier, RankConfig> = {
  initiate: {
    tier:    'initiate',
    label:   'INITIATE',
    minAura: 0,
    color:   'text-slate-400',
    bg:      'bg-slate-800',
    border:  'border-slate-600',
    glow:    '',
    icon:    '○',
  },
  bronze: {
    tier:    'bronze',
    label:   'BRONZE',
    minAura: 5_000,
    color:   'text-amber-600',
    bg:      'bg-amber-950',
    border:  'border-amber-700',
    glow:    'shadow-[0_0_10px_rgba(180,83,9,0.4)]',
    icon:    '◆',
  },
  silver: {
    tier:    'silver',
    label:   'SILVER',
    minAura: 20_000,
    color:   'text-slate-300',
    bg:      'bg-slate-800',
    border:  'border-slate-400',
    glow:    'shadow-[0_0_10px_rgba(148,163,184,0.4)]',
    icon:    '◆',
  },
  gold: {
    tier:    'gold',
    label:   'GOLD',
    minAura: 50_000,
    color:   'text-yellow-400',
    bg:      'bg-yellow-950',
    border:  'border-yellow-500',
    glow:    'shadow-[0_0_12px_rgba(234,179,8,0.5)]',
    icon:    '◆',
  },
  platinum: {
    tier:    'platinum',
    label:   'PLATINUM',
    minAura: 100_000,
    color:   'text-cyan-300',
    bg:      'bg-cyan-950',
    border:  'border-cyan-400',
    glow:    'shadow-[0_0_14px_rgba(34,211,238,0.5)]',
    icon:    '◈',
  },
  diamond: {
    tier:    'diamond',
    label:   'DIAMOND',
    minAura: 200_000,
    color:   'text-blue-300',
    bg:      'bg-blue-950',
    border:  'border-blue-400',
    glow:    'shadow-[0_0_16px_rgba(59,130,246,0.6)]',
    icon:    '◈',
  },
  legend: {
    tier:    'legend',
    label:   'LEGEND',
    minAura: 500_000,
    color:   'text-purple-300',
    bg:      'bg-purple-950',
    border:  'border-purple-400',
    glow:    'shadow-glow-purple',
    icon:    '★',
  },
  demon: {
    tier:    'demon',
    label:   'DEMON',
    minAura: 1_000_000,
    color:   'text-red-400',
    bg:      'bg-red-950',
    border:  'border-red-500',
    glow:    'shadow-glow-red',
    icon:    '⟁',
  },
}

export const RANK_ORDER: RankTier[] = [
  'initiate', 'bronze', 'silver', 'gold',
  'platinum', 'diamond', 'legend', 'demon',
]

/** Returns aura needed to reach the NEXT tier (null if already demon) */
export function auraToNextTier(currentTier: RankTier, totalAura: number): number | null {
  const idx = RANK_ORDER.indexOf(currentTier)
  if (idx === RANK_ORDER.length - 1) return null
  const nextTier = RANK_ORDER[idx + 1]
  return RANK_CONFIG[nextTier].minAura - totalAura
}

/** Returns progress % within current tier (0-100) */
export function tierProgress(currentTier: RankTier, totalAura: number): number {
  const idx = RANK_ORDER.indexOf(currentTier)
  const current = RANK_CONFIG[currentTier].minAura
  if (idx === RANK_ORDER.length - 1) return 100
  const next = RANK_CONFIG[RANK_ORDER[idx + 1]].minAura
  return Math.min(100, Math.round(((totalAura - current) / (next - current)) * 100))
}

// Category icons (lucide icon names)
export const CATEGORY_ICONS: Record<string, string> = {
  workout:    'Dumbbell',
  study:      'BookOpen',
  coding:     'Code2',
  reading:    'BookMarked',
  meditation: 'Brain',
  deep_work:  'Zap',
  other:      'Star',
}

// Aura per minute for a task
export function auraPerMinute(task: { aura_reward: number; duration_minutes: number }) {
  return task.aura_reward / task.duration_minutes
}

// Aura per second for live ticker
export function auraPerSecond(task: { aura_reward: number; duration_minutes: number }) {
  return task.aura_reward / (task.duration_minutes * 60)
}
