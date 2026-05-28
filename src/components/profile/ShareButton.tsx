'use client'

import { useState } from 'react'
import { Share2, Link2, Download, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ShareButtonProps {
  username:  string
  className?: string
}

export function ShareButton({ username, className }: ShareButtonProps) {
  const [open,    setOpen]    = useState(false)
  const [copied,  setCopied]  = useState(false)

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/u/${username}`
  const cardUrl    = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/share-card?u=${username}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCard = () => {
    const a = document.createElement('a')
    a.href     = cardUrl
    a.download = `${username}-dipzarc.svg`
    a.click()
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
      >
        <Share2 size={12} />
        Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-52 card-purple p-2 shadow-glow-sm animate-counter-up">
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
            >
              {copied
                ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                : <Link2       size={14} className="text-slate-500 flex-shrink-0" />
              }
              <div>
                <div className="font-hud font-bold text-xs text-slate-200 uppercase tracking-wider">
                  {copied ? 'Copied!' : 'Copy Profile Link'}
                </div>
                <div className="font-hud text-[10px] text-slate-600 truncate max-w-[140px]">
                  /u/{username}
                </div>
              </div>
            </button>

            <div className="border-t border-white/[0.05] my-1" />

            <button
              onClick={downloadCard}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
            >
              <Download size={14} className="text-slate-500 flex-shrink-0" />
              <div>
                <div className="font-hud font-bold text-xs text-slate-200 uppercase tracking-wider">
                  Download Card
                </div>
                <div className="font-hud text-[10px] text-slate-600">
                  1200×630 SVG
                </div>
              </div>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <>
                <div className="border-t border-white/[0.05] my-1" />
                <button
                  onClick={() => {
                    navigator.share({
                      title: `${username} on DipzArc`,
                      url:   profileUrl,
                    }).catch(() => {})
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Share2 size={14} className="text-purple-400 flex-shrink-0" />
                  <div className="font-hud font-bold text-xs text-purple-400 uppercase tracking-wider">
                    Share via…
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
