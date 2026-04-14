import { QueryClientProvider } from '@tanstack/react-query'

import { ErrorBoundary } from '@/components/error-boundary'
import { AuthProvider } from '@/features/auth/auth-provider'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/routes/router'
import { Toaster } from 'sonner'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRouter />
          <Toaster position="bottom-right" closeButton richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
