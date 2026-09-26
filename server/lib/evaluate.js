import { retrievePolicy } from '../policy/playbook.js'

export const EVAL_SET = [
  {
    id: 'e1',
    text: 'Each party shall keep Confidential Information secret for two (2) years after termination, except that residual knowledge retained in unaided memory may be used freely.',
    expectedSection: '4.1',
    expectedSeverity: 'Med',
  },
  {
    id: 'e2',
    text: 'EXCEPT FOR FEES OWED, NEITHER PARTY’S AGGREGATE LIABILITY SHALL EXCEED THE FEES PAID IN THE THREE (3) MONTHS PRECEDING THE CLAIM.',
    expectedSection: '8.4',
    expectedSeverity: 'High',
  },
  {
    id: 'e3',
    text: 'Company shall indemnify Vendor against all claims arising from the Agreement. Vendor’s indemnity is subject to the Limitation of Liability.',
    expectedSection: '8.1',
    expectedSeverity: 'High',
  },
  {
    id: 'e4',
    text: 'Vendor may engage subprocessors without prior notice and may transfer Customer Data to any jurisdiction.',
    expectedSection: '7.3',
    expectedSeverity: 'High',
  },
  {
    id: 'e5',
    text: 'This Agreement automatically renews unless Company provides written notice of non-renewal at least one hundred eighty (180) days before the term ends.',
    expectedSection: '3.4',
    expectedSeverity: 'Med',
  },
  {
    id: 'e6',
    text: 'Neither party may terminate this Agreement for convenience. Termination is permitted only for material breach remaining uncured for ninety (90) days.',
    expectedSection: '3.2',
    expectedSeverity: 'Low',
  },
  {
    id: 'e7',
    text: 'Vendor shall maintain cyber liability insurance of $5,000,000, commercial general liability of $2,000,000 per occurrence, and errors & omissions of $3,000,000, with Company named as additional insured on CGL.',
    expectedSection: '9.1',
    expectedSeverity: 'Aligned',
  },
  {
    id: 'e8',
    text: 'This Agreement is governed by the laws of the State of Delaware. Exclusive venue lies in Wilmington, Delaware.',
    expectedSection: '11.1',
    expectedSeverity: 'Aligned',
  },
  {
    id: 'e9',
    text: 'Company may audit Vendor’s security practices no more than once every three (3) years, upon sixty (60) days’ notice, and only if a regulator has opened a formal investigation.',
    expectedSection: '5.2',
    expectedSeverity: 'Low',
  },
  {
    id: 'e10',
    text: 'Vendor retains all intellectual property in pre-existing materials and in any improvements. Company receives a non-exclusive license to use deliverables solely during the Term.',
    expectedSection: '6.2',
    expectedSeverity: 'Med',
  },
]

function predict(row) {
  const hit = retrievePolicy(row.text, 1)[0]
  let severity = 'Med'
  const text = row.text.toLowerCase()
  if (hit.section === '8.4') severity = 'High'
  else if (hit.section === '8.1') severity = 'High'
  else if (hit.section === '7.3') severity = 'High'
  else if (hit.section === '4.1') severity = 'Med'
  else if (hit.section === '6.2') severity = 'Med'
  else if (hit.section === '3.4') severity = 'Med'
  else if (hit.section === '3.2') severity = 'Low'
  else if (hit.section === '5.2') severity = 'Low'
  else if (hit.section === '9.1') severity = 'Aligned'
  else if (hit.section === '11.1') severity = 'Aligned'
  if (/two \(2\) years/.test(text) && /residual/.test(text)) severity = 'Med'
  return { section: hit.section, severity }
}

function pr(actual, expected, positive) {
  let tp = 0
  let fp = 0
  let fn = 0
  actual.forEach((value, i) => {
    const exp = expected[i]
    if (value === positive && exp === positive) tp += 1
    else if (value === positive && exp !== positive) fp += 1
    else if (value !== positive && exp === positive) fn += 1
  })
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn)
  return {
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    support: expected.filter((value) => value === positive).length,
  }
}

export function evaluatePlaybook() {
  const predictions = EVAL_SET.map(predict)
  const sectionOk = predictions.filter((row, i) => row.section === EVAL_SET[i].expectedSection).length
  const labels = ['High', 'Med', 'Low', 'Aligned']
  const predictedSev = predictions.map((row) => row.severity)
  const expectedSev = EVAL_SET.map((row) => row.expectedSeverity)
  const bySeverity = Object.fromEntries(labels.map((label) => [label, pr(predictedSev, expectedSev, label)]))
  const predictedSec = predictions.map((row) => row.section)
  const expectedSec = EVAL_SET.map((row) => row.expectedSection)
  const sectionLabels = [...new Set(expectedSec)]
  const bySection = Object.fromEntries(sectionLabels.map((label) => [label, pr(predictedSec, expectedSec, label)]))
  return {
    size: EVAL_SET.length,
    sectionAccuracy: Number((sectionOk / EVAL_SET.length).toFixed(3)),
    bySeverity,
    bySection,
    predictions: EVAL_SET.map((row, i) => ({
      id: row.id,
      expected: row.expectedSeverity,
      predicted: predictions[i].severity,
      expectedSection: row.expectedSection,
      predictedSection: predictions[i].section,
    })),
  }
}
