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
        <Link href={`/?page=${page - 1}`} className="text-gray-500 hover:text-gray-900">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-gray-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/?page=${page + 1}`} className="text-gray-500 hover:text-gray-900">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
