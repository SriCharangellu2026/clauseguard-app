import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const PORT = Number(process.env.CLAUSEGUARD_PORT || 8787)
export const COOKIE_NAME = 'cg_session'
export const COOKIE_SECRET = process.env.CLAUSEGUARD_COOKIE_SECRET || randomBytes(32).toString('hex')
export const SESSION_HOURS = 8
export const MODEL_VERSION = 'legallens-retriever-1.4'
export const PROMPT_VERSION = 'policy-grounded-v3.2.1'
export const POLICY_VERSION = 'Contract Risk Management Policy v3.2'
export const RETENTION_DAYS = 90
export const AUDIT_RETENTION_YEARS = 7
export const LOW_CONFIDENCE = 0.62
export const DATA_DIR = path.join(here, 'data')
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
export const AUDIT_PATH = path.join(DATA_DIR, 'audit.jsonl')
export const SAMPLE_TXT = path.join(here, 'fixtures', 'MSA-2026-441.txt')
