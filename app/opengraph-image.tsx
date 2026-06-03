import { ImageResponse } from 'next/og'

export const alt = 'Elsewhere Daily'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function RootOGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          textAlign: 'center',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#a1a1aa',
            marginBottom: 32,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              background: '#fafafa',
              borderRadius: 9999,
              display: 'inline-block',
            }}
          />
          A daily newsletter
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          Elsewhere Daily
        </div>
      </div>
    ),
    { ...size },
  )
}
