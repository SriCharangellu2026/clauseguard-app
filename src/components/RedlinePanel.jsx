import { useMemo, useState } from 'react'
import { Check, Pencil, Scale, X } from 'lucide-react'
import { FOCUS_RING } from '../utils/a11y.js'

function tokenize(text) {
  return String(text ?? '').split(/(\s+)/)
}

function diffTokens(original, proposed) {
  const a = tokenize(original)
  const b = tokenize(proposed)
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ t: a[i], k: 'same' })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ t: a[i], k: 'del' })
      i += 1
    } else {
      out.push({ t: b[j], k: 'add' })
      j += 1
    }
  }
  while (i < a.length) {
    out.push({ t: a[i], k: 'del' })
    i += 1
  }
  while (j < b.length) {
    out.push({ t: b[j], k: 'add' })
    j += 1
  }
  return out
}

function TokenRun({ tokens }) {
  return (
    <p className="font-serif text-[15px] leading-7">
      {tokens.map((token, index) => {
        if (token.k === 'del') {
          return (
            <del key={index} className="bg-rose-500/15 text-rose-700 decoration-rose-500 dark:text-rose-200">
              {token.t}
            </del>
          )
        }
        if (token.k === 'add') {
          return (
            <ins key={index} className="bg-emerald-500/15 text-emerald-800 no-underline dark:text-emerald-200">
              {token.t}
            </ins>
          )
        }
        return <span key={index}>{token.t}</span>
      })}
    </p>
  )
}

export default function RedlinePanel({
  clause,
  view,
  onView,
  onAccept,
  onReject,
  onSelectPosition,
  onSaveEdit,
  onAssignReview,
  user,
  previewDelta,
  onPreview,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const tokens = useMemo(
    () => (clause ? diffTokens(clause.original, clause.proposed) : []),
    [clause],
  )

  if (!clause) {
    return <section className="flex h-full items-center justify-center text-sm text-[var(--muted)]">Select a clause.</section>
  }

  const locked = clause.disposition === 'accepted' || clause.disposition === 'rejected'
  const review = clause.disposition === 'review'

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Redline comparison">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Section {clause.section} · {clause.category}
          </p>
          <h2 className="mt-1 font-serif text-2xl">{clause.title}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Model confidence {(clause.confidence * 100).toFixed(0)}%
            {clause.acceptDelta ? ` · Accept preview §${clause.section} → ${clause.acceptDelta}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-line p-1" role="group" aria-label="Redline layout">
            <button type="button" onClick={() => onView('tracked')} className={`rounded-md px-2 py-1 text-xs ${FOCUS_RING} ${view === 'tracked' ? 'bg-panel-2' : ''}`}>
              Tracked changes
            </button>
            <button type="button" onClick={() => onView('split')} className={`rounded-md px-2 py-1 text-xs ${FOCUS_RING} ${view === 'split' ? 'bg-panel-2' : ''}`}>
              Side-by-side
            </button>
          </div>
          <button type="button" disabled={locked || review} onClick={() => onReject(clause)} className={`rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-semibold disabled:opacity-40 ${FOCUS_RING}`}>
            <X size={14} className="mr-1 inline" aria-hidden="true" />
            Reject (R)
          </button>
          <button
            type="button"
            disabled={locked || review}
            onClick={() => onAccept(clause)}
            onMouseEnter={() => onPreview({ section: clause.section, delta: clause.acceptDelta || 0 })}
            onMouseLeave={() => onPreview(null)}
            onFocus={() => onPreview({ section: clause.section, delta: clause.acceptDelta || 0 })}
            onBlur={() => onPreview(null)}
            className={`rounded-lg bg-[var(--mint)] px-3 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-40 ${FOCUS_RING}`}
            title={`§${clause.section} accepted → ${clause.acceptDelta || 0}`}
          >
            <Check size={14} className="mr-1 inline" aria-hidden="true" />
            Accept (A)
          </button>
        </div>
      </div>

      <div className="clause-scroll min-h-0 flex-1 overflow-y-auto p-5">
        {review ? (
          <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold">Needs human review</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Confidence is below the routing floor, so this clause is not auto-tagged with a risk level.
              {user.role === 'approver' ? ' Assign a severity to move it into the working queue.' : ' An approver must assign risk before redlines can be accepted.'}
            </p>
            {user.role === 'approver' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {['High', 'Med', 'Low', 'Aligned'].map((severity) => (
                  <button key={severity} type="button" onClick={() => onAssignReview(clause.id, severity)} className={`rounded-lg border border-line px-3 py-1.5 text-xs ${FOCUS_RING}`}>
                    Assign {severity}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {view === 'split' ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-line bg-panel p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-500">Original</h3>
              <p className="mt-3 font-serif text-[15px] leading-7">{clause.original}</p>
            </article>
            <article className="rounded-2xl border border-line bg-panel p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Proposed</h3>
              <p className="mt-3 font-serif text-[15px] leading-7">{clause.proposed}</p>
            </article>
          </div>
        ) : (
          <article className="rounded-2xl border border-line bg-panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide">Single tracked-changes view</h3>
            <div className="mt-3">
              <TokenRun tokens={tokens} />
            </div>
          </article>
        )}

        {clause.positions?.length ? (
          <fieldset className="mt-4 rounded-2xl border border-line p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide">Fallback positions</legend>
            <div className="grid gap-2 md:grid-cols-3">
              {clause.positions.map((position) => (
                <label key={position.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${clause.selectedPosition === position.id ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-line'}`}>
                  <input
                    type="radio"
                    className="sr-only"
                    name="position"
                    checked={clause.selectedPosition === position.id}
                    onChange={() => onSelectPosition(clause.id, position.id)}
                    disabled={locked}
                  />
                  <span className="font-semibold">{position.label}</span>
                  {position.id === 'walkaway' ? (
                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-rose-500">Approver-only walk-away</span>
                  ) : null}
                  <span className="mt-1 block text-xs text-[var(--muted)]">{position.note || position.text.slice(0, 120)}…</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                setDraft(clause.proposed)
                setEditing(true)
              }}
              className={`mt-3 rounded-lg border border-line px-3 py-1.5 text-xs ${FOCUS_RING}`}
            >
              <Pencil size={12} className="mr-1 inline" aria-hidden="true" />
              Edit redline before accepting
            </button>
            {editing ? (
              <div className="mt-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={5}
                  className={`w-full rounded-lg border border-line bg-[var(--ink)] p-3 font-serif text-sm ${FOCUS_RING}`}
                />
                <button
                  type="button"
                  className={`mt-2 rounded-lg bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] ${FOCUS_RING}`}
                  onClick={() => {
                    onSaveEdit(clause.id, draft)
                    setEditing(false)
                  }}
                >
                  Save manual redline
                </button>
              </div>
            ) : null}
          </fieldset>
        ) : null}

        {clause.policy ? (
          <article className="mt-4 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4" id={clause.policy.href.slice(1)}>
            <div className="flex items-center gap-2 text-[var(--gold)]">
              <Scale size={16} aria-hidden="true" />
              <h3 className="text-xs font-semibold uppercase tracking-wide">Retrieved policy passage</h3>
            </div>
            <p className="mt-2 text-sm font-medium">
              {clause.policy.version} · §{clause.policy.section} {clause.policy.title}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Similarity {(clause.policy.similarity * 100).toFixed(0)}% ·{' '}
              <a className="underline" href={clause.policy.href}>
                Open playbook §{clause.policy.section}
              </a>
            </p>
            <blockquote className="mt-3 border-l-2 border-[var(--gold)] pl-3 font-serif text-sm leading-6">“{clause.policy.passage}”</blockquote>
            <p className="mt-3 text-sm leading-6">{clause.explanation}</p>
          </article>
        ) : (
          <p className="mt-4 text-sm">{clause.explanation}</p>
        )}
      </div>
    </section>
  )
}
