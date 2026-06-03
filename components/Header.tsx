import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 py-4">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Elsewhere Daily
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
