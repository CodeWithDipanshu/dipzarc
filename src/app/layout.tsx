import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'DipzArc — Train. Grind. Ascend.',
  description: 'Gamified self-improvement. Earn aura. Climb the leaderboard. Become the demon.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title:       'DipzArc',
    description: 'Gamified self-improvement platform',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
