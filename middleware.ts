import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected =
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    !PUBLIC_ADMIN_PATHS.includes(pathname)

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifySessionToken(token))) {
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
