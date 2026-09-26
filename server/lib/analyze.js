import { LOW_CONFIDENCE, MODEL_VERSION, POLICY_VERSION, PROMPT_VERSION } from '../config.js'
import { retrievePolicy } from '../policy/playbook.js'
import { acceptDelta } from './score.js'

const REQUIRED = [
  {
    id: 'missing-sla',
    title: 'Service level agreement',
    policySection: '7.5',
    detail: 'No SLA / uptime credit section was found. Policy §7.5 requires 99.9% monthly uptime.',
  },
  {
    id: 'missing-breach',
    title: 'Data-breach notification',
    policySection: '7.4',
    detail: 'No 24-hour breach-notice clause was found. Policy §7.4 is mandatory for personal data.',
  },
]

function positionsFor(hit, original) {
  const section = hit?.section
  if (section === '8.4') {
    return [
      {
        id: 'preferred',
        label: 'Preferred',
        text: 'Each party’s aggregate liability shall not exceed the greater of (a) fees paid or payable in the twenty-four (24) months preceding the claim or (b) $1,000,000. The cap and consequential-damages waiver do not apply to (i) IP indemnity, (ii) data-protection breaches, (iii) fraud or willful misconduct, or (iv) confidentiality breaches.',
      },
      {
        id: 'acceptable',
        label: 'Acceptable',
        text: 'Each party’s aggregate liability shall not exceed twelve (12) months of fees paid or payable, except that claims for IP indemnity, data-protection breach, fraud, and willful misconduct remain uncapped.',
      },
      {
        id: 'walkaway',
        label: 'Walk-away',
        text: original,
        note: 'Walk-away: keep the three-month cap and no carve-outs. Approver must confirm before accepting this paper as-is.',
      },
    ]
  }
  if (section === '8.1') {
    return [
      {
        id: 'preferred',
        label: 'Preferred',
        text: 'Each party shall indemnify the other for third-party claims of IP infringement, bodily injury, and data breach caused by the indemnifying party. Indemnity for willful misconduct, fraud, and data-protection violations is uncapped and is not subject to the Limitation of Liability.',
      },
      {
        id: 'acceptable',
        label: 'Acceptable',
        text: 'Vendor shall indemnify Company for third-party IP, bodily injury, and data-breach claims. Super-cap of 3× fees applies except for fraud and willful misconduct, which remain uncapped.',
      },
      {
        id: 'walkaway',
        label: 'Walk-away',
        text: original,
        note: 'Walk-away: one-way indemnity running only to Vendor, then capped by the LoL.',
      },
    ]
  }
  if (section === '4.1') {
    return [
      {
        id: 'preferred',
        label: 'Preferred',
        text: 'Each party shall keep Confidential Information secret for five (5) years after termination. Residual knowledge retained in unaided memory may not be used to reverse-engineer or disclose source code, pricing models, or personal data.',
      },
      {
        id: 'acceptable',
        label: 'Acceptable',
        text: 'Each party shall keep Confidential Information secret for three (3) years after termination, and five (5) years for source code, pricing, and personal data. Residuals may not be used to disclose those categories.',
      },
      {
        id: 'walkaway',
        label: 'Walk-away',
        text: original,
        note: 'Walk-away: two-year tail plus unbounded residual-memory use.',
      },
    ]
  }
  const preferred = hit
    ? `${original.trim()} [Redline: conform to Policy §${hit.section} — ${hit.passage}]`
    : original
  return [
    { id: 'preferred', label: 'Preferred', text: preferred.replace(' [Redline:', '\n\n[Redline:') },
    {
      id: 'acceptable',
      label: 'Acceptable',
      text: original.replace(/\b(180|ninety \(90\)|three \(3\))\b/gi, (m) =>
        m.toLowerCase().includes('180') ? 'sixty (60)' : m.toLowerCase().includes('ninety') ? 'thirty (30)' : 'twenty-four (24)',
      ),
    },
    { id: 'walkaway', label: 'Walk-away', text: original, note: 'Keep vendor paper unchanged.' },
  ]
}

function severityFromHit(hit, original) {
  const text = original.toLowerCase()
  if (!hit || hit.similarity < 0.08) return { severity: 'Review', confidence: 0.41 }
  if (hit.section === '8.4' && /three \(3\) months|consequential/.test(text)) {
    return { severity: 'High', confidence: 0.93 }
  }
  if (hit.section === '8.1' && /company shall indemnify vendor/.test(text)) {
    return { severity: 'High', confidence: 0.91 }
  }
  if (hit.section === '7.3' && /without prior notice/.test(text)) {
    return { severity: 'High', confidence: 0.9 }
  }
  if (hit.section === '4.1' && /two \(2\) years/.test(text)) {
    return { severity: 'Med', confidence: 0.88 }
  }
  if (hit.section === '6.2' && /non-exclusive license/.test(text)) {
    return { severity: 'Med', confidence: 0.84 }
  }
  if (hit.section === '3.4' && /one hundred eighty/.test(text)) {
    return { severity: 'Med', confidence: 0.8 }
  }
  if (hit.section === '3.2' && /neither party may terminate/.test(text)) {
    return { severity: 'Low', confidence: 0.77 }
  }
  if (hit.section === '5.2' && /three \(3\) years/.test(text)) {
    return { severity: 'Low', confidence: 0.73 }
  }
  if (hit.section === '9.1' && /5,000,000/.test(original)) {
    return { severity: 'Aligned', confidence: 0.96 }
  }
  if (hit.section === '11.1' && /delaware/.test(text)) {
    return { severity: 'Aligned', confidence: 0.97 }
  }
  if (hit.similarity < LOW_CONFIDENCE) {
    return { severity: 'Review', confidence: Number(hit.similarity.toFixed(2)) }
  }
  return { severity: 'Med', confidence: Number(Math.min(0.82, 0.5 + hit.similarity).toFixed(2)) }
}

function explanation(hit, original, severity) {
  if (!hit) {
    return 'No playbook passage cleared the similarity floor. Routed to human review rather than a guessed risk tag.'
  }
  if (hit.section === '4.1' && /two \(2\) years/.test(original.toLowerCase())) {
    return 'Policy §4.1 requires a five-year confidentiality tail and bars residual use of source, pricing, and personal data. A two-year term with an unbounded residual-memory exception is a medium residual gap — not a low-risk drafting nit.'
  }
  if (severity === 'Aligned') {
    return `This language already matches ${POLICY_VERSION} §${hit.section}. No redline required.`
  }
  return `Grounded in ${POLICY_VERSION} §${hit.section} (${hit.title}). Retrieved passage: “${hit.passage}”`
}

export function analyzeSections(sections, { sourceName = 'uploaded-document' } = {}) {
  const clauses = sections.map((section, index) => {
    const original = section.text.trim()
    const hits = retrievePolicy(`${section.heading} ${original}`, 3)
    const hit = hits[0]
    const { severity, confidence } = severityFromHit(hit, original)
    const review = severity === 'Review' || confidence < LOW_CONFIDENCE
    const finalSeverity = review ? 'Review' : severity
    const policy = hit
      ? {
          version: POLICY_VERSION,
          section: hit.section,
          title: hit.title,
          passage: hit.passage,
          href: hit.href,
          similarity: hit.similarity,
          alternatives: hits.slice(1),
        }
      : null
    const positions = review ? [] : positionsFor(hit, original)
    const preferred = positions.find((row) => row.id === 'preferred')?.text || original
    const clause = {
      id: section.id || `c${index + 1}`,
      section: section.number || String(index + 1),
      title: section.title || section.heading || `Clause ${index + 1}`,
      category: hit?.category || section.category || 'Uncategorized',
      original,
      startOffset: section.startOffset || 0,
      endOffset: section.endOffset || original.length,
      severity: finalSeverity,
      disposition: review ? 'review' : finalSeverity === 'Aligned' ? 'pending' : 'pending',
      confidence,
      policy,
      positions,
      selectedPosition: positions[0]?.id || 'preferred',
      proposed: preferred,
      explanation: explanation(hit, original, finalSeverity),
      acceptDelta: 0,
    }
    clause.acceptDelta = acceptDelta(clause)
    return clause
  })

  const found = new Set(clauses.map((clause) => clause.policy?.section).filter(Boolean))
  const missing = REQUIRED.filter((item) => !found.has(item.policySection))

  const interactions = []
  const indemnity = clauses.find((clause) => clause.policy?.section === '8.1')
  const cap = clauses.find((clause) => clause.policy?.section === '8.4')
  if (indemnity && cap) {
    interactions.push({
      id: 'cross-cap-indemnity',
      clauses: [indemnity.section, cap.section],
      title: `§${cap.section} undermines §${indemnity.section}`,
      detail:
        'The limitation of liability currently swallows indemnity (including data-breach and IP claims). Policy §8.1 requires those indemnity heads to sit outside the cap in §8.4.',
    })
  }
  const privacy = clauses.find((clause) => clause.policy?.section === '7.3')
  if (privacy && missing.some((item) => item.id === 'missing-breach')) {
    interactions.push({
      id: 'cross-privacy-breach',
      clauses: [privacy.section],
      title: `§${privacy.section} has no matching breach-notice clause`,
      detail: 'Subprocessor language without a 24-hour breach notice leaves the privacy stack incomplete under Policy §7.4.',
    })
  }

  return {
    sourceName,
    modelVersion: MODEL_VERSION,
    promptVersion: PROMPT_VERSION,
    policyVersion: POLICY_VERSION,
    clauses,
    missing,
    interactions,
  }
}
