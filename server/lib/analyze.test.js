import test from 'node:test'
import assert from 'node:assert/strict'
import { retrievePolicy } from '../policy/playbook.js'
import { evaluatePlaybook } from '../lib/evaluate.js'
import { analyzeSections } from '../lib/analyze.js'
import { splitSections } from '../lib/parseDocument.js'
import { computeRiskScore } from '../lib/score.js'
import { chainHash } from '../lib/hash.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/MSA-2026-441.txt')

test('retrieves confidentiality policy for a two-year NDA tail', () => {
  const [hit] = retrievePolicy(
    'Confidentiality two (2) years residual knowledge unaided memory personal data source code',
  )
  assert.equal(hit.section, '4.1')
  assert.ok(hit.similarity > 0.15)
  assert.match(hit.passage, /five \(5\) years/)
})

test('labeled eval set keeps precision/recall defined per severity', () => {
  const report = evaluatePlaybook()
  assert.equal(report.size, 10)
  assert.ok(report.sectionAccuracy >= 0.8)
  for (const label of ['High', 'Med', 'Low', 'Aligned']) {
    assert.ok(report.bySeverity[label].precision >= 0)
    assert.ok(report.bySeverity[label].recall >= 0)
  }
})

test('sample MSA splits, grounds §2.1 as Med not Low, and queues low-confidence text', async () => {
  const text = await fs.readFile(fixture, 'utf8')
  const { sections } = splitSections(text)
  assert.ok(sections.length >= 10)
  const analysis = analyzeSections(sections, { sourceName: 'test' })
  const nda = analysis.clauses.find((row) => row.section === '2.1')
  assert.equal(nda.severity, 'Med')
  assert.equal(nda.policy.section, '4.1')
  const review = analysis.clauses.filter((row) => row.disposition === 'review')
  assert.ok(review.length >= 1)
  assert.ok(analysis.missing.some((row) => row.id === 'missing-sla'))
  assert.ok(analysis.interactions.some((row) => row.id === 'cross-cap-indemnity'))
  const { score, contributions } = computeRiskScore(analysis.clauses)
  assert.ok(score >= 30)
  assert.ok(contributions.some((row) => row.section === '2.1' && row.points === 6))
})

test('hash chain is deterministic', () => {
  const a = chainHash('00', { action: 'accepted' })
  const b = chainHash('00', { action: 'accepted' })
  const c = chainHash('00', { action: 'rejected' })
  assert.equal(a, b)
  assert.notEqual(a, c)
})
