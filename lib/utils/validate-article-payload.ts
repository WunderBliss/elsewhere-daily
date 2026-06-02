export interface ArticlePayload {
  title: string
  content: string
  excerpt?: string
  tags: string[]
}

type ValidationResult =
  | { valid: true; data: ArticlePayload }
  | { valid: false; error: string }

export function validateArticlePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const { title, content, excerpt, tags } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return { valid: false, error: 'title is required and must be a non-empty string' }
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return { valid: false, error: 'content is required and must be a non-empty string' }
  }
  if (excerpt !== undefined && typeof excerpt !== 'string') {
    return { valid: false, error: 'excerpt must be a string' }
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
      return { valid: false, error: 'tags must be an array of strings' }
    }
  }

  return {
    valid: true,
    data: {
      title: title.trim(),
      content: content.trim(),
      excerpt: typeof excerpt === 'string' ? excerpt.trim() : undefined,
      tags: Array.isArray(tags) ? (tags as string[]) : [],
    },
  }
}
