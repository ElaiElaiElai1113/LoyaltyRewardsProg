import { describe, expect, it } from 'vitest'

import { auditEnvironmentNames, extractEnvironmentNames } from '../../scripts/audit-vercel-environment.mjs'

describe('Vercel production environment audit', () => {
  it('accepts the CLI environment payload without reading values', () => {
    const names = extractEnvironmentNames({
      envs: [
        { key: 'VITE_SUPABASE_URL', value: 'not-inspected' },
        { key: 'VITE_SUPABASE_ANON_KEY', value: 'not-inspected' },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', value: 'not-inspected' },
      ],
    })

    expect(auditEnvironmentNames(names).missingSupabase).toEqual([])
  })

  it('reports missing server configuration by name', () => {
    const result = auditEnvironmentNames(new Set(['VITE_SUPABASE_URL']))

    expect(result.missingSupabase).toEqual(['VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])
    expect(result.missingSmtp).toContain('SMTP_PASS')
  })
})
