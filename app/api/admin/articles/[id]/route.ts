import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)

  if (!body) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const { title, slug, tags } = body as Record<string, unknown>
  const update: Partial<typeof articles.$inferInsert> = { updatedAt: new Date() }

  if (typeof title === 'string' && title.trim()) update.title = title.trim()
  if (typeof slug === 'string' && slug.trim()) update.slug = slug.trim()
  if (Array.isArray(tags) && tags.every((t) => typeof t === 'string')) update.tags = tags

  const [updated] = await db
    .update(articles)
    .set(update)
    .where(eq(articles.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
