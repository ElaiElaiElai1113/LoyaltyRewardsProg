import { Component, type ErrorInfo, type ReactNode } from 'react'

import { useLanguage } from '@/lib/language'
import { reportMonitoringEvent } from '@/lib/monitoring'

interface Props {
  children: ReactNode
}

interface ErrorBoundaryContent {
  title: string
  message: string
  action: string
  homeAction: string
}

interface State {
  hasError: boolean
}

class ErrorBoundaryFallback extends Component<Props & ErrorBoundaryContent, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportMonitoringEvent({
      level: 'error',
      name: 'react_error_boundary',
      message: error.message,
      context: { stack: error.stack, componentStack: info.componentStack },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="font-serif text-4xl text-primary">{this.props.title}</h1>
            <p className="text-on-surface-variant/70">
              {this.props.message}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-primary/90"
              >
                {this.props.action}
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-primary/25 bg-card px-8 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
              >
                {this.props.homeAction}
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundary({ children }: Props) {
  const { t } = useLanguage()

  return (
    <ErrorBoundaryFallback
      title={t('Something went wrong')}
      message={t('An unexpected error occurred. Please reload the page to continue.')}
      action={t('Reload Page')}
      homeAction={t('Back to home')}
    >
      {children}
    </ErrorBoundaryFallback>
  )
}
