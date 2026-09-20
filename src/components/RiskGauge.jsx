import { useEffect, useRef, useState } from 'react'
import { riskBand } from '../data/mockContract'

const R = 54
const C = 2 * Math.PI * R

export default function RiskGauge({ score }) {
  const [display, setDisplay] = useState(score)
  const displayRef = useRef(score)
  const band = riskBand(display)

  useEffect(() => {
    const from = displayRef.current
    const to = score
    if (from === to) return undefined
    const start = performance.now()
    const duration = 800
    let frame
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      const next = Math.round(from + (to - from) * eased)
      displayRef.current = next
      setDisplay(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const offset = C - (display / 100) * C
  const stroke =
    band.tone === 'high' ? '#fb7185' : band.tone === 'med' ? '#fbbf24' : '#34d399'

  return (
    <div
      className="rounded-2xl border border-line bg-panel p-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Portfolio risk score ${display}, ${band.label}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Portfolio risk</p>
      <div className="relative mx-auto mt-2 h-36 w-36">
        {band.tone === 'high' && (
          <span className="risk-pulse absolute inset-4 rounded-full border border-rose-400/40" aria-hidden="true" />
        )}
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden="true" focusable="false">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#1e3a56" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: 'stroke 400ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl font-semibold text-white">{display}</span>
          <span className="text-[11px] font-medium text-slate-400">{band.label}</span>
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-slate-500">
        Accept redlines to move this meter from 78 toward 30.
      </p>
    </div>
  )
}
