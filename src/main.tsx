import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from '@/App'
import { reportMonitoringEvent } from '@/lib/monitoring'
import './index.css'

window.addEventListener('error', (event) => {
  reportMonitoringEvent({
    level: 'error',
    name: 'window_error',
    message: event.message || 'Unhandled browser error',
    context: { filename: event.filename, line: event.lineno, column: event.colno },
  })
})

window.addEventListener('unhandledrejection', (event) => {
  reportMonitoringEvent({
    level: 'error',
    name: 'unhandled_rejection',
    message: event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'Unhandled promise rejection'),
  })
})

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateServiceWorker(true)
  },
  onRegisterError(error) {
    console.error('Service worker registration failed', error)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
