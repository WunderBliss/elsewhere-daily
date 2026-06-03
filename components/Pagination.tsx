import Link from 'next/link'

interface Props {
  page: number
  total: number
  pageSize: number
}

export default function Pagination({ page, total, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <nav className="flex justify-between mt-8 text-sm">
      {page > 1 ? (
        <Link href={`/?page=${page - 1}`} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-gray-400 dark:text-gray-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/?page=${page + 1}`} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
