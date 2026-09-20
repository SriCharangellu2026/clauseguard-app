import { Search } from 'lucide-react'
import { FOCUS_RING } from '../utils/a11y.js'

const FILTERS = ['All', 'High', 'Med', 'Low', 'Done']

const RISK_STYLES = {
  High: 'bg-rose-500/15 text-rose-300 ring-rose-400/25',
  Med: 'bg-amber-500/15 text-amber-200 ring-amber-400/25',
  Low: 'bg-sky-500/15 text-sky-300 ring-sky-400/25',
  Done: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25',
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
  focusClass = FOCUS_RING,
}) {
  const counts = FILTERS.reduce((acc, key) => {
    acc[key] = key === 'All' ? clauses.length : clauses.filter((c) => c.risk === key).length
    return acc
  }, {})

  const visible = clauses.filter((clause) => {
    const matchesFilter = filter === 'All' || clause.risk === filter
    const haystack = `${clause.section} ${clause.title} ${clause.category} ${clause.original}`.toLowerCase()
    const matchesQuery = haystack.includes(query.trim().toLowerCase())
    return matchesFilter && matchesQuery
  })

  const moveSelection = (delta) => {
    if (visible.length === 0) return
    const index = Math.max(0, visible.findIndex((clause) => clause.id === selectedId))
    const next = visible[(index + delta + visible.length) % visible.length]
    onSelect(next.id)
  }

  const onListKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveSelection(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      if (visible[0]) onSelect(visible[0].id)
    } else if (event.key === 'End') {
      event.preventDefault()
      if (visible[visible.length - 1]) onSelect(visible[visible.length - 1].id)
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-panel" aria-label="Clause register">
      <div className="border-b border-line p-4">
        <h2 className="font-serif text-sm font-semibold text-white" id="clause-register-heading">
          Clause register
        </h2>
        <label className="relative mt-3 block" htmlFor="clause-search">
          <span className="sr-only">Search contract clauses</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
          <input
            id="clause-search"
            type="search"
            value={query}
            maxLength={120}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search sections, titles…"
            aria-label="Search contract clauses by section, title, or text"
            className={`w-full rounded-lg border border-line bg-ink py-2 pl-8 pr-3 text-sm text-slate-100 placeholder:text-slate-500 ${focusClass}`}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter clauses by risk level">
          {FILTERS.map((chip) => {
            const active = filter === chip
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onFilter(chip)}
                aria-pressed={active}
                aria-label={`Show ${chip} clauses, ${counts[chip]} items`}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${focusClass} ${
                  active
                    ? 'bg-gold/20 text-gold ring-gold/40'
                    : 'bg-panel-2 text-slate-400 ring-line hover:text-slate-200'
                }`}
              >
                {chip} {counts[chip]}
              </button>
            )
          })}
        </div>
      </div>

      <ul
        className="clause-scroll min-h-0 flex-1 overflow-y-auto p-2"
        role="listbox"
        aria-labelledby="clause-register-heading"
        aria-activedescendant={selectedId ? `clause-${selectedId}` : undefined}
        onKeyDown={onListKeyDown}
      >
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center" role="presentation">
            <p className="text-sm text-slate-400">
              {query.trim()
                ? 'No clauses match that search. Try a section number or a shorter phrase.'
                : 'No clauses match this filter.'}
            </p>
            {query.trim() ? (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear search and show all matching clauses"
                className={`mt-3 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink ${focusClass}`}
              >
                Clear Search
              </button>
            ) : null}
          </li>
        )}
        {visible.map((clause) => {
          const selected = clause.id === selectedId
          return (
            <li key={clause.id} role="presentation">
              <button
                id={`clause-${clause.id}`}
                type="button"
                role="option"
                tabIndex={0}
                aria-selected={selected}
                aria-label={`Section ${clause.section} ${clause.title}, ${clause.risk} risk, ${clause.category}`}
                onClick={() => onSelect(clause.id)}
                className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${focusClass} ${
                  selected ? 'bg-panel-2 ring-1 ring-gold/35' : 'hover:bg-panel-2/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gold">
                    §{clause.section}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${RISK_STYLES[clause.risk]}`}>
                    {clause.risk}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-100">{clause.title}</p>
                <p className="text-[11px] text-slate-500">{clause.category}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
