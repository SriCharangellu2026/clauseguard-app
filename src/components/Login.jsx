import { FOCUS_RING } from '../utils/a11y.js'

export default function Login({ onLogin, error, busy }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        className="w-full max-w-md rounded-2xl border border-line bg-panel p-8 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          onLogin(String(data.get('email')), String(data.get('password')))
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">ClauseGuard · LegalLens AI</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--fg)]">Sign in to review</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The session cookie is HTTP-only. Tokens are not stored in localStorage. Roles: reviewer vs approver.
        </p>
        <label className="mt-6 block text-xs font-semibold text-[var(--muted)]" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue="reviewer@clauseguard.local"
          className={`mt-1 w-full rounded-lg border border-line bg-[var(--ink)] px-3 py-2 text-sm ${FOCUS_RING}`}
        />
        <label className="mt-4 block text-xs font-semibold text-[var(--muted)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue="Reviewer123!"
          className={`mt-1 w-full rounded-lg border border-line bg-[var(--ink)] px-3 py-2 text-sm ${FOCUS_RING}`}
        />
        {error ? (
          <p className="mt-3 text-sm text-rose-500" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className={`mt-6 w-full rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--ink)] ${FOCUS_RING}`}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Demo accounts: reviewer@clauseguard.local / Reviewer123! and approver@clauseguard.local / Approver123!.
          Approvers can assign review-queue risk, accept walk-away positions, and export Word with tracked changes.
        </p>
      </form>
    </div>
  )
}
