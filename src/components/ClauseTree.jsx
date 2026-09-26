import { AlertTriangle, CheckCircle2, HelpCircle, Info, MinusCircle, Search } from 'lucide-react'
import { FOCUS_RING } from '../utils/a11y.js'

const FILTERS = ['All', 'High', 'Med', 'Low', 'Review', 'Accepted', 'Rejected', 'Aligned']

const ICONS = {
  High: AlertTriangle,
  Med: MinusCircle,
  Low: Info,
  Review: HelpCircle,
  Aligned: CheckCircle2,
  Accepted: CheckCircle2,
  Rejected: MinusCircle,
}

function visibleFor(clauses, filter, query) {
  return clauses.filter((clause) => {
    const haystack = `${clause.section} ${clause.title} ${clause.category} ${clause.original}`.toLowerCase()
    const matchesQuery = haystack.includes(query.trim().toLowerCase())
    if (!matchesQuery) return false
    if (filter === 'All') return true
    if (filter === 'Accepted') return clause.disposition === 'accepted'
    if (filter === 'Rejected') return clause.disposition === 'rejected'
    if (filter === 'Review') return clause.disposition === 'review' || clause.severity === 'Review'
    if (filter === 'Aligned') return clause.severity === 'Aligned'
    return clause.severity === filter && clause.disposition === 'pending'
  })
}

export default function ClauseTree({
  clauses,
  selectedId,
  onSelect,
  query,
  onQuery,
  onClearSearch,
  filter,
  onFilter,
  progress,
  onNextUnresolved,
}) {
  const visible = visibleFor(clauses, filter, query)
  const pct = progress.total ? Math.round((progress.resolved / progress.total) * 100) : 0

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line p-4">
        <h2 className="font-serif text-sm font-semibold" id="clause-register-heading">
          Clause register
        </h2>
        <p className="mt-2 text-xs text-[var(--muted)]" aria-live="polite">
          {progress.resolved} of {progress.total} resolved
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ink)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
        </div>
        <button type="button" onClick={onNextUnresolved} className={`mt-3 w-full rounded-lg border border-line px-3 py-1.5 text-xs font-semibold ${FOCUS_RING}`}>
          Next unresolved (N)
        </button>
        <label className="relative mt-3 block" htmlFor="clause-search">
          <span className="sr-only">Search contract clauses</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-[var(--muted)]" aria-hidden="true" />
          <input
            id="clause-search"
            type="search"
            value={query}
            maxLength={120}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search sections, titles…"
            className={`w-full rounded-lg border border-line bg-[var(--ink)] py-2 pl-8 pr-3 text-sm ${FOCUS_RING}`}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter clauses">
          {FILTERS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onFilter(chip)}
              aria-pressed={filter === chip}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-line ${FOCUS_RING} ${
                filter === chip ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-[var(--muted)]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
      <ul className="clause-scroll min-h-0 flex-1 overflow-y-auto p-2" aria-labelledby="clause-register-heading">
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-[var(--muted)]">
            {query.trim() ? (
              <>
                No clauses match that search.
                <button type="button" onClick={onClearSearch} className={`mt-3 block w-full rounded-lg bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] ${FOCUS_RING}`}>
                  Clear Search
                </button>
              </>
            ) : (
              'No clauses match this filter.'
            )}
          </li>
        )}
        {visible.map((clause) => {
          const Icon = ICONS[clause.disposition === 'accepted' ? 'Accepted' : clause.disposition === 'rejected' ? 'Rejected' : clause.severity] || Info
          const selected = clause.id === selectedId
          return (
            <li key={clause.id}>
              <button
                type="button"
                onClick={() => onSelect(clause.id)}
                aria-current={selected ? 'true' : undefined}
                className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left ${FOCUS_RING} ${selected ? 'bg-panel-2 ring-1 ring-[var(--gold)]/40' : 'hover:bg-panel-2/70'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[var(--gold)]">§{clause.section}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                    <Icon size={12} aria-hidden="true" />
                    <span>
                      {clause.disposition === 'pending' ? clause.severity : clause.disposition}
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{clause.title}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {clause.category} · {(clause.confidence * 100).toFixed(0)}% conf.
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
