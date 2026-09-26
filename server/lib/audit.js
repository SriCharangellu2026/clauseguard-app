import fs from 'node:fs/promises'
import path from 'node:path'
import { AUDIT_PATH, DATA_DIR, MODEL_VERSION, PROMPT_VERSION } from '../config.js'
import { chainHash } from './hash.js'

const GENESIS = '0'.repeat(64)

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(AUDIT_PATH)
  } catch {
    await fs.writeFile(AUDIT_PATH, '', 'utf8')
  }
}

export async function readAudit(limit = 200) {
  await ensure()
  const raw = await fs.readFile(AUDIT_PATH, 'utf8')
  const rows = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
  return rows.slice(-limit).reverse()
}

async function lastHash() {
  const rows = await readAudit(1)
  return rows[0]?.hash || GENESIS
}

export async function appendAudit({ user, role, action, clause, detail, rationale }) {
  await ensure()
  const previous = await lastHash()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    at: new Date().toISOString(),
    user: user || 'unknown',
    role: role || 'reviewer',
    action,
    clauseId: clause?.id || null,
    section: clause?.section || null,
    title: clause?.title || null,
    detail: detail || '',
    rationale: rationale || '',
    modelVersion: MODEL_VERSION,
    promptVersion: PROMPT_VERSION,
    previousHash: previous,
  }
  const hash = chainHash(previous, {
    at: entry.at,
    user: entry.user,
    action: entry.action,
    clauseId: entry.clauseId,
    rationale: entry.rationale,
    detail: entry.detail,
    modelVersion: entry.modelVersion,
    promptVersion: entry.promptVersion,
  })
  const stored = { ...entry, hash }
  await fs.appendFile(AUDIT_PATH, `${JSON.stringify(stored)}\n`, 'utf8')
  return stored
}

export async function verifyChain() {
  const rows = (await readAudit(10_000)).reverse()
  let previous = GENESIS
  for (const row of rows) {
    const expected = chainHash(previous, {
      at: row.at,
      user: row.user,
      action: row.action,
      clauseId: row.clauseId,
      rationale: row.rationale,
      detail: row.detail,
      modelVersion: row.modelVersion,
      promptVersion: row.promptVersion,
    })
    if (row.previousHash !== previous || row.hash !== expected) {
      return { ok: false, brokenAt: row.id }
    }
    previous = row.hash
  }
  return { ok: true, entries: rows.length }
}

export function auditFilePath() {
  return path.resolve(AUDIT_PATH)
}
