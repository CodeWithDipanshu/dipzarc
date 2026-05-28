import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DipzArc brand palette
        brand: {
          purple:    '#9333ea',
          'purple-dim': '#7c3aed33',
          blue:      '#3b82f6',
          'blue-dim':   '#3b82f622',
          red:       '#ef4444',
          gold:      '#f59e0b',
        },
        surface: {
          DEFAULT: '#0f0f1a',
          2:       '#14142a',
          3:       '#1a1a35',
        },
        aura: '#9333ea',
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        exo:      ['Exo 2',   'sans-serif'],
      },
      backgroundImage: {
        'aura-glow':
          'radial-gradient(ellipse at 50% 0%, #9333ea22 0%, transparent 60%)',
        'cyber-grid':
          'linear-gradient(rgba(147,51,234,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(147,51,234,0.4)',
        'glow-blue':   '0 0 20px rgba(59,130,246,0.4)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.4)',
        'glow-sm':     '0 0 10px rgba(147,51,234,0.3)',
      },
      animation: {
        'aura-pulse':    'auraPulse 2s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
        'counter-up':    'counterUp 0.6s ease-out forwards',
        'rank-unlock':   'rankUnlock 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'streak-flame':  'streakFlame 0.5s ease-in-out infinite alternate',
      },
      keyframes: {
        auraPulse: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(0.97)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        counterUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        rankUnlock: {
          from: { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' },
          to:   { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        streakFlame: {
          from: { transform: 'scaleY(1)   skewX(-2deg)' },
          to:   { transform: 'scaleY(1.1) skewX(2deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
