import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('UI crash captured by ErrorBoundary:', error)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-slate-900">Une erreur est survenue</h1>
            <p className="text-sm text-slate-500 mt-2">
              L&apos;application a rencontré un problème inattendu. Vous pouvez recharger la page.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-5 px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
