import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Catches an error thrown while rendering anything below it, so the page shows a way forward instead
 * of going blank. It is a class because React has no hook for this: it is the one class in the app.
 * Errors in event handlers and in promises are not caught here, and need their own handling, as
 * loading the branches and the map do.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // There is no error service in this app, so the console is where a developer finds out.
    console.error('The page failed to render.', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="container py-5" role="alert">
        <h1 className="h3">Something went wrong</h1>
        <p>The branch finder stopped working. Reloading the page usually fixes it.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </main>
    )
  }
}
