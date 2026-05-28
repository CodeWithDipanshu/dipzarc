import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format seconds → MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Format large numbers → 1.2k, 45.3k, 1.2M */
export function formatAura(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

/** Format a date to "Week of May 5" */
export function formatWeek(dateStr: string): string {
  const d = new Date(dateStr)
  return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

/** Returns start of current week (Monday 00:00 UTC) */
export function currentWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()                          // 0 = Sun
  const diff = (day === 0 ? -6 : 1 - day)             // offset to Monday
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

/** Returns ordinal rank label: 1st, 2nd, 3rd, 4th… */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

/** Delay helper for async flows */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Truncate username for display */
export function truncate(str: string, len = 12): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

/** Pluralise a word */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n !== 1 ? 's' : ''}`
}
