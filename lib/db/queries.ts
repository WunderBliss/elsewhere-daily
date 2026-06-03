import { db } from './index'
import { articles, authors } from './schema'
import { eq, desc, count, and } from 'drizzle-orm'

export const PAGE_SIZE = 20

export async function getPublishedArticles(page: number) {
  const offset = (page - 1) * PAGE_SIZE
  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        // content needed for reading-time estimate; payload is small enough at
        // page size 20 that this is not worth a denormalized column yet.
        content: articles.content,
        publishedAt: articles.publishedAt,
        authorName: authors.name,
      })
      .from(articles)
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(articles).where(eq(articles.status, 'published')),
  ])
  return { articles: rows, total: Number(countRows[0].total) }
}

export async function getPublishedArticleSlugs() {
  return db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, 'published'))
}

export async function getArticleBySlug(slug: string) {
  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: authors.name,
    })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
    .limit(1)
  return article ?? null
}

export async function getAllPublishedArticlesForFeed() {
  return db
    .select({
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: authors.name,
    })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(50)
}

export async function getDraftArticles() {
  return db
    .select()
    .from(articles)
    .where(eq(articles.status, 'draft'))
    .orderBy(desc(articles.createdAt))
}

export async function getArticleById(id: string) {
  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
  return article ?? null
}

export async function getDefaultAuthorId(): Promise<string | null> {
  const [author] = await db
    .select({ id: authors.id })
    .from(authors)
    .where(eq(authors.slug, 'elsewhere-daily'))
    .limit(1)
  return author?.id ?? null
}
