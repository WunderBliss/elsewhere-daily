import { getPublishedArticles, PAGE_SIZE } from '@/lib/db/queries'
import ArticleCard from '@/components/ArticleCard'
import Pagination from '@/components/Pagination'
import { estimateReadingTime } from '@/lib/utils/reading-time'

export const revalidate = false

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const { articles, total } = await getPublishedArticles(page)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Latest</h1>
      {articles.length === 0 && (
        <p className="text-gray-500">No articles yet.</p>
      )}
      {articles.map(({ content, ...article }) => (
        <ArticleCard
          key={article.id}
          {...article}
          readingMinutes={estimateReadingTime(content).minutes}
        />
      ))}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
    </div>
  )
}
