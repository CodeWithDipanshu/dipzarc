import { cn } from '@/utils/helpers'

interface LoadingProps {
  text?:      string
  className?: string
  size?:      'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
}

export function Loading({ text = 'Loading…', className, size = 'md' }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn(
        'rounded-full border-purple-500/30 border-t-purple-500 animate-spin',
        SIZES[size],
      )} />
      {text && (
        <span className="text-xs text-slate-600 font-hud uppercase tracking-widest">{text}</span>
      )}
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loading size="lg" text="Loading…" />
    </div>
  )
}
