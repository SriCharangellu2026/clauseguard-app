const CONTROL_CHARS = /[\u0000-\u001F\u007F\u2028\u2029]/g
const TAGS = /<\/?[a-z][^>]*>/gi
const SCRIPTY = /javascript\s*:|data\s*:text\/html|vbscript\s*:|on[a-z]+\s*=/gi
const ENTITY_SCRIPT = /&#x0*(?:3c|60);?|&#0*(?:60|92);?|&lt;|&gt;|&quot;|&#x0*3[eE];?/gi
const FORMULA_PREFIX = /^[=+\-@\t\r\n%|]|\uFEFF[=+\-@%|]/

export const MAX_SEARCH_LENGTH = 120

export function sanitizeSearchQuery(raw) {
  return String(raw ?? '')
    .replace(ENTITY_SCRIPT, '')
    .replace(TAGS, ' ')
    .replace(SCRIPTY, '')
    .replace(CONTROL_CHARS, '')
    .replace(/[<>`]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_SEARCH_LENGTH)
}

export function sanitizeText(value, { max = 8000 } = {}) {
  return String(value ?? '')
    .replace(ENTITY_SCRIPT, '')
    .replace(TAGS, '')
    .replace(SCRIPTY, '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/[<>`]/g, '')
    .trim()
    .slice(0, max)
}

export function neutralizeFormula(value) {
  const text = sanitizeText(value)
  if (!text) return ''
  return FORMULA_PREFIX.test(text) ? `'${text}` : text
}

export function sanitizeForExport(value) {
  if (value == null) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(sanitizeForExport)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        sanitizeText(key, { max: 120 }),
        sanitizeForExport(nested),
      ]),
    )
  }
  return neutralizeFormula(value)
}

export function safeFilename(name, fallback) {
  const cleaned = sanitizeText(name, { max: 80 }).replace(/[\\/:*?"<>|]/g, '')
  return cleaned || fallback
}
