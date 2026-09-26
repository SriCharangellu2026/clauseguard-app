import { useEffect, useRef, useState } from 'react'

const R = 54
const C = 2 * Math.PI * R
const TARGET = 30

export default function RiskGauge({ score, previewDelta, contributions, categories, interactions, missing }) {
  const [display, setDisplay] = useState(score)
  const displayRef = useRef(score)
  const previewOffset = previewDelta?.delta ?? 0
  const preview = previewDelta == null ? display : Math.max(30, Math.min(100, score + previewOffset))

  useEffect(() => {
    const from = displayRef.current
    const to = score
    if (from === to) return undefined
    const start = performance.now()
    let frame
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 700)
      const next = Math.round(from + (to - from) * (1 - (1 - t) ** 3))
      displayRef.current = next
      setDisplay(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const shown = previewDelta == null ? display : preview
  const offset = C - (shown / 100) * C
  const targetOffset = C - (TARGET / 100) * C
  const tone = shown >= 70 ? '#e11d48' : shown >= 45 ? '#d97706' : '#059669'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-4" role="status" aria-live="polite" aria-atomic="true">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Portfolio risk</p>
        <div className="relative mx-auto mt-2 h-36 w-36">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" className="text-line" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray={`${C * 0.01} ${C}`}
              strokeDashoffset={targetOffset}
            />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-4xl">{shown}</span>
            <span className="px-2 text-center text-[11px] leading-4 text-[var(--muted)]">
              {previewDelta != null
                ? `§${previewDelta.section} accepted → ${previewDelta.delta > 0 ? '+' : ''}${previewDelta.delta}`
                : `Target ${TARGET}`}
            </span>
          </div>
        </div>
      </div>
      <div className="clause-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 text-xs">
        <section>
          <h3 className="font-semibold">By clause</h3>
          <ul className="mt-1 space-y-1">
            {contributions.map((row) => (
              <li key={row.id}>
                §{row.section} {row.severity} · {row.points} pts
                {row.disposition === 'pending' ? ` · accept → −${row.points}` : ''}
              </li>
            ))}
            {contributions.length === 0 ? <li>No open risk points. Floor is {TARGET}.</li> : null}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">By category</h3>
          <ul className="mt-1 space-y-1">
            {categories.map((row) => (
              <li key={row.category}>
                {row.category}: {row.points} pts ({row.open} open)
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">Cross-clause</h3>
          <ul className="mt-1 space-y-2">
            {interactions.map((row) => (
              <li key={row.id}>
                <span className="font-medium">{row.title}</span>
                <span className="block text-[var(--muted)]">{row.detail}</span>
              </li>
            ))}
            {interactions.length === 0 ? <li>No interactions flagged.</li> : null}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">Missing clauses</h3>
          <ul className="mt-1 space-y-2">
            {missing.map((row) => (
              <li key={row.id}>
                <span className="font-medium">{row.title}</span>
                <span className="block text-[var(--muted)]">{row.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
