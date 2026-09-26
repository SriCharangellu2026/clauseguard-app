const STOP = new Set(
  'a an the of and or to for in on by with without from at as is are was be this that shall may must not party vendor company agreement'.split(
    ' ',
  ),
)

export function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9§.\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word))
}

export function bag(text) {
  const counts = new Map()
  for (const word of tokens(text)) counts.set(word, (counts.get(word) || 0) + 1)
  return counts
}

export function cosine(a, b) {
  let dot = 0
  let magA = 0
  let magB = 0
  const keys = new Set([...a.keys(), ...b.keys()])
  for (const key of keys) {
    const x = a.get(key) || 0
    const y = b.get(key) || 0
    dot += x * y
    magA += x * x
    magB += y * y
  }
  if (!magA || !magB) return 0
  return dot / Math.sqrt(magA * magB)
}
