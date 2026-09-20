export const POLICY_CITATION = 'Contract Risk Management Policy v3.2'

export const INITIAL_CLAUSES = [
  {
    id: 'c1',
    section: '2.1',
    title: 'Confidentiality Term',
    category: 'Confidentiality',
    risk: 'Low',
    policy: POLICY_CITATION,
    policyRef: '§4.1 — Residual information carve-out must not swallow the NDA.',
    original:
      'Each party shall keep Confidential Information secret for two (2) years after termination, except that residual knowledge retained in unaided memory may be used freely.',
    proposed:
      'Each party shall keep Confidential Information secret for five (5) years after termination. Residual knowledge retained in unaided memory may not be used to reverse-engineer or disclose source code, pricing models, or personal data.',
    explanation:
      'A two-year tail plus an unbounded residual-memory exception is weaker than Policy §4.1, which requires a five-year confidentiality period and bars residual use of source, pricing, and personal data.',
  },
  {
    id: 'c2',
    section: '3.4',
    title: 'Intellectual Property Assignment',
    category: 'IP',
    risk: 'Med',
    policy: POLICY_CITATION,
    policyRef: '§6.2 — Work product must vest in the Company upon creation.',
    original:
      'Vendor retains all intellectual property in pre-existing materials and in any improvements conceived during the engagement. Company receives a non-exclusive license to use deliverables solely during the Term.',
    proposed:
      'Vendor retains IP in pre-existing materials identified in Exhibit A. All work product and improvements conceived in the engagement vest in Company upon creation. Vendor grants a perpetual, royalty-free license to pre-existing materials embedded in deliverables.',
    explanation:
      'Policy §6.2 requires assignment of work product at creation. A term-limited, non-exclusive license leaves the Company without ownership of paid-for deliverables.',
  },
  {
    id: 'c3',
    section: '4.1',
    title: 'Data Processing & Subprocessors',
    category: 'Privacy',
    risk: 'High',
    policy: POLICY_CITATION,
    policyRef: '§7.3 — Written consent required before engaging subprocessors.',
    original:
      'Vendor may engage subprocessors without prior notice and may transfer Customer Data to any jurisdiction where Vendor or its affiliates maintain operations.',
    proposed:
      'Vendor shall not engage subprocessors or transfer Customer Data outside the EEA/UK without Company’s prior written consent and a valid transfer mechanism (SCCs or equivalent). Vendor remains fully liable for subprocessors.',
    explanation:
      'Unilateral subprocessor appointment and unrestricted cross-border transfer conflict with Policy §7.3 and create GDPR/CCPA exposure.',
  },
  {
    id: 'c4',
    section: '5.2',
    title: 'Indemnification',
    category: 'Liability',
    risk: 'High',
    policy: POLICY_CITATION,
    policyRef: '§8.1 — Mutual IP and data-breach indemnity; no cap on willful misconduct.',
    original:
      'Company shall indemnify Vendor against all claims arising from the Agreement. Vendor’s indemnity, if any, is limited to third-party IP claims finally adjudicated and is subject to the Limitation of Liability.',
    proposed:
      'Each party shall indemnify the other for third-party claims of IP infringement, bodily injury, and data breach caused by the indemnifying party. Indemnity for willful misconduct, fraud, and data-protection violations is uncapped.',
    explanation:
      'A one-way indemnity running only to Vendor, then capped by the LoL clause, violates the mutual-indemnity rule in Policy §8.1.',
  },
  {
    id: 'c5',
    section: '6.3',
    title: 'Auto-Renewal',
    category: 'Term',
    risk: 'Med',
    policy: POLICY_CITATION,
    policyRef: '§3.4 — Auto-renewal requires 60-day opt-out and written reminder.',
    original:
      'This Agreement automatically renews for successive one-year terms unless Company provides written notice of non-renewal at least one hundred eighty (180) days before the then-current term ends.',
    proposed:
      'This Agreement renews for successive one-year terms only if Vendor sends a written reminder 90 days before expiry and Company does not give written notice of non-renewal at least sixty (60) days before the then-current term ends.',
    explanation:
      'A 180-day silent auto-renewal exceeds Policy §3.4, which caps notice at 60 days and requires a vendor reminder.',
  },
  {
    id: 'c6',
    section: '7.1',
    title: 'Termination for Convenience',
    category: 'Term',
    risk: 'Low',
    policy: POLICY_CITATION,
    policyRef: '§3.2 — Company must retain a 30-day convenience termination right.',
    original:
      'Neither party may terminate this Agreement for convenience. Termination is permitted only for material breach remaining uncured for ninety (90) days after written notice.',
    proposed:
      'Company may terminate for convenience on thirty (30) days’ written notice. Either party may terminate for material breach remaining uncured for thirty (30) days after written notice.',
    explanation:
      'Locking the Company into a no-convenience-exit structure with a 90-day cure window is outside Policy §3.2.',
  },
  {
    id: 'c7',
    section: '8.2',
    title: 'Limitation of Liability',
    category: 'Liability',
    risk: 'High',
    policy: POLICY_CITATION,
    policyRef: '§8.4 — Cap ≥ 24 months of fees; carve-outs for IP, data, and willful acts.',
    original:
      'EXCEPT FOR FEES OWED, NEITHER PARTY’S AGGREGATE LIABILITY SHALL EXCEED THE FEES PAID IN THE THREE (3) MONTHS PRECEDING THE CLAIM. NEITHER PARTY IS LIABLE FOR INDIRECT, CONSEQUENTIAL, OR LOST-PROFIT DAMAGES, INCLUDING FOR DATA BREACH OR IP INFRINGEMENT.',
    proposed:
      'Each party’s aggregate liability shall not exceed the greater of (a) fees paid or payable in the twenty-four (24) months preceding the claim or (b) $1,000,000. The cap and consequential-damages waiver do not apply to (i) IP indemnity, (ii) data-protection breaches, (iii) fraud or willful misconduct, or (iv) confidentiality breaches.',
    explanation:
      'A 3-month fees cap with no carve-outs for data breach or IP is the highest residual exposure in this paper and is non-compliant with Policy §8.4.',
  },
  {
    id: 'c8',
    section: '9.1',
    title: 'Insurance Requirements',
    category: 'Compliance',
    risk: 'Done',
    policy: POLICY_CITATION,
    policyRef: '§9.1 — Cyber + CGL + E&O at stated minima.',
    original:
      'Vendor shall maintain cyber liability insurance of $5,000,000, commercial general liability of $2,000,000 per occurrence, and errors & omissions of $3,000,000, with Company named as additional insured on CGL.',
    proposed:
      'Vendor shall maintain cyber liability insurance of $5,000,000, commercial general liability of $2,000,000 per occurrence, and errors & omissions of $3,000,000, with Company named as additional insured on CGL.',
    explanation:
      'Coverage limits and additional-insured status already match Policy §9.1. No redline required.',
  },
  {
    id: 'c9',
    section: '10.4',
    title: 'Audit Rights',
    category: 'Compliance',
    risk: 'Low',
    policy: POLICY_CITATION,
    policyRef: '§5.2 — Annual security audit on 15 days’ notice.',
    original:
      'Company may audit Vendor’s security practices no more than once every three (3) years, upon sixty (60) days’ notice, and only if a regulator has opened a formal investigation.',
    proposed:
      'Company may conduct one security audit per year on fifteen (15) days’ written notice, and additional audits following a suspected or actual security incident, without a regulator precondition.',
    explanation:
      'Triennial, regulator-gated audits fall short of the annual 15-day audit right in Policy §5.2.',
  },
  {
    id: 'c10',
    section: '12.2',
    title: 'Governing Law & Venue',
    category: 'Boilerplate',
    risk: 'Done',
    policy: POLICY_CITATION,
    policyRef: '§11.1 — Delaware law; exclusive venue in Wilmington.',
    original:
      'This Agreement is governed by the laws of the State of Delaware, without regard to conflict-of-laws rules. Exclusive venue lies in the state or federal courts located in Wilmington, Delaware.',
    proposed:
      'This Agreement is governed by the laws of the State of Delaware, without regard to conflict-of-laws rules. Exclusive venue lies in the state or federal courts located in Wilmington, Delaware.',
    explanation:
      'Governing law and venue already match Policy §11.1. Marked complete.',
  },
]

export const RISK_WEIGHT = { High: 10, Med: 6, Low: 2, Done: 0 }

export function computeRiskScore(clauses) {
  if (!Array.isArray(clauses) || clauses.length === 0) return 78
  const remaining = clauses.reduce((sum, clause) => sum + (RISK_WEIGHT[clause?.risk] || 0), 0)
  return Math.max(30, Math.min(100, 30 + remaining))
}

export function riskBand(score) {
  if (score >= 70) return { label: 'High Risk', tone: 'high' }
  if (score >= 45) return { label: 'Medium Risk', tone: 'med' }
  return { label: 'Low Risk', tone: 'low' }
}
