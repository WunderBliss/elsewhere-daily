import { cookies } from 'next/headers'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.password || body.password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return Response.json({ ok: true })
}
