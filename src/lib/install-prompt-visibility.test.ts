import { describe, expect, it } from 'vitest'

import { isInstallPromptEligiblePath } from '@/lib/install-prompt-visibility'

describe('install prompt visibility', () => {
  it('allows the prompt on public landing pages', () => {
    expect(isInstallPromptEligiblePath('/')).toBe(true)
    expect(isInstallPromptEligiblePath('/landing-page')).toBe(true)
    expect(isInstallPromptEligiblePath('/landing-page/')).toBe(true)
  })

  it.each([
    '/signin',
    '/join',
    '/reset-password',
    '/auth/confirm',
    '/accept-invitation',
    '/agreements/required',
    '/business/apply/commission',
    '/business/apply/credit',
    '/dashboard',
    '/business/dashboard',
    '/admin/portal',
  ])('defers the prompt on actionable route %s', (pathname) => {
    expect(isInstallPromptEligiblePath(pathname)).toBe(false)
  })
})
