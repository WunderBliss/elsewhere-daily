import { Feed } from 'feed'
import { getAllPublishedArticlesForFeed } from '@/lib/db/queries'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const feedArticles = await getAllPublishedArticlesForFeed()

  const feed = new Feed({
    title: 'Elsewhere Daily',
    description: 'An AI-powered daily newsletter.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    updated: feedArticles[0]?.publishedAt ?? new Date(),
    copyright: `© ${new Date().getFullYear()} Elsewhere Daily`,
    feedLinks: { rss2: `${siteUrl}/rss.xml` },
  })

  for (const article of feedArticles) {
    feed.addItem({
      title: article.title,
      id: `${siteUrl}/${article.slug}`,
      link: `${siteUrl}/${article.slug}`,
      description: article.excerpt ?? '',
      date: article.publishedAt ?? new Date(),
      author: [{ name: article.authorName ?? 'Elsewhere Daily' }],
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
