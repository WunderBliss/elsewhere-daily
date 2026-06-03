import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Not found · Elsewhere Daily',
  description: 'The page you were looking for has wandered off.',
}

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
        404
      </p>
      <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-zinc-100">
        Nothing here, somewhere else
      </h1>
      <p className="text-gray-600 dark:text-zinc-400 max-w-md mb-8">
        The page you were looking for has wandered off. Maybe the link is old,
        the slug changed, or the article was never published.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          ← Back to Latest
        </Link>
        <Link
          href="/rss.xml"
          className="inline-flex items-center px-4 py-2 text-sm rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Subscribe via RSS
        </Link>
      </div>
    </div>
  )
}
