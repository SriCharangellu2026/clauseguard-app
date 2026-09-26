export default function AuditLog({ events, chain, retention }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-line" aria-labelledby="audit-log-heading" aria-live="polite">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 id="audit-log-heading" className="text-xs font-semibold uppercase tracking-[0.14em]">
          Server audit log
        </h2>
        <span className="text-[11px] text-[var(--muted)]">{chain?.ok ? 'chain intact' : 'chain broken'}</span>
      </div>
      <p className="px-4 pt-2 text-[11px] leading-4 text-[var(--muted)]">{retention?.summary}</p>
      <ol className="clause-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {(events || []).map((event) => (
          <li key={event.id} className="rounded-lg border border-line px-3 py-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-bold uppercase">{event.action}</span>
              <time dateTime={event.at}>{new Date(event.at).toLocaleTimeString()}</time>
            </div>
            <p className="mt-1">
              {event.user} · {event.role}
              {event.section ? ` · §${event.section}` : ''}
            </p>
            {event.rationale ? <p className="mt-1 italic">“{event.rationale}”</p> : null}
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              {event.modelVersion} / {event.promptVersion}
            </p>
            <p className="mt-1 truncate font-mono text-[10px] text-[var(--muted)]" title={event.hash}>
              hash {event.hash?.slice(0, 12)}… prev {event.previousHash?.slice(0, 8)}…
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
