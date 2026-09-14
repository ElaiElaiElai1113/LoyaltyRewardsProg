import { describe, expect, it } from 'vitest'

import { resolveSafeInternalRedirect } from '@/lib/safe-internal-redirect'

describe('resolveSafeInternalRedirect', () => {
  it('preserves an internal offer path with query and hash state', () => {
    expect(resolveSafeInternalRedirect('/offer/welcome?source=join#claim', '/dashboard'))
      .toBe('/offer/welcome?source=join#claim')
  })

  it.each([
    'https://example.com/steal-session',
    '//example.com/steal-session',
    '/\\example.com/steal-session',
    'javascript:alert(1)',
    'offer/welcome',
    '/offer/%ZZ',
    '/offer/%E0%A4%A',
    '/offer/welcome\n?ref=member',
    '/offer/\\welcome',
    '/%2f%2fexample.com/outside',
    '/%5cexample.com/outside',
    '/offer/%00welcome',
    '/safe/..//example.com/outside',
    '/%2e%2e//example.com/outside',
  ])('rejects unsafe or non-root-relative destinations: %s', (candidate) => {
    expect(resolveSafeInternalRedirect(candidate, '/dashboard')).toBe('/dashboard')
  })
})
