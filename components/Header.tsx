import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 py-4">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900 hover:text-gray-600">
          Elsewhere Daily
        </Link>
      </div>
    </header>
  )
}
