const json = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

export const api = {
  me: () => fetch('/api/me', { credentials: 'include' }).then(json),
  login: (email, password) =>
    fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(json),
  logout: () => fetch('/api/logout', { method: 'POST', credentials: 'include' }).then(json),
  workspace: () => fetch('/api/workspace', { credentials: 'include' }).then(json),
  playbook: () => fetch('/api/playbook', { credentials: 'include' }).then(json),
  audit: () => fetch('/api/audit', { credentials: 'include' }).then(json),
  eval: () => fetch('/api/eval', { credentials: 'include' }).then(json),
  retention: () => fetch('/api/retention').then(json),
  sample: () => fetch('/api/documents/sample', { method: 'POST', credentials: 'include' }).then(json),
  upload: (file) => {
    const body = new FormData()
    body.append('file', file)
    return fetch('/api/documents', { method: 'POST', credentials: 'include', body }).then(json)
  },
  selectPosition: (id, positionId) =>
    fetch(`/api/clauses/${id}/select-position`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId }),
    }).then(json),
  edit: (id, text) =>
    fetch(`/api/clauses/${id}/edit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).then(json),
  accept: (id) => fetch(`/api/clauses/${id}/accept`, { method: 'POST', credentials: 'include' }).then(json),
  reject: (id, rationale) =>
    fetch(`/api/clauses/${id}/reject`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rationale }),
    }).then(json),
  undo: () => fetch('/api/undo', { method: 'POST', credentials: 'include' }).then(json),
  assignReview: (id, severity) =>
    fetch(`/api/review-queue/${id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity }),
    }).then(json),
  exportDocx: async () => {
    const response = await fetch('/api/export/docx', { credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Export failed')
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'clauseguard-redline.docx'
    link.click()
    URL.revokeObjectURL(url)
  },
}
