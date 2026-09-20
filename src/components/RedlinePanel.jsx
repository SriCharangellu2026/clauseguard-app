import { Check, Scale, X } from 'lucide-react'
import { FOCUS_RING } from '../utils/a11y.js'

function tokenize(text) {
  return String(text ?? '').split(/(\s+)/)
}

function diffTokens(original, proposed) {
  const a = tokenize(original)
  const b = tokenize(proposed)
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const left = []
  const right = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      left.push({ t: a[i], k: 'same' })
      right.push({ t: b[j], k: 'same' })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      left.push({ t: a[i], k: 'del' })
      i += 1
    } else {
      right.push({ t: b[j], k: 'add' })
      j += 1
    }
  }
  while (i < m) {
    left.push({ t: a[i], k: 'del' })
    i += 1
  }
  while (j < n) {
    right.push({ t: b[j], k: 'add' })
    j += 1
  }
  return { left, right }
}

function TokenRun({ tokens }) {
  return (
    <p className="font-serif text-[13.5px] leading-7 text-slate-200">
      {tokens.map((token, index) => {
        if (token.k === 'del') {
          return (
            <span key={index} className="bg-rose-500/20 text-rose-200 line-through decoration-rose-400/80">
              {token.t}
            </span>
          )
        }
        if (token.k === 'add') {
          return (
            <span key={index} className="bg-emerald-500/20 text-emerald-200">
              {token.t}
            </span>
          )
        }
        return <span key={index}>{token.t}</span>
      })}
    </p>
  )
}

export default function RedlinePanel({ clause, onAccept, onReject, focusClass = FOCUS_RING }) {
  if (!clause) {
    return (
      <section className="flex h-full items-center justify-center bg-ink/40 text-sm text-slate-500" aria-live="polite">
        Select a clause to review the proposed redline.
      </section>
    )
  }

  const identical = clause.original === clause.proposed
  const { left, right } = identical
    ? {
        left: tokenize(clause.original).map((t) => ({ t, k: 'same' })),
        right: tokenize(clause.proposed).map((t) => ({ t, k: 'same' })),
      }
    : diffTokens(clause.original, clause.proposed)

  const locked = clause.risk === 'Done'

  return (
    <section className="flex h-full min-h-0 flex-col bg-ink/30" aria-label="Redline comparison">
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
            Section {clause.section} · {clause.category}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white">{clause.title}</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => onReject(clause)}
            aria-label={`Reject redline for section ${clause.section} ${clause.title}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 enabled:hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`}
          >
            <X size={16} aria-hidden="true" />
            Reject
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => onAccept(clause)}
            aria-label={`Accept redline for section ${clause.section} ${clause.title}`}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-2 text-sm font-semibold text-ink enabled:hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`}
          >
            <Check size={16} aria-hidden="true" />
            Accept
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-300">Original paper</h3>
          <div className="mt-3">
            <TokenRun tokens={left} />
          </div>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Proposed redline</h3>
          <div className="mt-3">
            <TokenRun tokens={right} />
          </div>
        </article>
        <article className="rounded-2xl border border-gold/25 bg-gold/5 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-gold">
            <Scale size={16} aria-hidden="true" />
            <h3 className="text-xs font-semibold uppercase tracking-wide">Grounded policy explanation</h3>
          </div>
          <p className="mt-2 text-sm font-medium text-amber-100">{clause.policy}</p>
          <p className="mt-1 text-sm text-slate-300">{clause.policyRef}</p>
          <p className="mt-3 text-sm leading-6 text-slate-200">{clause.explanation}</p>
        </article>
      </div>
    </section>
  )
}
