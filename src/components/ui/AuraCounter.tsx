'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/helpers'

interface AuraCounterProps {
  value:      number
  className?: string
  duration?:  number   // animation ms
  prefix?:    string
  suffix?:    string
}

export function AuraCounter({ value, className, duration = 800, prefix = '', suffix = '' }: AuraCounterProps) {
  const [display, setDisplay] = useState(value)
  const prevRef  = useRef(value)
  const frameRef = useRef<number>()

  useEffect(() => {
    const start    = prevRef.current
    const end      = value
    const delta    = end - start
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + delta * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
      else prevRef.current = end
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value, duration])

  return (
    <span className={cn('aura-number tabular-nums', className)}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  )
}
