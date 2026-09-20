import { Download, FileJson, Scale, ShieldAlert } from 'lucide-react'
import { riskBand } from '../data/mockContract'
import { FOCUS_RING } from '../utils/a11y.js'

export default function Navbar({ score, onExportJson, onExportMemo, focusClass = FOCUS_RING }) {
  const band = riskBand(score)
  const badgeClass =
    band.tone === 'high'
      ? 'bg-rose-500/15 text-rose-300 ring-rose-400/30'
      : band.tone === 'med'
        ? 'bg-amber-500/15 text-amber-200 ring-amber-400/30'
        : 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-panel/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30"
          aria-hidden="true"
        >
          <Scale size={20} aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-lg font-semibold tracking-tight text-white">ClauseGuard</h1>
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">LegalLens AI</span>
          </div>
          <p className="text-xs text-slate-400">MSA-2026-441 · Vendor Cloud Services Agreement</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}
          aria-label={`Contract risk status ${band.label}, score ${score}`}
        >
          <ShieldAlert size={14} aria-hidden="true" />
          {band.label} · {score}
        </span>
        <button
          type="button"
          onClick={onExportMemo}
          aria-label="Export sanitized audit memo as a text file"
          className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-gold/40 hover:text-white ${focusClass}`}
        >
          <Download size={14} aria-hidden="true" />
          Export memo
        </button>
        <button
          type="button"
          onClick={onExportJson}
          aria-label="Export sanitized audit data as a JSON file"
          className={`inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-amber-300 ${focusClass}`}
        >
          <FileJson size={14} aria-hidden="true" />
          Export JSON
        </button>
      </div>
    </header>
  )
}
