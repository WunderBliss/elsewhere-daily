import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [article] = await db
    .update(articles)
    .set({ status: 'draft', publishedAt: null, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning()

  if (!article) return Response.json({ error: 'Not found' }, { status: 404 })

  revalidatePath(`/${article.slug}`)
  revalidatePath('/')
  revalidatePath('/rss.xml')
  revalidatePath('/sitemap.xml')

  return Response.json({ ok: true, slug: article.slug })
}
