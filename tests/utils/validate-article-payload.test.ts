import { describe, it, expect } from 'vitest'
import { validateArticlePayload } from '@/lib/utils/validate-article-payload'

describe('validateArticlePayload', () => {
  it('accepts valid payload with required fields only', () => {
    const result = validateArticlePayload({ title: 'Hello', content: 'Body text' })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.title).toBe('Hello')
      expect(result.data.tags).toEqual([])
    }
  })

  it('accepts valid payload with all optional fields', () => {
    const result = validateArticlePayload({
      title: 'Hello',
      content: 'Body',
      excerpt: 'Short',
      tags: ['a', 'b'],
    })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.excerpt).toBe('Short')
      expect(result.data.tags).toEqual(['a', 'b'])
    }
  })

  it('rejects missing title', () => {
    const result = validateArticlePayload({ content: 'Body' })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/title/)
  })

  it('rejects empty title', () => {
    const result = validateArticlePayload({ title: '   ', content: 'Body' })
    expect(result.valid).toBe(false)
  })

  it('rejects missing content', () => {
    const result = validateArticlePayload({ title: 'Hello' })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/content/)
  })

  it('rejects non-string excerpt', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', excerpt: 123 })
    expect(result.valid).toBe(false)
  })

  it('rejects non-array tags', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', tags: 'tag' })
    expect(result.valid).toBe(false)
  })

  it('rejects non-string tag items', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', tags: [1, 2] })
    expect(result.valid).toBe(false)
  })

  it('rejects non-object body', () => {
    expect(validateArticlePayload(null).valid).toBe(false)
    expect(validateArticlePayload('string').valid).toBe(false)
  })

  it('accepts optional slug field as a string', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', slug: 'custom-slug' })
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.data.slug).toBe('custom-slug')
  })

  it('trims whitespace from slug', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', slug: '  custom  ' })
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.data.slug).toBe('custom')
  })

  it('leaves slug undefined when omitted', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C' })
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.data.slug).toBeUndefined()
  })

  it('rejects non-string slug', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', slug: 123 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/slug/)
  })
})
