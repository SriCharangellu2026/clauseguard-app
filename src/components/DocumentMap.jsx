export default function DocumentMap({ fullText, clause, onJump }) {
  if (!fullText) return null
  const start = clause?.startOffset || 0
  const end = clause?.endOffset || start + 40
  return (
    <section className="border-t border-line bg-panel">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em]">Source document</h2>
        <button type="button" className="text-[11px] underline" onClick={() => onJump?.()}>
          Jump to clause
        </button>
      </div>
      <pre id="source-document" className="clause-scroll max-h-40 overflow-auto whitespace-pre-wrap px-4 pb-3 font-serif text-[11px] leading-5 text-[var(--muted)]">
        {fullText.slice(0, start)}
        <mark className="bg-[var(--gold)]/30 text-[var(--fg)]" id="source-current-clause">
          {fullText.slice(start, end)}
        </mark>
        {fullText.slice(end)}
      </pre>
    </section>
  )
}
