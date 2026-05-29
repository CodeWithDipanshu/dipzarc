import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RANK_CONFIG }  from '@/utils/ranks'
import { formatAura }   from '@/utils/helpers'
import type { RankTier } from '@/types'

export const runtime = 'edge'

// Rank tier colours (hex, safe for inline SVG)
const RANK_HEX: Record<string, string> = {
  initiate: '#64748b',
  bronze:   '#b45309',
  silver:   '#94a3b8',
  gold:     '#f59e0b',
  platinum: '#67e8f9',
  diamond:  '#93c5fd',
  legend:   '#c084fc',
  demon:    '#f87171',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('u')

  if (!username) {
    return new NextResponse('Missing username', { status: 400 })
  }

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, weekly_aura, total_aura, daily_streak, rank_tier')
    .eq('username', username)
    .eq('status', 'approved')
    .single()

  if (!profile) {
    return new NextResponse('User not found', { status: 404 })
  }

  const rankCfg  = RANK_CONFIG[profile.rank_tier as RankTier]
  const rankColor = RANK_HEX[profile.rank_tier as RankTier] ?? '#a855f7'
  const initials  = profile.username.slice(0, 2).toUpperCase()

  // Build a standalone SVG share card (1200×630 — standard OG size)
  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630"
     xmlns="http://www.w3.org/2000/svg"
     style="font-family: system-ui, sans-serif">

  <!-- Background -->
  <rect width="1200" height="630" fill="#090910"/>

  <!-- Cyber grid lines -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(147,51,234,0.06)" stroke-width="1"/>
    </pattern>
    <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#9333ea" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#purpleGlow)"/>

  <!-- Glow orbs -->
  <circle cx="200"  cy="100"  r="300" fill="#9333ea" opacity="0.04"/>
  <circle cx="1000" cy="530" r="250" fill="#3b82f6" opacity="0.04"/>

  <!-- Card frame -->
  <rect x="60" y="60" width="1080" height="510" rx="20"
        fill="#0f0f1a" stroke="rgba(147,51,234,0.35)" stroke-width="1.5"/>

  <!-- Top accent line -->
  <rect x="60" y="60" width="1080" height="4" rx="2" fill="#9333ea" opacity="0.8"/>

  <!-- LOGO -->
  <text x="96" y="130" font-size="38" font-weight="700" letter-spacing="6" fill="#a855f7">DIPZ</text>
  <text x="214" y="130" font-size="38" font-weight="700" letter-spacing="6" fill="#60a5fa">ARC</text>
  <text x="96" y="152" font-size="13" letter-spacing="5" fill="#1e293b" font-weight="400">TRAIN · GRIND · ASCEND</text>

  <!-- Divider -->
  <line x1="96" y1="170" x2="1104" y2="170" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

  <!-- Avatar circle -->
  <circle cx="160" cy="310" r="72" fill="url(#avatarGrad)"/>
  <text x="160" y="325" text-anchor="middle" font-size="32" font-weight="700" fill="white">${initials}</text>

  <!-- Rank badge circle overlay -->
  <circle cx="220" cy="368" r="18" fill="#090910"/>
  <circle cx="220" cy="368" r="16" fill="${rankColor}" opacity="0.2" stroke="${rankColor}" stroke-width="1.5"/>
  <text x="220" y="374" text-anchor="middle" font-size="13" fill="${rankColor}">${rankCfg.icon}</text>

  <!-- Username -->
  <text x="265" y="290" font-size="48" font-weight="700" letter-spacing="2" fill="#f1f5f9">
    ${profile.username}
  </text>

  <!-- Rank label -->
  <rect x="265" y="302" width="${rankCfg.label.length * 11 + 24}" height="28" rx="5"
        fill="${rankColor}" opacity="0.15" stroke="${rankColor}" stroke-width="1" stroke-opacity="0.5"/>
  <text x="${265 + 12}" y="321" font-size="13" font-weight="700" letter-spacing="2" fill="${rankColor}">
    ${rankCfg.label}
  </text>

  <!-- Stats grid (3 cards) -->
  <!-- Weekly Aura -->
  <rect x="265" y="350" width="240" height="100" rx="12"
        fill="rgba(147,51,234,0.08)" stroke="rgba(147,51,234,0.3)" stroke-width="1"/>
  <text x="285" y="378" font-size="11" letter-spacing="2" fill="#475569" font-weight="600">WEEKLY AURA</text>
  <text x="285" y="420" font-size="34" font-weight="700" fill="#a855f7">${formatAura(profile.weekly_aura)}</text>

  <!-- Total Aura -->
  <rect x="525" y="350" width="240" height="100" rx="12"
        fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.25)" stroke-width="1"/>
  <text x="545" y="378" font-size="11" letter-spacing="2" fill="#475569" font-weight="600">TOTAL AURA</text>
  <text x="545" y="420" font-size="34" font-weight="700" fill="#60a5fa">${formatAura(profile.total_aura)}</text>

  <!-- Streak -->
  <rect x="785" y="350" width="200" height="100" rx="12"
        fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.3)" stroke-width="1"/>
  <text x="805" y="378" font-size="11" letter-spacing="2" fill="#475569" font-weight="600">STREAK</text>
  <text x="805" y="420" font-size="34" font-weight="700" fill="#f59e0b">🔥 ${profile.daily_streak}</text>

  <!-- Footer -->
  <text x="96" y="528" font-size="13" letter-spacing="2" fill="#1e293b">
    dipzarc.com · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
  </text>
</svg>`.trim()

  return new NextResponse(svg, {
    headers: {
      'Content-Type':  'image/svg+xml',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  })
}
