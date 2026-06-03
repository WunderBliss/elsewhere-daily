'use client'

import { useEffect, useState } from 'react'
import {
  buildShareUrl,
  SHARE_PLATFORM_LABELS,
  type SharePlatform,
} from '@/lib/share'

interface Props {
  url: string
  title: string
  excerpt?: string
}

const PLATFORM_ORDER: SharePlatform[] = [
  'x',
  'bluesky',
  'facebook',
  'linkedin',
  'reddit',
  'hackernews',
  'email',
]

export default function ShareButtons({ url, title, excerpt }: Props) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  // Feature-detect navigator.share() on mount. Legitimate sync-from-browser-API
  // effect: the value is fixed for the session and only readable after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    )
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API can fail on insecure origins or older browsers.
      window.prompt('Copy link:', url)
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text: excerpt, url })
    } catch {
      // User dismissed share sheet — silent.
    }
  }

  return (
    <section
      aria-label="Share this article"
      className="mt-12 pt-6 border-t border-gray-200 dark:border-zinc-800"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-3">
        Share
      </h2>
      <div className="flex flex-wrap gap-2">
        {PLATFORM_ORDER.map((p) => (
          <a
            key={p}
            href={buildShareUrl(p, { url, title, excerpt })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {SHARE_PLATFORM_LABELS[p]}
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          aria-live="polite"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>

        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            title="Open your device's share sheet (includes Instagram on mobile)"
          >
            More…
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-400 dark:text-zinc-500">
        Tip: on mobile, tap “More…” to share to Instagram and other apps.
      </p>
    </section>
  )
}
