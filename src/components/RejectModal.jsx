import { FOCUS_RING } from '../utils/a11y.js'

export default function RejectModal({ clause, onCancel, onConfirm }) {
  if (!clause) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <form
        className="w-full max-w-lg rounded-2xl border border-line bg-panel p-6"
        onSubmit={(event) => {
          event.preventDefault()
          const rationale = String(new FormData(event.currentTarget).get('rationale') || '')
          onConfirm(rationale)
        }}
      >
        <h2 id="reject-title" className="font-serif text-xl">
          Reject §{clause.section} {clause.title}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">A rationale is required and is written to the server audit chain.</p>
        <textarea
          name="rationale"
          required
          minLength={8}
          rows={5}
          className={`mt-4 w-full rounded-lg border border-line bg-[var(--ink)] p-3 text-sm ${FOCUS_RING}`}
          placeholder="Why is the vendor paper acceptable, or why is this finding wrong?"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={`rounded-lg border border-line px-3 py-1.5 text-sm ${FOCUS_RING}`}>
            Cancel
          </button>
          <button type="submit" className={`rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white ${FOCUS_RING}`}>
            Log rejection
          </button>
        </div>
      </form>
    </div>
  )
}
