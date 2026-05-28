export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl animate-pulse"
             style={{ background: 'radial-gradient(circle, #9333ea, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl animate-pulse"
             style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
             style={{ background: 'radial-gradient(circle, #9333ea, #3b82f6, transparent)' }} />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-hud text-4xl font-bold tracking-[0.2em] mb-2">
            <span className="text-purple-400 text-glow-purple">DIPZ</span>
            <span className="text-blue-400">ARC</span>
          </div>
          <div className="text-[11px] text-slate-600 tracking-[0.3em] uppercase font-hud">
            Train · Grind · Ascend
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
