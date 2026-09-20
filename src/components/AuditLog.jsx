import { History } from 'lucide-react'

function formatTime(iso) {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return 'Unknown time'
  return new Date(parsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AuditLog({ events }) {
  const latest = events[0]
  const liveMessage = latest
    ? `${latest.action} section ${latest.section} ${latest.title}`
    : 'No audit events yet'

  return (
    <section
      className="flex h-full min-h-0 flex-col border-t border-line bg-panel"
      aria-labelledby="audit-log-heading"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <History size={14} className="text-gold" aria-hidden="true" />
        <h2 id="audit-log-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
          Session audit log
        </h2>
        <span className="ml-auto text-[11px] text-slate-500">{events.length} events</span>
      </div>
      <p className="sr-only">{liveMessage}</p>
      <ol className="clause-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {events.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-slate-500">
            Accept or reject a redline to record the first session event.
          </li>
        )}
        {events.map((event) => (
          <li key={event.id} className="rounded-lg border border-line bg-ink/50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  event.action === 'accepted' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {event.action}
              </span>
              <time className="text-[11px] text-slate-500" dateTime={event.at}>
                {formatTime(event.at)}
              </time>
            </div>
            <p className="mt-1 text-sm text-slate-100">
              §{event.section} {event.title}
            </p>
            <p className="text-[11px] text-slate-500">{event.policy}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
