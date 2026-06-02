export function extractExcerpt(markdown: string, maxLength = 160): string {
  const lines = markdown.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      return trimmed.slice(0, maxLength)
    }
  }
  return ''
}
