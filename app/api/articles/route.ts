import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateArticlePayload } from '@/lib/utils/validate-article-payload'
import { generateSlug } from '@/lib/utils/slug'
import { extractExcerpt } from '@/lib/utils/excerpt'
import { getDefaultAuthorId } from '@/lib/db/queries'

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

  const { title, content, excerpt, tags } = validation.data
  const baseSlug = generateSlug(title)
  const slug = await findUniqueSlug(baseSlug)
  const resolvedExcerpt = excerpt ?? extractExcerpt(content)
  const authorId = await getDefaultAuthorId()

  const [article] = await db
    .insert(articles)
    .values({ title, slug, content, excerpt: resolvedExcerpt, tags, authorId })
    .returning({ id: articles.id, slug: articles.slug })

  return Response.json({ id: article.id, slug: article.slug }, { status: 201 })
}
