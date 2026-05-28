import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="font-hud text-[120px] font-bold text-white/[0.03] leading-none select-none mb-4">
        404
      </div>
      <div className="font-hud text-4xl font-bold text-purple-400 text-glow-purple tracking-widest mb-2">
        ARC NOT FOUND
      </div>
      <p className="font-hud text-slate-600 text-sm uppercase tracking-widest mb-8">
        This path doesn't exist in your arc.
      </p>
      <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
        ⚡ Back to Dashboard
      </Link>
    </div>
  )
}
