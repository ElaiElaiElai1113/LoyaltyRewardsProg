import { Component, type ErrorInfo, type ReactNode } from 'react'

import { useLanguage } from '@/lib/language'

interface Props {
  children: ReactNode
}

interface ErrorBoundaryContent {
  title: string
  message: string
  action: string
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
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="font-display text-4xl text-primary">{this.props.title}</h1>
            <p className="text-muted-foreground">
              {this.props.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-colors duration-200 hover:bg-primary-fixed"
            >
              {this.props.action}
            </button>
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
    >
      {children}
    </ErrorBoundaryFallback>
  )
}
