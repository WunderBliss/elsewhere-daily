// Default base length leaves room for "-NN" / "-NNN" dedupe suffix while
// keeping the final slug ≤ 43 chars. Public articles should advertise 40 as
// the practical cap; the extra 3 chars are reserved for collision suffixes.
export const SLUG_MAX_BASE_LENGTH = 40

/**
 * Normalize an input string into a URL-safe slug.
 *
 * - NFKD-normalizes unicode and strips combining marks ("café" → "cafe")
 * - Lowercases
 * - Replaces any run of non-[a-z0-9] with a single "-"
 * - Trims leading/trailing "-"
 * - Truncates to the last word boundary at or before `maxBaseLength`
 *
 * Returns an empty string when normalization eliminates every character (e.g.
 * input was all emoji). Callers should fall back to a title-derived slug in
 * that case.
 *
 * The `maxBaseLength` is the length of the BASE slug. The collision dedupe
 * step in `findUniqueSlug` may append "-N" suffixes on top of this. With the
 * default of 40 and up to "-NNN" suffixes, the final slug stays ≤ 44 chars.
 */
export function generateSlug(input: string, maxBaseLength: number = SLUG_MAX_BASE_LENGTH): string {
  // NFKD splits accented chars into base + combining marks, then we strip
  // the marks. e.g. "é" (U+00E9) → "e" + U+0301 → "e".
  //
  // We strip apostrophes (straight and curly) FIRST so contractions stay
  // intact ("what's" → "whats", not "what-s"). Everything else outside
  // [a-z0-9] is treated as a word separator.
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2018\u2019\u02bc]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized.length <= maxBaseLength) {
    return normalized
  }

  // Truncate at the last "-" boundary so we don't cut a word in half. If the
  // char immediately past the cut point is itself a "-", we landed cleanly
  // on a word boundary and can keep the full slice. Otherwise back up to the
  // last dash inside the slice. If there's no dash to back up to (the first
  // token alone exceeds maxBaseLength), hard-cut and trim trailing dashes.
  const truncated = normalized.slice(0, maxBaseLength)
  if (normalized[maxBaseLength] === '-') {
    return truncated
  }
  const lastDash = truncated.lastIndexOf('-')
  if (lastDash > 0) {
    return truncated.slice(0, lastDash)
  }
  return truncated.replace(/-+$/, '')
}
