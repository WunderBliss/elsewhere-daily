import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleById } from '@/lib/db/queries'
import ArticleEditor from './ArticleEditor'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminArticlePage({ params }: Props) {
  const { id } = await params
  const article = await getArticleById(id)
  if (!article) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← Dashboard
        </Link>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {article.status}
        </span>
      </div>
      <ArticleEditor article={article} />
    </div>
  )
}
