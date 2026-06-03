/**
 * Estimate reading time for a piece of markdown content.
 *
 * Strategy:
 *   1. Strip code fences, inline code, image markup, and link syntax so they
 *      don't artificially inflate the word count.
 *   2. Count whitespace-separated tokens of length >= 1.
 *   3. Divide by an average reading rate (default 220 wpm — typical for
 *      English prose; slightly slower than a "casual scan" but faster than
 *      heavy technical reading).
 *   4. Round up to the nearest whole minute, with a floor of 1.
 */

const DEFAULT_WPM = 220

export interface ReadingTime {
  words: number
  minutes: number
  /** Pre-formatted label like "3 min read" — convenient for templates. */
  label: string
}

export function estimateReadingTime(
  content: string | null | undefined,
  wordsPerMinute: number = DEFAULT_WPM,
): ReadingTime {
  if (!content) return { words: 0, minutes: 1, label: '1 min read' }

  // Strip fenced code blocks
  let text = content.replace(/```[\s\S]*?```/g, ' ')
  // Strip inline code
  text = text.replace(/`[^`]*`/g, ' ')
  // Strip image markup ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  // Replace link syntax [text](url) with just the text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  // Strip remaining markdown punctuation that isn't a word boundary
  text = text.replace(/[#>*_~\-]+/g, ' ')

  const tokens = text.split(/\s+/).filter((t) => t.length > 0)
  const words = tokens.length

  const rawMinutes = words / Math.max(1, wordsPerMinute)
  const minutes = Math.max(1, Math.ceil(rawMinutes))

  return { words, minutes, label: `${minutes} min read` }
}
