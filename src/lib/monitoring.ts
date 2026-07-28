type MonitoringEvent = {
  level: 'error' | 'warning' | 'info'
  name: string
  message: string
  context?: Record<string, unknown>
}

const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT as string | undefined

export function reportMonitoringEvent(event: MonitoringEvent) {
  const payload = {
    ...event,
    occurredAt: new Date().toISOString(),
    release: import.meta.env.VITE_APP_RELEASE ?? 'development',
    hostname: window.location.hostname,
    path: window.location.pathname,
    tenant: new URLSearchParams(window.location.search).get('tenant'),
  }

  if (event.level === 'error') console.error('[monitoring]', payload)
  else if (event.level === 'warning') console.warn('[monitoring]', payload)
  else console.info('[monitoring]', payload)

  if (!endpoint) return
  const body = JSON.stringify(payload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
}
