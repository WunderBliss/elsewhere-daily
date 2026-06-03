import { ImageResponse } from 'next/og'
import { getArticleBySlug } from '@/lib/db/queries'

// Image metadata — Next's OG convention reads these exports.
export const alt = 'Elsewhere Daily article preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function ArticleOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticleBySlug(slug).catch(() => null)

  const title = article?.title ?? 'Elsewhere Daily'
  const author = article?.authorName ?? null
  const date = article?.publishedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(article.publishedAt)
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0a',
          color: '#fafafa',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Top: brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#a1a1aa',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              background: '#fafafa',
              borderRadius: 9999,
              display: 'flex',
            }}
          />
          Elsewhere Daily
        </div>

        {/* Middle: title */}
        <div
          style={{
            fontSize: title.length > 60 ? 64 : 78,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            // Clamp to ~4 lines visually with overflow hidden
            display: 'flex',
            maxHeight: 340,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Bottom: byline */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 26,
            color: '#a1a1aa',
          }}
        >
          {author && <span>{author}</span>}
          {author && date && <span style={{ color: '#52525b' }}>·</span>}
          {date && <span>{date}</span>}
        </div>
      </div>
    ),
    { ...size },
  )
}
