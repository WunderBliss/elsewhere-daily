import { incrementViewCount } from '@/lib/db/queries'

// Public endpoint, no auth. First-pass view counter: every request increments,
// no dedup, no identity, no bot filtering. See docs/migrations notes.
//
// Client-side only — the page itself is statically rendered / ISR, so we don't
// want to couple the increment to server rendering or every crawler hit will
// count. The article page fires this from a useEffect.

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { slug } = await params

  if (!slug || typeof slug !== 'string' || slug.length > 200) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const viewCount = await incrementViewCount(slug)
    if (viewCount === null) {
      // Either no such article or it's a draft. Don't leak which.
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    return Response.json({ viewCount })
  } catch {
    // Fire-and-forget on the client — we don't want a transient DB hiccup to
    // surface anywhere visible. Just return 500 and let the client ignore it.
    return Response.json({ error: 'Increment failed' }, { status: 500 })
  }
}
