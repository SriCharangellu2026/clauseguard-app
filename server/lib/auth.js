import { COOKIE_NAME, COOKIE_SECRET, SESSION_HOURS } from '../config.js'
import { timingSafeEqual } from 'node:crypto'
import { hmac, verifyPassword, hashPassword } from './hash.js'

function sameHmac(left, right) {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export const USERS = [
  {
    email: 'reviewer@clauseguard.local',
    name: 'Riley Reviewer',
    role: 'reviewer',
    passwordHash: hashPassword('Reviewer123!'),
  },
  {
    email: 'approver@clauseguard.local',
    name: 'Avery Approver',
    role: 'approver',
    passwordHash: hashPassword('Approver123!'),
  },
]

export function findUser(email) {
  return USERS.find((user) => user.email.toLowerCase() === String(email || '').toLowerCase())
}

export function authenticate(email, password) {
  const user = findUser(email)
  if (!user || !verifyPassword(password, user.passwordHash)) return null
  return { email: user.email, name: user.name, role: user.role }
}

export function signSession(user) {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ ...user, exp }), 'utf8').toString('base64url')
  const sig = hmac(COOKIE_SECRET, payload)
  return `${payload}.${sig}`
}

export function readSession(token) {
  if (!token || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  if (!sameHmac(hmac(COOKIE_SECRET, payload), sig)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!data.exp || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
  }
}

export { COOKIE_NAME }
