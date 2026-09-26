import { useCallback, useEffect, useMemo, useState } from 'react'
import Login from './components/Login.jsx'
import Navbar from './components/Navbar.jsx'
import ClauseTree from './components/ClauseTree.jsx'
import RedlinePanel from './components/RedlinePanel.jsx'
import RiskGauge from './components/RiskGauge.jsx'
import AuditLog from './components/AuditLog.jsx'
import DocumentMap from './components/DocumentMap.jsx'
import EvalPanel from './components/EvalPanel.jsx'
import RejectModal from './components/RejectModal.jsx'
import { api } from './api/client.js'
import { sanitizeSearchQuery } from './utils/sanitize.js'

const emptyWs = {
  clauses: [],
  contributions: [],
  categories: [],
  interactions: [],
  missing: [],
  progress: { resolved: 0, total: 0, pending: 0, review: 0 },
  score: 30,
  band: { label: 'Low Risk', tone: 'low' },
  documentName: '',
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)
  const [workspace, setWorkspace] = useState(emptyWs)
  const [audit, setAudit] = useState({ events: [], chain: { ok: true } })
  const [evalReport, setEvalReport] = useState(null)
  const [retention, setRetention] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('tracked')
  const [theme, setTheme] = useState(() => localStorage.getItem('cg-theme') || 'dark')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [previewDelta, setPreviewDelta] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [banner, setBanner] = useState('')

  const selected = useMemo(
    () => workspace.clauses.find((clause) => clause.id === selectedId) || workspace.clauses[0] || null,
    [workspace.clauses, selectedId],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('cg-theme', theme)
  }, [theme])

  const refreshSide = useCallback(async () => {
    const [log, report, policy] = await Promise.all([api.audit(), api.eval(), api.retention()])
    setAudit(log)
    setEvalReport(report)
    setRetention(policy)
  }, [])

  const applyWorkspace = useCallback(
    async (data) => {
      setWorkspace(data)
      if (!data.clauses.some((clause) => clause.id === selectedId)) {
        setSelectedId(data.clauses[0]?.id || null)
      }
      await refreshSide()
    },
    [refreshSide, selectedId],
  )

  useEffect(() => {
    api.retention().then(setRetention).catch(() => {})
    api
      .me()
      .then(async ({ user: next }) => {
        setUser(next)
        const data = await api.workspace()
        setWorkspace(data)
        setSelectedId(data.clauses[0]?.id || null)
        await refreshSide()
      })
      .catch(() => setUser(null))
  }, [refreshSide])

  const run = async (fn) => {
    try {
      setBanner('')
      setBusy(true)
      await fn()
    } catch (error) {
      setBanner(error.message)
    } finally {
      setBusy(false)
    }
  }

  const nextUnresolved = useCallback(() => {
    const open = workspace.clauses.filter((clause) => clause.disposition === 'pending' || clause.disposition === 'review')
    if (!open.length) return
    const index = Math.max(0, open.findIndex((clause) => clause.id === selected?.id))
    const next = open[(index + 1) % open.length]
    setSelectedId(next.id)
  }, [workspace.clauses, selected])

  const move = useCallback(
    (delta) => {
      if (!workspace.clauses.length) return
      const index = Math.max(0, workspace.clauses.findIndex((clause) => clause.id === selected?.id))
      const next = workspace.clauses[(index + delta + workspace.clauses.length) % workspace.clauses.length]
      setSelectedId(next.id)
    },
    [workspace.clauses, selected],
  )

  useEffect(() => {
    const onKey = (event) => {
      if (!user) return
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return
      if (event.key === 'j' || event.key === 'J') {
        event.preventDefault()
        move(1)
      } else if (event.key === 'k' || event.key === 'K') {
        event.preventDefault()
        move(-1)
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault()
        nextUnresolved()
      } else if (event.key === 'a' || event.key === 'A') {
        event.preventDefault()
        if (selected) run(() => api.accept(selected.id).then(applyWorkspace))
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        if (selected) setRejecting(selected)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [user, selected, move, nextUnresolved, applyWorkspace])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'clauseguard-workspace.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <Login
        busy={busy}
        error={authError}
        onLogin={(email, password) =>
          run(async () => {
            setAuthError('')
            try {
              const { user: next } = await api.login(email, password)
              setUser(next)
              const data = await api.workspace()
              await applyWorkspace(data)
            } catch (error) {
              setAuthError(error.message)
              throw error
            }
          })
        }
      />
    )
  }

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <a href="#main-workspace" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--gold)] focus:px-3 focus:py-2 focus:text-[var(--ink)]">
        Skip to clause workspace
      </a>
      <Navbar
        user={user}
        documentName={workspace.documentName}
        band={workspace.band}
        score={workspace.score}
        theme={theme}
        ocrUsed={workspace.ocrUsed}
        onTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        onToggleLeft={() => setLeftOpen((value) => !value)}
        onToggleRight={() => setRightOpen((value) => !value)}
        onUndo={() => run(() => api.undo().then(applyWorkspace))}
        onExportJson={exportJson}
        onExportDocx={() => run(() => api.exportDocx())}
        onLogout={() =>
          run(async () => {
            await api.logout()
            setUser(null)
          })
        }
        onUpload={(file) => run(() => api.upload(file).then(applyWorkspace))}
        onSample={() => run(() => api.sample().then(applyWorkspace))}
      />
      {banner ? (
        <p className="border-b border-line bg-rose-500/10 px-4 py-2 text-sm text-rose-500" role="alert">
          {banner}
        </p>
      ) : null}
      {busy ? <p className="sr-only" aria-live="polite">Working</p> : null}
      <div id="main-workspace" tabIndex={-1} className="flex min-h-0 flex-1">
        <div className={`${leftOpen ? 'flex w-full max-w-xs' : 'hidden'} min-h-0 shrink-0 flex-col lg:flex`}>
          <ClauseTree
            clauses={workspace.clauses}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            query={query}
            onQuery={(value) => setQuery(sanitizeSearchQuery(value))}
            onClearSearch={() => setQuery('')}
            filter={filter}
            onFilter={setFilter}
            progress={workspace.progress}
            onNextUnresolved={nextUnresolved}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <RedlinePanel
            clause={selected}
            view={view}
            onView={setView}
            user={user}
            previewDelta={previewDelta}
            onPreview={setPreviewDelta}
            onAccept={(clause) => run(() => api.accept(clause.id).then(applyWorkspace))}
            onReject={(clause) => setRejecting(clause)}
            onSelectPosition={(id, positionId) => run(() => api.selectPosition(id, positionId).then(applyWorkspace))}
            onSaveEdit={(id, text) => run(() => api.edit(id, text).then(applyWorkspace))}
            onAssignReview={(id, severity) => run(() => api.assignReview(id, severity).then(applyWorkspace))}
          />
          <DocumentMap
            fullText={workspace.fullText}
            clause={selected}
            onJump={() => document.getElementById('source-current-clause')?.scrollIntoView({ block: 'center' })}
          />
        </div>
        <div className={`${rightOpen ? 'flex w-full max-w-xs' : 'hidden'} min-h-0 shrink-0 flex-col border-l border-line bg-panel lg:flex`}>
          <RiskGauge
            score={workspace.score}
            previewDelta={previewDelta}
            contributions={workspace.contributions}
            categories={workspace.categories}
            interactions={workspace.interactions}
            missing={workspace.missing}
          />
          <EvalPanel report={evalReport} />
          <AuditLog events={audit.events} chain={audit.chain} retention={retention} />
        </div>
      </div>
      <p className="border-t border-line px-4 py-1 text-[11px] text-[var(--muted)]">
        Shortcuts: J/K clause · N next unresolved · A accept · R reject · {workspace.modelVersion} / {workspace.promptVersion}
      </p>
      <RejectModal
        clause={rejecting}
        onCancel={() => setRejecting(null)}
        onConfirm={(rationale) =>
          run(async () => {
            await api.reject(rejecting.id, rationale)
            setRejecting(null)
            await applyWorkspace(await api.workspace())
          })
        }
      />
    </div>
  )
}
