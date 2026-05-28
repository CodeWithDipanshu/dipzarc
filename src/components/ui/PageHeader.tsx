import { cn } from '@/utils/helpers'

interface PageHeaderProps {
  title:       string
  subtitle?:   string
  right?:      React.ReactNode
  className?:  string
}

export function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0f0f1a]/80 backdrop-blur-sm sticky top-0 z-10',
      className,
    )}>
      <div>
        <h1 className="font-hud font-bold text-lg tracking-widest text-slate-100 uppercase">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-slate-600 font-hud mt-0.5 tracking-wider">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
