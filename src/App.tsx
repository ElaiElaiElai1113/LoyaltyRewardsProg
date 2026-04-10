import { QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from '@/features/auth/auth-provider'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/routes/router'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
