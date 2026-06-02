import { describe, it, expect } from 'vitest'
import { extractExcerpt } from '@/lib/utils/excerpt'

describe('extractExcerpt', () => {
  it('extracts first non-heading paragraph', () => {
    const md = '# Title\n\nFirst paragraph here.\n\nSecond paragraph.'
    expect(extractExcerpt(md)).toBe('First paragraph here.')
  })

  it('skips multiple heading levels', () => {
    const md = '# H1\n\n## H2\n\nActual content.'
    expect(extractExcerpt(md)).toBe('Actual content.')
  })

  it('truncates to maxLength', () => {
    const md = `# Title\n\n${'a'.repeat(200)}`
    expect(extractExcerpt(md)).toHaveLength(160)
  })

  it('respects custom maxLength', () => {
    const md = '# Title\n\nSome content here.'
    expect(extractExcerpt(md, 7)).toBe('Some co')
  })

  it('returns empty string when no prose found', () => {
    expect(extractExcerpt('# Only headings\n\n## Another')).toBe('')
  })

  it('skips blank lines', () => {
    expect(extractExcerpt('\n\n\n# Title\n\nContent.')).toBe('Content.')
  })
})
