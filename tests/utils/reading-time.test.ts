import { describe, it, expect } from 'vitest'
import { estimateReadingTime } from '@/lib/utils/reading-time'

describe('estimateReadingTime', () => {
  it('returns the floor of 1 min for empty or null content', () => {
    expect(estimateReadingTime(null).minutes).toBe(1)
    expect(estimateReadingTime(undefined).minutes).toBe(1)
    expect(estimateReadingTime('').minutes).toBe(1)
  })

  it('returns at least 1 minute even for very short content', () => {
    expect(estimateReadingTime('hi there').minutes).toBe(1)
  })

  it('rounds up partial minutes', () => {
    // 250 words at 220 wpm = ~1.14 min → ceil = 2
    const words = Array(250).fill('word').join(' ')
    expect(estimateReadingTime(words).minutes).toBe(2)
  })

  it('produces the expected label string', () => {
    const words = Array(440).fill('word').join(' ') // exactly 2 min
    const out = estimateReadingTime(words)
    expect(out.label).toBe('2 min read')
    expect(out.minutes).toBe(2)
    expect(out.words).toBe(440)
  })

  it('does not count fenced code block contents toward word count', () => {
    const md = [
      'Just two real words.',
      '```ts',
      'const x = "this is not prose and should not count toward reading time"',
      'console.log(x)',
      '```',
    ].join('\n')
    const out = estimateReadingTime(md)
    expect(out.words).toBe(4) // "Just two real words"
  })

  it('does not count inline code contents toward word count', () => {
    const out = estimateReadingTime('See the `function doStuff() { return 42 }` example.')
    // "See the example" → 3 words
    expect(out.words).toBe(3)
  })

  it('counts link text but not the URL', () => {
    const out = estimateReadingTime('Read [the docs](https://example.com/very/long/path) here.')
    // "Read the docs here" → 4 words
    expect(out.words).toBe(4)
  })

  it('strips image markup entirely', () => {
    const out = estimateReadingTime('Look ![a cute cat](https://example.com/cat.jpg) at this.')
    // "Look at this" → 3 words
    expect(out.words).toBe(3)
  })

  it('accepts a custom words-per-minute rate', () => {
    const words = Array(300).fill('word').join(' ')
    // At 100 wpm → 3 min, at 600 wpm → 1 min
    expect(estimateReadingTime(words, 100).minutes).toBe(3)
    expect(estimateReadingTime(words, 600).minutes).toBe(1)
  })
})
