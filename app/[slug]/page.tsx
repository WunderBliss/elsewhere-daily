import { notFound } from 'next/navigation'
import { getArticleBySlug, getPublishedArticleSlugs } from '@/lib/db/queries'
import ArticleContent from '@/components/ArticleContent'
import ShareButtons from '@/components/ShareButtons'
import { estimateReadingTime } from '@/lib/utils/reading-time'
import type { Metadata } from 'next'

export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getPublishedArticleSlugs()
  return slugs.map((s) => ({ slug: s.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')

  return {
    title: `${article.title} | Elsewhere Daily`,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `${siteUrl}/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      url: `${siteUrl}/${slug}`,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const date = article.publishedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(article.publishedAt)
    : null

  const reading = estimateReadingTime(article.content)

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-zinc-100">{article.title}</h1>
        <div className="text-sm text-gray-400 dark:text-zinc-500 flex flex-wrap gap-x-2 gap-y-1">
          {article.authorName && <span>{article.authorName}</span>}
          {date && <span>{date}</span>}
          <span>{reading.label}</span>
        </div>
      </header>
      <ArticleContent content={article.content ?? ''} />
      <ShareButtons
        url={`${(process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')}/${slug}`}
        title={article.title}
        excerpt={article.excerpt ?? undefined}
      />
    </article>
  )
}
