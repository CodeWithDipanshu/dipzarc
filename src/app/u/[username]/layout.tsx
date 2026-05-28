import type { Metadata } from 'next'
import { createClient }  from '@/lib/supabase/server'

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, rank_tier, weekly_aura, total_aura')
    .eq('username', params.username)
    .eq('status', 'approved')
    .single()

  if (!profile) {
    return { title: 'DipzArc — User Not Found' }
  }

  const cardUrl =
    `${process.env.NEXT_PUBLIC_APP_URL}/api/share-card?u=${profile.username}`

  return {
    title:       `${profile.username} — DipzArc`,
    description: `Check out ${profile.username}'s arc. ${profile.weekly_aura.toLocaleString()} weekly aura · ${profile.rank_tier.toUpperCase()} rank.`,
    openGraph: {
      title:       `${profile.username} on DipzArc`,
      description: `${profile.weekly_aura.toLocaleString()} weekly aura · ${profile.rank_tier.toUpperCase()}`,
      images: [{ url: cardUrl, width: 1200, height: 630, alt: `${profile.username}'s DipzArc card` }],
      type:  'profile',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${profile.username} on DipzArc`,
      description: `${profile.weekly_aura.toLocaleString()} weekly aura · ${profile.rank_tier.toUpperCase()}`,
      images:      [cardUrl],
    },
  }
}

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
