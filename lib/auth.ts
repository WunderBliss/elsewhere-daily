import { SignJWT, jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!)

export const COOKIE_NAME = 'elsewhere-admin-token'

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ isAdmin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret())
    return true
  } catch {
    return false
  }
}
