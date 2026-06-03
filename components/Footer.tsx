import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-16">
      <div className="max-w-2xl mx-auto px-4 text-sm text-gray-500 dark:text-gray-400 flex gap-4">
        <span>© {new Date().getFullYear()} Elsewhere Daily</span>
        <Link href="/rss.xml" className="hover:text-gray-700 dark:hover:text-gray-200">RSS</Link>
      </div>
    </footer>
  )
}
