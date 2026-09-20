import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import RiskGauge from './components/RiskGauge.jsx'
import ClauseTree from './components/ClauseTree.jsx'
import RedlinePanel from './components/RedlinePanel.jsx'
import AuditLog from './components/AuditLog.jsx'
import { POLICY_CITATION, computeRiskScore } from './data/mockContract.js'
import { loadSession, saveSession } from './utils/storage.js'
import { FOCUS_RING } from './utils/a11y.js'
import { safeFilename, sanitizeForExport, sanitizeSearchQuery, sanitizeText } from './utils/sanitize.js'

function download(filename, contents, type) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFilename(filename, 'clauseguard-export.txt')
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function App() {
  const restored = useMemo(() => loadSession(), [])
  const [clauses, setClauses] = useState(() => restored.clauses ?? [])
  const [events, setEvents] = useState(() => restored.events ?? [])
  const [selectedId, setSelectedId] = useState(restored.selectedId ?? 'c7')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const score = computeRiskScore(clauses)
  const selected = clauses.find((clause) => clause.id === selectedId) ?? clauses[0] ?? null

  useEffect(() => {
    saveSession({ clauses, events, selectedId })
  }, [clauses, events, selectedId])

  const pushEvent = (action, clause) => {
    setEvents((current) => [
      {
        id: `${Date.now()}-${action}-${clause.id}`,
        action,
        section: sanitizeText(clause.section, { max: 20 }),
        title: sanitizeText(clause.title, { max: 160 }),
        policy: sanitizeText(clause.policy, { max: 160 }),
        at: new Date().toISOString(),
      },
      ...current,
    ])
  }

  const acceptClause = (clause) => {
    setClauses((current) =>
      current.map((item) =>
        item.id === clause.id ? { ...item, original: item.proposed, risk: 'Done' } : item,
      ),
    )
    pushEvent('accepted', clause)
  }

  const rejectClause = (clause) => {
    pushEvent('rejected', clause)
  }

  const exportJson = () => {
    const payload = sanitizeForExport({
      product: 'ClauseGuard LegalLens AI',
      policy: POLICY_CITATION,
      exportedAt: new Date().toISOString(),
      riskScore: score,
      clauses,
      auditLog: events,
    })
    download(
      'clauseguard-audit.json',
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
    )
  }

  const exportMemo = () => {
    const safeClauses = sanitizeForExport(clauses)
    const safeEvents = sanitizeForExport(events)
    const lines = [
      'CLAUSEGUARD AUDIT MEMO',
      `Policy: ${sanitizeForExport(POLICY_CITATION)}`,
      `Risk score: ${score}`,
      `Exported: ${sanitizeForExport(new Date().toISOString())}`,
      '',
      ...safeClauses.map(
        (clause) =>
          `Section ${clause.section} ${clause.title} [${clause.risk}]\n${clause.explanation}\n`,
      ),
      'SESSION LOG',
      ...safeEvents.map(
        (event) =>
          `${event.at} · ${String(event.action).toUpperCase()} · Section ${event.section} ${event.title}`,
      ),
    ]
    download('clauseguard-memo.txt', lines.join('\n'), 'text/plain;charset=utf-8')
  }

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <a
        href="#main-workspace"
        className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink ${FOCUS_RING}`}
      >
        Skip to clause workspace
      </a>
      <Navbar score={score} onExportJson={exportJson} onExportMemo={exportMemo} focusClass={FOCUS_RING} />
      <div
        id="main-workspace"
        tabIndex={-1}
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_280px]"
      >
        <ClauseTree
          clauses={clauses}
          selectedId={selected?.id}
          onSelect={setSelectedId}
          query={query}
          onQuery={(value) => setQuery(sanitizeSearchQuery(value))}
          onClearSearch={() => setQuery('')}
          filter={filter}
          onFilter={setFilter}
          focusClass={FOCUS_RING}
        />
        <RedlinePanel
          clause={selected}
          onAccept={acceptClause}
          onReject={rejectClause}
          focusClass={FOCUS_RING}
        />
        <div className="flex min-h-0 flex-col border-l border-line bg-panel">
          <div className="p-4">
            <RiskGauge score={score} />
          </div>
          <div className="min-h-0 flex-1">
            <AuditLog events={events} />
          </div>
        </div>
      </div>
    </div>
  )
}
