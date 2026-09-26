export const RISK_WEIGHT = {
  High: 12,
  Med: 6,
  Low: 3,
  Review: 0,
  Aligned: 0,
}

export const TARGET_SCORE = 30

export function clauseWeight(clause) {
  if (!clause || clause.disposition === 'accepted') return 0
  if (clause.severity === 'Review' || clause.disposition === 'review') return 0
  return RISK_WEIGHT[clause.severity] || 0
}

export function computeRiskScore(clauses) {
  if (!Array.isArray(clauses) || clauses.length === 0) {
    return { score: 78, remaining: 48, contributions: [] }
  }
  const contributions = clauses
    .map((clause) => ({
      id: clause.id,
      section: clause.section,
      title: clause.title,
      category: clause.category,
      severity: clause.severity,
      disposition: clause.disposition,
      points: clauseWeight(clause),
    }))
    .filter((row) => row.points > 0)
  const remaining = contributions.reduce((sum, row) => sum + row.points, 0)
  const score = Math.max(TARGET_SCORE, Math.min(100, TARGET_SCORE + remaining))
  return { score, remaining, contributions }
}

export function acceptDelta(clause) {
  const points = clauseWeight({ ...clause, disposition: 'pending' })
  return points ? -points : 0
}

export function riskBand(score) {
  if (score >= 70) return { label: 'High Risk', tone: 'high' }
  if (score >= 45) return { label: 'Medium Risk', tone: 'med' }
  return { label: 'Low Risk', tone: 'low' }
}

export function categoryBreakdown(clauses) {
  const groups = new Map()
  for (const clause of clauses || []) {
    const key = clause.category || 'Other'
    const current = groups.get(key) || { category: key, points: 0, open: 0 }
    current.points += clauseWeight(clause)
    if (clause.disposition === 'pending') current.open += 1
    groups.set(key, current)
  }
  return [...groups.values()].sort((a, b) => b.points - a.points)
}
