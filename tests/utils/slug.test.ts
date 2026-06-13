import { describe, it, expect } from 'vitest'
import { generateSlug, SLUG_MAX_BASE_LENGTH } from '@/lib/utils/slug'

describe('generateSlug', () => {
  it('converts title to lowercase kebab-case', () => {
    expect(generateSlug('The Case for Slowing Down')).toBe('the-case-for-slowing-down')
  })

  it('strips special characters', () => {
    expect(generateSlug("What's Next?")).toBe('whats-next')
  })

  it('collapses multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world')
  })

  it('collapses consecutive hyphens', () => {
    expect(generateSlug('A -- B')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  hello  ')).toBe('hello')
  })

  it('strips diacritics via NFKD normalization', () => {
    expect(generateSlug('Café résumé naïve')).toBe('cafe-resume-naive')
  })

  it('handles emoji and non-ascii by stripping them', () => {
    expect(generateSlug('Hello 🔥 World')).toBe('hello-world')
  })

  it('returns empty string when input has no slug-able characters', () => {
    expect(generateSlug('🔥🎉')).toBe('')
    expect(generateSlug('   ')).toBe('')
  })

  it('truncates at default max base length (40)', () => {
    const long = 'the quick brown fox jumps over the lazy dog and then some'
    const result = generateSlug(long)
    expect(result.length).toBeLessThanOrEqual(SLUG_MAX_BASE_LENGTH)
  })

  it('truncates at the last word boundary, not mid-word', () => {
    // "the-quick-brown-fox-jumps-over-the-lazy-dog" = 43 chars, exceeds 40.
    // Hard cut at 40 → "the-quick-brown-fox-jumps-over-the-lazy-" with trailing dash.
    // Should instead trim back to last "-" boundary.
    const result = generateSlug('the quick brown fox jumps over the lazy dog')
    expect(result).toBe('the-quick-brown-fox-jumps-over-the-lazy')
    expect(result.endsWith('-')).toBe(false)
  })

  it('respects a custom maxBaseLength', () => {
    expect(generateSlug('hello world from elsewhere', 11)).toBe('hello-world')
  })

  it('hard-cuts when the first word exceeds maxBaseLength', () => {
    // Single long token, no dash to fall back to. Should truncate and not
    // emit a trailing dash.
    expect(generateSlug('supercalifragilisticexpialidocious', 10)).toBe('supercalif')
  })

  it('handles already-slug-formatted input idempotently', () => {
    expect(generateSlug('already-a-slug')).toBe('already-a-slug')
  })

  it('treats underscores and dots as separators', () => {
    expect(generateSlug('foo_bar.baz')).toBe('foo-bar-baz')
  })
})
