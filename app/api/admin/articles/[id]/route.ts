import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

// PATCH: partial update. Caller may send any subset of:
//   title, slug, tags, content, excerpt
// Empty strings on content/excerpt are treated as "clear this field" only for
// excerpt (nullable); content must remain a non-empty string. Slug edits are
// passed through verbatim — no normalization on this path (V1 scope, see notes).
//
// Auth is enforced by middleware on /api/admin/*; no header check needed here.
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { title, slug, tags, content, excerpt } = body as Record<string, unknown>
  const update: Partial<typeof articles.$inferInsert> = { updatedAt: new Date() }

  if (typeof title === 'string' && title.trim()) update.title = title.trim()
  if (typeof slug === 'string' && slug.trim()) update.slug = slug.trim()
  if (Array.isArray(tags) && tags.every((t) => typeof t === 'string')) update.tags = tags
  if (typeof content === 'string' && content.trim()) update.content = content
  if (typeof excerpt === 'string') {
    // Allow clearing the excerpt by sending an empty string; UI auto-derives
    // from the first prose paragraph at publish time when null.
    update.excerpt = excerpt.trim() || null
  }

  const [updated] = await db
    .update(articles)
    .set(update)
    .where(eq(articles.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })

  // If the article is live, bust the cache so edits appear immediately.
  if (updated.status === 'published') {
    revalidatePath(`/${updated.slug}`)
    revalidatePath('/')
    revalidatePath('/rss.xml')
  }

  return Response.json({ ok: true, slug: updated.slug })
}

// DELETE: hard delete. V1 has no soft-delete / archive; the goal is to give
// admins a way to retire articles that shouldn't exist (wrong topic from the
// agent, duplicates, etc.). If the article was live, revalidate so the public
// surfaces drop it from the index.
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params

  const [deleted] = await db
    .delete(articles)
    .where(eq(articles.id, id))
    .returning({ slug: articles.slug, status: articles.status })

  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 })

  if (deleted.status === 'published') {
    revalidatePath(`/${deleted.slug}`)
    revalidatePath('/')
    revalidatePath('/rss.xml')
  }

  return Response.json({ ok: true })
}
