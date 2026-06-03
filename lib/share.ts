/**
 * Pure helpers for building third-party share URLs.
 * Kept side-effect free so the unit tests can exercise them directly.
 *
 * Note on Instagram: there is no public web share URL. We rely on
 * `navigator.share()` (the mobile OS share sheet exposes Instagram)
 * and a copy-to-clipboard fallback. See ShareButtons.tsx for UX notes.
 */

export type SharePlatform =
  | 'x'
  | 'bluesky'
  | 'facebook'
  | 'linkedin'
  | 'reddit'
  | 'hackernews'
  | 'email'

export interface ShareInput {
  url: string
  title: string
  excerpt?: string
}

export function buildShareUrl(platform: SharePlatform, input: ShareInput): string {
  const { url, title, excerpt } = input
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const text = encodeURIComponent(excerpt ? `${title} — ${excerpt}` : title)

  switch (platform) {
    case 'x':
      return `https://x.com/intent/tweet?url=${u}&text=${t}`
    case 'bluesky':
      // Bluesky compose intent accepts a single `text` param; include the URL inline
      // so it appears as a link card after posting.
      return `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
    case 'reddit':
      return `https://reddit.com/submit?url=${u}&title=${t}`
    case 'hackernews':
      return `https://news.ycombinator.com/submitlink?u=${u}&t=${t}`
    case 'email':
      return `mailto:?subject=${t}&body=${text}%0A%0A${u}`
    default: {
      // Exhaustiveness check — TS will flag any new platform that isn't handled.
      const _exhaustive: never = platform
      return _exhaustive
    }
  }
}

export const SHARE_PLATFORM_LABELS: Record<SharePlatform, string> = {
  x: 'X',
  bluesky: 'Bluesky',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  hackernews: 'Hacker News',
  email: 'Email',
}
