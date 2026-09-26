import {
  FileDown,
  FileJson,
  LogOut,
  Moon,
  PanelLeft,
  PanelRight,
  Scale,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react'
import { FOCUS_RING } from '../utils/a11y.js'

export default function Navbar({
  user,
  documentName,
  band,
  score,
  theme,
  onTheme,
  onToggleLeft,
  onToggleRight,
  onUndo,
  onExportJson,
  onExportDocx,
  onLogout,
  onUpload,
  onSample,
  ocrUsed,
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel/90 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className={`rounded-lg border border-line p-2 lg:hidden ${FOCUS_RING}`} onClick={onToggleLeft} aria-label="Toggle clause register">
          <PanelLeft size={16} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]" aria-hidden="true">
          <Scale size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-lg text-[var(--fg)]">ClauseGuard</h1>
            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">LegalLens AI</span>
          </div>
          <p className="truncate text-xs text-[var(--muted)]">
            {documentName}
            {ocrUsed ? ' · OCR applied' : ''}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-line" aria-label={`Risk ${band.label}, score ${score}`}>
          {band.label} · {score}
        </span>
        <label className={`cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-medium ${FOCUS_RING}`}>
          <Upload size={14} className="mr-1 inline" aria-hidden="true" />
          Upload PDF/DOCX
          <input
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.tif,.tiff"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onUpload(file)
              event.target.value = ''
            }}
          />
        </label>
        <button type="button" onClick={onSample} className={`rounded-lg border border-line px-3 py-1.5 text-xs ${FOCUS_RING}`}>
          Sample MSA
        </button>
        <button type="button" onClick={onUndo} className={`rounded-lg border border-line px-3 py-1.5 text-xs ${FOCUS_RING}`} aria-label="Undo last accept or reject">
          <Undo2 size={14} className="mr-1 inline" aria-hidden="true" />
          Undo
        </button>
        <button type="button" onClick={onExportJson} className={`rounded-lg border border-line px-3 py-1.5 text-xs ${FOCUS_RING}`} aria-label="Export JSON audit copy">
          <FileJson size={14} className="mr-1 inline" aria-hidden="true" />
          JSON
        </button>
        <button type="button" onClick={onExportDocx} className={`rounded-lg bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] ${FOCUS_RING}`} aria-label="Export Word file with tracked changes">
          <FileDown size={14} className="mr-1 inline" aria-hidden="true" />
          Word redline
        </button>
        <button type="button" onClick={onTheme} className={`rounded-lg border border-line p-2 ${FOCUS_RING}`} aria-label="Toggle light and dark theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button type="button" className={`hidden rounded-lg border border-line p-2 lg:inline-flex ${FOCUS_RING}`} onClick={onToggleRight} aria-label="Toggle risk panel">
          <PanelRight size={16} />
        </button>
        <button type="button" onClick={onLogout} className={`rounded-lg border border-line px-3 py-1.5 text-xs ${FOCUS_RING}`} aria-label={`Sign out ${user.name}`}>
          <LogOut size={14} className="mr-1 inline" aria-hidden="true" />
          {user.role}
        </button>
      </div>
    </header>
  )
}
