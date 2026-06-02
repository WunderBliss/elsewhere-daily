import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/utils/slug'

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
})
