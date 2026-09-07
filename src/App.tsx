import { QueryClientProvider } from '@tanstack/react-query'

import { ErrorBoundary } from '@/components/error-boundary'
import { OfflineNotice } from '@/components/offline-notice'
import { ThemeInitializer } from '@/components/theme-toggle'
import { AuthProvider } from '@/features/auth/auth-provider'
import { TenantProvider } from '@/features/tenant/tenant-provider'
import { LanguageProvider, useLanguage } from '@/lib/language'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/routes/router'
import { Toaster } from 'sonner'

function AppToaster() {
  const { t } = useLanguage()
  return <Toaster position="bottom-right" closeButton richColors containerAriaLabel={t('Notifications')} toastOptions={{ closeButtonAriaLabel: t('Close notification') }} />
}

function App() {
  return (
    <TenantProvider>
      <LanguageProvider>
        <ThemeInitializer />
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <OfflineNotice />
              <AppRouter />
              <AppToaster />
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </TenantProvider>
  )
}

export default App
