import { Component } from 'react'
import { ShieldAlert } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return { hasError: true, message: String(message).slice(0, 240) }
  }

  componentDidCatch(error, info) {
    console.error('ClauseGuard crashed', error, info?.componentStack)
  }

  handleReset() {
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6 text-slate-100" role="alert">
        <div className="max-w-md rounded-2xl border border-line bg-panel p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
            <ShieldAlert size={24} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-white">ClauseGuard hit a snag</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The workspace recovered without a blank screen. If session storage was corrupted, the next
            load uses the mock contract in mockContract.js.
          </p>
          <p className="mt-3 text-xs text-slate-500">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            aria-label="Reload ClauseGuard workspace"
            className="mt-6 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            Reload workspace
          </button>
        </div>
      </div>
    )
  }
}
