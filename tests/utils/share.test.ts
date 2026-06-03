import { describe, it, expect } from 'vitest'
import { buildShareUrl, SHARE_PLATFORM_LABELS, type SharePlatform } from '@/lib/share'

const baseInput = {
  url: 'https://elsewhere.daily/hello-world',
  title: 'Hello, World!',
  excerpt: 'A friendly greeting.',
}

describe('buildShareUrl', () => {
  it('builds an X intent URL with url and text params', () => {
    const out = buildShareUrl('x', baseInput)
    expect(out).toContain('https://x.com/intent/tweet?')
    expect(out).toContain('url=' + encodeURIComponent(baseInput.url))
    expect(out).toContain('text=' + encodeURIComponent(baseInput.title))
  })

  it('builds a Bluesky compose URL with title and url combined in text', () => {
    const out = buildShareUrl('bluesky', baseInput)
    expect(out).toContain('https://bsky.app/intent/compose?text=')
    // Combined text should appear URI-encoded
    expect(out).toContain(encodeURIComponent(`${baseInput.title} ${baseInput.url}`))
  })

  it('builds a Facebook sharer URL', () => {
    const out = buildShareUrl('facebook', baseInput)
    expect(out).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseInput.url)}`,
    )
  })

  it('builds a LinkedIn share URL', () => {
    const out = buildShareUrl('linkedin', baseInput)
    expect(out).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseInput.url)}`,
    )
  })

  it('builds a Reddit submit URL with url and title', () => {
    const out = buildShareUrl('reddit', baseInput)
    expect(out).toContain('https://reddit.com/submit?')
    expect(out).toContain('url=' + encodeURIComponent(baseInput.url))
    expect(out).toContain('title=' + encodeURIComponent(baseInput.title))
  })

  it('builds a Hacker News submit URL', () => {
    const out = buildShareUrl('hackernews', baseInput)
    expect(out).toContain('https://news.ycombinator.com/submitlink?')
    expect(out).toContain('u=' + encodeURIComponent(baseInput.url))
    expect(out).toContain('t=' + encodeURIComponent(baseInput.title))
  })

  it('builds a mailto URL with subject, body, and a newline before the link', () => {
    const out = buildShareUrl('email', baseInput)
    expect(out.startsWith('mailto:?')).toBe(true)
    expect(out).toContain('subject=' + encodeURIComponent(baseInput.title))
    // Body has the combined text + %0A%0A + URL
    expect(out).toContain('%0A%0A' + encodeURIComponent(baseInput.url))
  })

  it('properly encodes characters that have URL meaning', () => {
    const tricky = {
      url: 'https://example.com/post?id=1&ref=foo bar',
      title: 'A & B: "tricky" / cases',
    }
    const out = buildShareUrl('x', tricky)
    expect(out).toContain(encodeURIComponent(tricky.url))
    expect(out).toContain(encodeURIComponent(tricky.title))
    // Must not contain unencoded ampersand from the title
    expect(out).not.toContain('A & B')
  })

  it('falls back to title-only text when excerpt is missing (email body)', () => {
    const out = buildShareUrl('email', { url: baseInput.url, title: baseInput.title })
    expect(out).toContain('body=' + encodeURIComponent(baseInput.title))
  })

  it('exposes a human label for every platform', () => {
    const platforms: SharePlatform[] = [
      'x',
      'bluesky',
      'facebook',
      'linkedin',
      'reddit',
      'hackernews',
      'email',
    ]
    for (const p of platforms) {
      expect(SHARE_PLATFORM_LABELS[p]).toBeTruthy()
    }
  })
})
