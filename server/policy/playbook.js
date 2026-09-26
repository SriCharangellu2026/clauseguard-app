import { POLICY_VERSION } from '../config.js'
import { bag, cosine } from '../lib/tokenize.js'

export const PLAYBOOK = [
  {
    id: 'pol-3-2',
    section: '3.2',
    title: 'Termination for convenience',
    category: 'Term',
    passage:
      'Company must retain a right to terminate for convenience on no more than thirty (30) days’ written notice. Cure periods for material breach shall not exceed thirty (30) days.',
  },
  {
    id: 'pol-3-4',
    section: '3.4',
    title: 'Auto-renewal',
    category: 'Term',
    passage:
      'Auto-renewal is permitted only if Vendor sends a written reminder at least ninety (90) days before expiry and Company may opt out on sixty (60) days’ notice. Silent 180-day non-renewal windows are prohibited.',
  },
  {
    id: 'pol-4-1',
    section: '4.1',
    title: 'Confidentiality term and residuals',
    category: 'Confidentiality',
    passage:
      'Confidentiality obligations must survive for at least five (5) years after termination. Residual-memory exceptions may not be used to reverse-engineer or disclose source code, pricing models, or personal data.',
  },
  {
    id: 'pol-5-2',
    section: '5.2',
    title: 'Audit rights',
    category: 'Compliance',
    passage:
      'Company may conduct one security audit per year on fifteen (15) days’ written notice, plus additional audits after a suspected or actual security incident, with no regulator-investigation precondition.',
  },
  {
    id: 'pol-6-2',
    section: '6.2',
    title: 'Work-product assignment',
    category: 'IP',
    passage:
      'All work product and improvements conceived in the engagement vest in Company upon creation. Vendor may retain pre-existing materials listed in an exhibit and must grant a perpetual, royalty-free license to those materials embedded in deliverables.',
  },
  {
    id: 'pol-7-3',
    section: '7.3',
    title: 'Subprocessors and transfers',
    category: 'Privacy',
    passage:
      'Vendor shall not engage subprocessors or transfer Customer Data outside the EEA/UK without Company’s prior written consent and a valid transfer mechanism (SCCs or equivalent). Vendor remains fully liable for subprocessors.',
  },
  {
    id: 'pol-7-4',
    section: '7.4',
    title: 'Data-breach notification',
    category: 'Privacy',
    passage:
      'Vendor shall notify Company of any actual or suspected personal-data breach within twenty-four (24) hours of discovery, and shall provide the facts, categories of data, and mitigation steps needed for Company to meet statutory notice duties.',
  },
  {
    id: 'pol-7-5',
    section: '7.5',
    title: 'Service levels',
    category: 'Performance',
    passage:
      'Production services must include a monthly uptime commitment of at least 99.9%, with service credits and a termination right for chronic failure. On-call severity-1 response shall not exceed one hour.',
  },
  {
    id: 'pol-8-1',
    section: '8.1',
    title: 'Mutual indemnity',
    category: 'Liability',
    passage:
      'Indemnity must be mutual for third-party IP infringement, bodily injury, and data breach. Indemnity for willful misconduct, fraud, and data-protection violations is uncapped and shall not be subordinated to the limitation of liability.',
  },
  {
    id: 'pol-8-4',
    section: '8.4',
    title: 'Limitation of liability',
    category: 'Liability',
    passage:
      'Aggregate liability cap must be at least the greater of twenty-four (24) months of fees or $1,000,000. The cap and consequential-damages waiver shall not apply to IP indemnity, data-protection breaches, fraud or willful misconduct, or confidentiality breaches.',
  },
  {
    id: 'pol-9-1',
    section: '9.1',
    title: 'Insurance minima',
    category: 'Compliance',
    passage:
      'Vendor shall maintain cyber liability insurance of $5,000,000, commercial general liability of $2,000,000 per occurrence, and errors & omissions of $3,000,000, with Company named as additional insured on CGL.',
  },
  {
    id: 'pol-11-1',
    section: '11.1',
    title: 'Governing law and venue',
    category: 'Boilerplate',
    passage:
      'Governing law is Delaware, without regard to conflict-of-laws rules. Exclusive venue lies in the state or federal courts located in Wilmington, Delaware.',
  },
]

const INDEX = PLAYBOOK.map((entry) => ({
  ...entry,
  vector: bag(`${entry.section} ${entry.title} ${entry.passage}`),
}))

export function retrievePolicy(clauseText, k = 1) {
  const query = bag(clauseText)
  const ranked = INDEX.map((entry) => ({
    id: entry.id,
    section: entry.section,
    title: entry.title,
    category: entry.category,
    passage: entry.passage,
    version: POLICY_VERSION,
    href: `#policy-${entry.section.replace('.', '-')}`,
    similarity: Number(cosine(query, entry.vector).toFixed(3)),
  })).sort((a, b) => b.similarity - a.similarity)
  return ranked.slice(0, k)
}

export function playbookBySection(section) {
  return INDEX.find((entry) => entry.section === section) || null
}
