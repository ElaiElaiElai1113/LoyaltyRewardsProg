import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from '@/App'
import { reportMonitoringEvent } from '@/lib/monitoring'
import referenceDesignSystemHref from './reference-design-systems.css?url'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/anton/latin-400.css'
import '@fontsource/source-serif-4/latin-500.css'
import '@fontsource/source-serif-4/latin-600.css'
import '@fontsource/source-serif-4/latin-700.css'
import '@fontsource/fraunces/latin-400.css'
import '@fontsource/fraunces/latin-500.css'
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/fraunces/latin-700.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
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

const hadServiceWorkerController = Boolean(navigator.serviceWorker?.controller)
let reloadingForServiceWorkerUpdate = false

if (hadServiceWorkerController) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForServiceWorkerUpdate) return
    reloadingForServiceWorkerUpdate = true
    window.location.reload()
  })
}

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateServiceWorker(true)
  },
  onRegisteredSW(_serviceWorkerUrl, registration) {
    void registration?.update()
  },
  onRegisterError(error) {
    console.error('Service worker registration failed', error)
  },
})

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

function loadReferenceDesignSystem() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>('link[data-reference-design-system]')
    if (existing?.sheet) {
      resolve()
      return
    }

    const stylesheet = existing ?? document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = referenceDesignSystemHref
    stylesheet.dataset.referenceDesignSystem = 'true'
    stylesheet.addEventListener('load', () => resolve(), { once: true })
    stylesheet.addEventListener('error', () => reject(new Error('Reference design system could not be loaded.')), { once: true })
    if (!existing) document.head.appendChild(stylesheet)
  })
}

void loadReferenceDesignSystem().then(renderApp).catch((error) => {
  reportMonitoringEvent({
    level: 'error',
    name: 'reference_design_system_load_failed',
    message: error instanceof Error ? error.message : String(error),
  })
  renderApp()
})
