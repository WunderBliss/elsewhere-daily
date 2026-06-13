// Look up an article by slug, including drafts. Requires Bearer auth so the
// draft queue stays private. Used by the MCP `check_submission` tool to confirm
// a draft landed and inspect its current status.

import { db } from '@/lib/db'
import { articles, authors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${process.env.OPENCLAW_API_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  const [row] = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      content: articles.content,
      status: articles.status,
      tags: articles.tags,
      createdAt: articles.createdAt,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
      authorName: authors.name,
    })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(eq(articles.slug, slug))
    .limit(1)

  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    authorName: row.authorName,
    status: row.status,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}
