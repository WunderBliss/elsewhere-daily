import Link from 'next/link'
import { getDraftArticles, getPublishedArticles } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [drafts, { articles: published }] = await Promise.all([
    getDraftArticles(),
    getPublishedArticles(1),
  ])

  const formatDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d) : '—'

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Dashboard</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          View site →
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Drafts ({drafts.length})
        </h2>
        {drafts.length === 0 && <p className="text-gray-400 dark:text-zinc-500 text-sm">No drafts.</p>}
        <ul className="space-y-2">
          {drafts.map((a) => (
            <li key={a.id} className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded px-4 py-3">
              <Link href={`/admin/articles/${a.id}`} className="font-medium text-gray-900 hover:text-gray-600 dark:text-zinc-100 dark:hover:text-zinc-400 text-sm">
                {a.title}
              </Link>
              <span className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Published
        </h2>
        {published.length === 0 && <p className="text-gray-400 dark:text-zinc-500 text-sm">Nothing published yet.</p>}
        <ul className="space-y-2">
          {published.map((a) => (
            <li key={a.id} className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded px-4 py-3">
              <Link href={`/admin/articles/${a.id}`} className="font-medium text-gray-900 hover:text-gray-600 dark:text-zinc-100 dark:hover:text-zinc-400 text-sm">
                {a.title}
              </Link>
              <span className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(a.publishedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
