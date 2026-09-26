export default function DocumentMap({ fullText, clause, onJump }) {
  if (!fullText) return null
  const start = clause?.startOffset || 0
  const end = clause?.endOffset || start + 40
  return (
    <section className="flex max-h-44 min-h-0 w-full shrink-0 flex-col border-t border-line bg-panel xl:h-auto xl:max-h-none xl:w-56 xl:border-l xl:border-t-0" aria-label="Full document source">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em]">Source document</h2>
        <button type="button" className="text-[11px] underline" onClick={() => onJump?.()}>
          Jump to clause
        </button>
      </div>
      <pre id="source-document" className="clause-scroll min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-4 pb-3 font-serif text-[11px] leading-5 text-[var(--muted)]">
        {fullText.slice(0, start)}
        <mark className="bg-[var(--gold)]/30 text-[var(--fg)]" id="source-current-clause">
          {fullText.slice(start, end)}
        </mark>
        {fullText.slice(end)}
      </pre>
    </section>
  )
}
