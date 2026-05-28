'use client'

import { cn } from '@/utils/helpers'
import { RANK_CONFIG } from '@/utils/ranks'
import type { RankTier } from '@/types'

interface RankBadgeProps {
  tier: RankTier
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-[9px] px-2 py-0.5',
  md: 'text-[11px] px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
}

export function RankBadge({ tier, size = 'md', showIcon = true, className }: RankBadgeProps) {
  const config = RANK_CONFIG[tier]
  return (
    <span
      className={cn(
        'rank-badge font-hud',
        SIZE_CLASSES[size],
        config.color,
        config.bg,
        config.border,
        config.glow,
        className,
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  )
}
