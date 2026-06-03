import Link from 'next/link'

interface Props {
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | null
  authorName: string | null
}

export default function ArticleCard({ title, slug, excerpt, publishedAt, authorName }: Props) {
  const date = publishedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(publishedAt)
    : null

  return (
    <article className="py-6 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Link href={`/${slug}`} className="group">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-600 dark:group-hover:text-gray-300 mb-1">
          {title}
        </h2>
      </Link>
      {excerpt && (
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-2">{excerpt}</p>
      )}
      <div className="text-xs text-gray-400 dark:text-gray-500 flex gap-2">
        {authorName && <span>{authorName}</span>}
        {date && <span>{date}</span>}
      </div>
    </article>
  )
}
