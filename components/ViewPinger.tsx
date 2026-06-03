'use client'

import { useEffect } from 'react'

interface Props {
  slug: string
}

// Fire-and-forget POST to register a view. Intentionally silent on errors —
// the counter is non-critical and we never want it to affect the reading UX.
export default function ViewPinger({ slug }: Props) {
  useEffect(() => {
    // keepalive helps the request survive a fast navigation away from the page
    fetch(`/api/articles/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {
      // swallow — see comment above
    })
    // Intentionally not depending on slug changing without a remount; in
    // practice the article page remounts per route, and we don't want to
    // multi-count if a parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
