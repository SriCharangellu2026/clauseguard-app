import fs from 'node:fs/promises'
import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import { COOKIE_NAME, PORT, RETENTION_DAYS, AUDIT_RETENTION_YEARS, POLICY_VERSION, MODEL_VERSION, PROMPT_VERSION, UPLOAD_DIR } from './config.js'
import { authenticate, cookieOptions, readSession, signSession } from './lib/auth.js'
import { analyzeSections } from './lib/analyze.js'
import { appendAudit, readAudit, verifyChain } from './lib/audit.js'
import { loadSampleAgreement, parseUpload } from './lib/parseDocument.js'
import { buildTrackedDocx } from './lib/exportDocx.js'
import { evaluatePlaybook } from './lib/evaluate.js'
import { categoryBreakdown, computeRiskScore, riskBand } from './lib/score.js'
import { PLAYBOOK } from './policy/playbook.js'

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
})
const workspaces = new Map()

app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

function currentUser(req) {
  return readSession(req.cookies[COOKIE_NAME])
}

function requireAuth(req, res, next) {
  const user = currentUser(req)
  if (!user) return res.status(401).json({ error: 'Sign in required' })
  req.user = user
  next()
}

function requireApprover(req, res, next) {
  if (req.user?.role !== 'approver') {
    return res.status(403).json({ error: 'Approver role required for this action' })
  }
  next()
}

async function workspaceFor(user, { create = true } = {}) {
  if (workspaces.has(user.email)) return workspaces.get(user.email)
  if (!create) return null
  const parsed = await loadSampleAgreement()
  const analysis = analyzeSections(parsed.sections, { sourceName: parsed.filename })
  const ws = {
    documentName: 'MSA-2026-441 · Vendor Cloud Services Agreement',
    filename: parsed.filename,
    fullText: parsed.text,
    ocrUsed: parsed.ocrUsed,
    ...analysis,
    history: [],
  }
  workspaces.set(user.email, ws)
  return ws
}

function payload(ws) {
  const { score, remaining, contributions } = computeRiskScore(ws.clauses)
  const resolved = ws.clauses.filter((clause) => clause.disposition === 'accepted' || clause.disposition === 'rejected').length
  const pending = ws.clauses.filter((clause) => clause.disposition === 'pending').length
  const review = ws.clauses.filter((clause) => clause.disposition === 'review').length
  return {
    documentName: ws.documentName,
    filename: ws.filename,
    fullText: ws.fullText,
    ocrUsed: ws.ocrUsed,
    modelVersion: ws.modelVersion,
    promptVersion: ws.promptVersion,
    policyVersion: ws.policyVersion,
    clauses: ws.clauses,
    missing: ws.missing,
    interactions: ws.interactions,
    score,
    remaining,
    contributions,
    categories: categoryBreakdown(ws.clauses),
    band: riskBand(score),
    progress: { resolved, total: ws.clauses.length, pending, review },
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, policy: POLICY_VERSION, model: MODEL_VERSION })
})

app.get('/api/retention', (_req, res) => {
  res.json({
    contractsDays: RETENTION_DAYS,
    auditYears: AUDIT_RETENTION_YEARS,
    summary: `Uploaded contracts and derived clause caches are deleted ${RETENTION_DAYS} days after last activity. Hash-chained audit records are retained ${AUDIT_RETENTION_YEARS} years for compliance. Session cookies expire after 8 hours. No documents are stored in browser localStorage.`,
  })
})

app.post('/api/login', async (req, res) => {
  const user = authenticate(req.body?.email, req.body?.password)
  if (!user) return res.status(401).json({ error: 'Unknown email or password' })
  res.cookie(COOKIE_NAME, signSession(user), cookieOptions())
  await appendAudit({ user: user.email, role: user.role, action: 'login', detail: 'Signed in' })
  res.json({ user })
})

app.post('/api/logout', requireAuth, async (req, res) => {
  await appendAudit({ user: req.user.email, role: req.user.role, action: 'logout', detail: 'Signed out' })
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
})

app.get('/api/me', (req, res) => {
  const user = currentUser(req)
  if (!user) return res.status(401).json({ error: 'Signed out' })
  res.json({ user: { email: user.email, name: user.name, role: user.role } })
})

app.get('/api/workspace', requireAuth, async (req, res) => {
  const ws = await workspaceFor(req.user)
  res.json(payload(ws))
})

app.get('/api/playbook', requireAuth, (_req, res) => {
  res.json({ version: POLICY_VERSION, entries: PLAYBOOK })
})

app.get('/api/audit', requireAuth, async (req, res) => {
  const events = await readAudit(250)
  const chain = await verifyChain()
  res.json({ events, chain })
})

app.get('/api/eval', requireAuth, (_req, res) => {
  res.json(evaluatePlaybook())
})

app.post('/api/documents/sample', requireAuth, async (req, res) => {
  const parsed = await loadSampleAgreement()
  const analysis = analyzeSections(parsed.sections, { sourceName: parsed.filename })
  const ws = {
    documentName: 'MSA-2026-441 · Vendor Cloud Services Agreement',
    filename: parsed.filename,
    fullText: parsed.text,
    ocrUsed: false,
    ...analysis,
    history: [],
  }
  workspaces.set(req.user.email, ws)
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'intake',
    detail: 'Loaded sample MSA-2026-441',
  })
  res.json(payload(ws))
})

app.post('/api/documents', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a PDF, DOCX, image, or text file' })
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const parsed = await parseUpload({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
  })
  if (!parsed.text.trim()) {
    return res.status(422).json({ error: 'No text could be extracted. Try a text-based PDF or DOCX, or a clearer scan.' })
  }
  const analysis = analyzeSections(parsed.sections, { sourceName: parsed.filename })
  const ws = {
    documentName: parsed.filename,
    filename: parsed.filename,
    fullText: parsed.text,
    ocrUsed: parsed.ocrUsed,
    ...analysis,
    history: [],
  }
  workspaces.set(req.user.email, ws)
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'intake',
    detail: `Uploaded ${parsed.filename}${parsed.ocrUsed ? ' (OCR)' : ''}`,
  })
  res.json(payload(ws))
})

app.post('/api/clauses/:id/select-position', requireAuth, async (req, res) => {
  const ws = await workspaceFor(req.user)
  const clause = ws.clauses.find((row) => row.id === req.params.id)
  if (!clause) return res.status(404).json({ error: 'Clause not found' })
  const position = clause.positions.find((row) => row.id === req.body?.positionId)
  if (!position) return res.status(400).json({ error: 'Unknown fallback position' })
  clause.selectedPosition = position.id
  clause.proposed = position.text
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'select-position',
    clause,
    detail: `${position.label} on §${clause.section}`,
  })
  res.json(payload(ws))
})

app.post('/api/clauses/:id/edit', requireAuth, async (req, res) => {
  const ws = await workspaceFor(req.user)
  const clause = ws.clauses.find((row) => row.id === req.params.id)
  if (!clause) return res.status(404).json({ error: 'Clause not found' })
  const text = String(req.body?.text || '').trim()
  if (!text) return res.status(400).json({ error: 'Redline text is required' })
  clause.proposed = text
  clause.selectedPosition = 'manual'
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'edit-redline',
    clause,
    detail: `Manual edit on §${clause.section}`,
  })
  res.json(payload(ws))
})

app.post('/api/clauses/:id/accept', requireAuth, async (req, res) => {
  const ws = await workspaceFor(req.user)
  const clause = ws.clauses.find((row) => row.id === req.params.id)
  if (!clause) return res.status(404).json({ error: 'Clause not found' })
  if (clause.disposition === 'review') {
    return res.status(400).json({ error: 'Assign a risk in the review queue before accepting' })
  }
  if (clause.selectedPosition === 'walkaway' && req.user.role !== 'approver') {
    return res.status(403).json({ error: 'Only an approver can accept a walk-away position' })
  }
  ws.history.push({ type: 'accept', clause: structuredClone(clause) })
  clause.disposition = 'accepted'
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'accepted',
    clause,
    detail: `§${clause.section} accepted (${clause.selectedPosition || 'preferred'}) → ${clause.acceptDelta}`,
  })
  res.json(payload(ws))
})

app.post('/api/clauses/:id/reject', requireAuth, async (req, res) => {
  const ws = await workspaceFor(req.user)
  const clause = ws.clauses.find((row) => row.id === req.params.id)
  if (!clause) return res.status(404).json({ error: 'Clause not found' })
  const rationale = String(req.body?.rationale || '').trim()
  if (rationale.length < 8) {
    return res.status(400).json({ error: 'A rejection rationale of at least 8 characters is required' })
  }
  ws.history.push({ type: 'reject', clause: structuredClone(clause) })
  clause.disposition = 'rejected'
  clause.rationale = rationale
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'rejected',
    clause,
    rationale,
    detail: `§${clause.section} rejected`,
  })
  res.json(payload(ws))
})

app.post('/api/undo', requireAuth, async (req, res) => {
  const ws = await workspaceFor(req.user)
  const last = ws.history.pop()
  if (!last) return res.status(400).json({ error: 'Nothing to undo' })
  const index = ws.clauses.findIndex((row) => row.id === last.clause.id)
  if (index >= 0) ws.clauses[index] = last.clause
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'undo',
    clause: last.clause,
    detail: `Undid ${last.type} on §${last.clause.section}`,
  })
  res.json(payload(ws))
})

app.post('/api/review-queue/:id', requireAuth, requireApprover, async (req, res) => {
  const ws = await workspaceFor(req.user)
  const clause = ws.clauses.find((row) => row.id === req.params.id)
  if (!clause) return res.status(404).json({ error: 'Clause not found' })
  const severity = req.body?.severity
  if (!['High', 'Med', 'Low', 'Aligned'].includes(severity)) {
    return res.status(400).json({ error: 'Choose High, Med, Low, or Aligned' })
  }
  clause.severity = severity
  clause.disposition = 'pending'
  clause.confidence = 1
  clause.positions = clause.positions.length
    ? clause.positions
    : [
        { id: 'preferred', label: 'Preferred', text: clause.original },
        { id: 'walkaway', label: 'Walk-away', text: clause.original },
      ]
  clause.proposed = clause.positions[0].text
  clause.acceptDelta = severity === 'Aligned' ? 0 : { High: -12, Med: -6, Low: -3 }[severity]
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'assign-risk',
    clause,
    detail: `Human review assigned ${severity} to §${clause.section}`,
  })
  res.json(payload(ws))
})

app.get('/api/export/docx', requireAuth, async (req, res) => {
  if (req.user.role !== 'approver') {
    return res.status(403).json({ error: 'Only approvers can send a tracked-changes Word file' })
  }
  const ws = await workspaceFor(req.user)
  const buffer = await buildTrackedDocx({
    documentName: ws.documentName,
    clauses: ws.clauses,
    user: req.user,
  })
  await appendAudit({
    user: req.user.email,
    role: req.user.role,
    action: 'export-docx',
    detail: 'Tracked-changes Word export',
  })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  res.setHeader('Content-Disposition', 'attachment; filename="clauseguard-redline.docx"')
  res.send(buffer)
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: error.message || 'Server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClauseGuard API on http://127.0.0.1:${PORT}`)
})
