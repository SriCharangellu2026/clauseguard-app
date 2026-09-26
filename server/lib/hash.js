import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function hmac(secret, value) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const digest = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${digest}`
}

export function verifyPassword(password, stored) {
  const [salt, digest] = String(stored || '').split(':')
  if (!salt || !digest) return false
  const next = scryptSync(password, salt, 32)
  const prev = Buffer.from(digest, 'hex')
  if (next.length !== prev.length) return false
  return timingSafeEqual(next, prev)
}

export function chainHash(previous, payload) {
  return sha256(`${previous}::${JSON.stringify(payload)}`)
}
