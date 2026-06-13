import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateArticlePayload } from '@/lib/utils/validate-article-payload'
import { generateSlug } from '@/lib/utils/slug'
import { extractExcerpt } from '@/lib/utils/excerpt'
import { getDefaultAuthorId, getPublishedArticles } from '@/lib/db/queries'

async function findUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1)
    if (existing.length === 0) return slug
    attempt++
    slug = `${baseSlug}-${attempt}`
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${process.env.OPENCLAW_API_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const validation = validateArticlePayload(body)
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 422 })
  }

  const { title, content, excerpt, tags, slug: suppliedSlug } = validation.data

  // Slug resolution:
  //   1. If client supplied a slug, normalize it. Use it if non-empty.
  //   2. Otherwise (or if normalization wiped everything out, e.g. all emoji),
  //      derive from the title.
  //   3. Either way, run through findUniqueSlug for collision dedupe.
  //
  // generateSlug enforces the 40-char base cap, so all-emoji or pathological
  // titles can't blow past it anymore.
  const normalizedFromSlug = suppliedSlug ? generateSlug(suppliedSlug) : ''
  // Final fallback: if both the supplied slug and the title normalize to empty
  // (e.g. title is all emoji), use a generic stem so the article is still
  // reachable. findUniqueSlug will dedupe.
  const baseSlug = normalizedFromSlug || generateSlug(title) || 'untitled'
  const slug = await findUniqueSlug(baseSlug)
  const resolvedExcerpt = excerpt ?? extractExcerpt(content)
  const authorId = await getDefaultAuthorId()

  const [article] = await db
    .insert(articles)
    .values({ title, slug, content, excerpt: resolvedExcerpt, tags, authorId })
    .returning({ id: articles.id, slug: articles.slug })

  return Response.json({ id: article.id, slug: article.slug }, { status: 201 })
}

// Lists recently published articles for the MCP `list_recent_published` tool.
// Returns ONLY published articles, so no auth — the data is already public on
// the homepage. Exists as JSON so callers don't have to parse HTML.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  if (status !== 'published') {
    return Response.json(
      { error: 'Only status=published is supported on this endpoint' },
      { status: 400 },
    )
  }

  const limitParam = url.searchParams.get('limit')
  const requested = limitParam ? parseInt(limitParam, 10) : 20
  const limit = Math.max(1, Math.min(50, Number.isFinite(requested) ? requested : 20))

  // Reuse the homepage query; trim to `limit` rows.
  const { articles: published } = await getPublishedArticles(1)
  const trimmed = published.slice(0, limit).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    authorName: a.authorName,
  }))

  return Response.json({ articles: trimmed })
}
