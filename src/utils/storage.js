import { INITIAL_CLAUSES } from '../data/mockContract.js'
import { sanitizeText } from './sanitize.js'

export const STORAGE_KEY = 'clauseguard.session.v1'

const RISKS = new Set(['High', 'Med', 'Low', 'Done'])
const ACTIONS = new Set(['accepted', 'rejected'])
const CLAUSE_FIELDS = [
  'id',
  'section',
  'title',
  'category',
  'risk',
  'policy',
  'policyRef',
  'original',
  'proposed',
  'explanation',
]

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneInitial() {
  return INITIAL_CLAUSES.map((clause) => ({ ...clause }))
}

function fallbackSession() {
  return { clauses: cloneInitial(), events: [], selectedId: 'c7' }
}

function isValidClause(clause) {
  if (!isPlainObject(clause)) return false
  if (!RISKS.has(clause.risk)) return false
  return CLAUSE_FIELDS.every((field) => typeof clause[field] === 'string' && clause[field].length > 0)
}

function isValidEvent(event) {
  if (!isPlainObject(event)) return false
  if (typeof event.id !== 'string' || !ACTIONS.has(event.action)) return false
  if (typeof event.section !== 'string' || typeof event.title !== 'string') return false
  if (typeof event.policy !== 'string' || typeof event.at !== 'string') return false
  if (Number.isNaN(Date.parse(event.at))) return false
  return true
}

function normalizeClause(clause) {
  return {
    id: sanitizeText(clause.id, { max: 40 }),
    section: sanitizeText(clause.section, { max: 20 }),
    title: sanitizeText(clause.title, { max: 160 }),
    category: sanitizeText(clause.category, { max: 80 }),
    risk: clause.risk,
    policy: sanitizeText(clause.policy, { max: 160 }),
    policyRef: sanitizeText(clause.policyRef, { max: 240 }),
    original: sanitizeText(clause.original),
    proposed: sanitizeText(clause.proposed),
    explanation: sanitizeText(clause.explanation),
  }
}

function readLocalStorage(key) {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function clearLocalStorage(key) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function loadSession() {
  try {
    const raw = readLocalStorage(STORAGE_KEY)
    if (!raw) return fallbackSession()

    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed) || !Array.isArray(parsed.clauses) || !Array.isArray(parsed.events)) {
      throw new Error('Invalid session shape')
    }

    const clauses = parsed.clauses.filter(isValidClause).map(normalizeClause)
    if (clauses.length === 0) throw new Error('No valid clauses')

    const ids = new Set(clauses.map((clause) => clause.id))
    if (ids.size !== clauses.length) throw new Error('Duplicate clause ids')

    const events = parsed.events.filter(isValidEvent).slice(0, 200)
    const selectedId = ids.has(parsed.selectedId) ? parsed.selectedId : clauses[0].id

    return { clauses, events, selectedId }
  } catch {
    clearLocalStorage(STORAGE_KEY)
    return fallbackSession()
  }
}

export function saveSession(session) {
  try {
    if (!session || !Array.isArray(session.clauses)) return false
    return writeLocalStorage(STORAGE_KEY, JSON.stringify(session))
  } catch {
    return false
  }
}
