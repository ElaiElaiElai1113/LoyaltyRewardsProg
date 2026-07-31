import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveInvitationOrigin } from '../../supabase/functions/_shared/invitation-origin'
import {
  getPasswordSetupParams,
  getPasswordSetupRoute,
  getPasswordSetupType,
} from './password-setup'

describe('password setup links', () => {
  it('routes recovery and invitation fragments to separate setup screens', () => {
    expect(getPasswordSetupType('', '#type=recovery&access_token=secret')).toBe('recovery')
    expect(getPasswordSetupRoute('recovery')).toBe('/reset-password')
    expect(getPasswordSetupType('?type=invite', '#access_token=secret')).toBe('invite')
    expect(getPasswordSetupParams('?type=invite', '#access_token=secret').get('access_token')).toBe(
      'secret',
    )
    expect(getPasswordSetupRoute('invite')).toBe('/accept-invitation')
  })

  it('supports PKCE codes while ignoring unrelated auth-link types', () => {
    expect(getPasswordSetupParams('?code=one-time-code', '').get('code')).toBe('one-time-code')
    expect(getPasswordSetupType('?type=magiclink', '#type=signup')).toBeNull()
  })
})

describe('invitation origin selection', () => {
  const domains = [
    { hostname: 'www.medellinrewards.com', is_primary: true },
    { hostname: 'members.medellinrewards.com', is_primary: false },
  ]

  it('accepts only exact verified program hostnames', () => {
    expect(
      resolveInvitationOrigin('https://members.medellinrewards.com', null, domains),
    ).toBe('https://members.medellinrewards.com')
    expect(
      resolveInvitationOrigin('https://www.medellinrewards.com.evil.example', null, domains),
    ).toBe('https://www.medellinrewards.com')
    expect(resolveInvitationOrigin('javascript:alert(1)', null, domains)).toBe(
      'https://www.medellinrewards.com',
    )
  })

  it('uses a verified primary fallback and fails closed without a verified domain', () => {
    expect(resolveInvitationOrigin(null, 'https://members.medellinrewards.com', domains)).toBe(
      'https://members.medellinrewards.com',
    )
    expect(resolveInvitationOrigin(null, 'https://unrelated.example', domains)).toBe(
      'https://www.medellinrewards.com',
    )
    expect(resolveInvitationOrigin('https://medellinrewards.com', null, [])).toBeNull()
  })

  it('is wired into customer invitations and the public invitation route', () => {
    const edgeFunction = readFileSync(
      join(process.cwd(), 'supabase/functions/register-customer/index.ts'),
      'utf8',
    )
    const router = readFileSync(join(process.cwd(), 'src/routes/router.tsx'), 'utf8')

    expect(edgeFunction).toContain('resolveInvitationOrigin')
    expect(edgeFunction).toContain(".eq('verification_status', 'verified')")
    expect(edgeFunction).toContain('`${origin}/accept-invitation`')
    expect(router).toContain("path: '/accept-invitation'")
    expect(router).toContain('<ResetPasswordPage flow="invite" />')
  })

  it('exchanges an explicit setup code before trusting a persisted browser session', () => {
    const authService = readFileSync(
      join(process.cwd(), 'src/integrations/supabase/services/auth-service.ts'),
      'utf8',
    )
    const setupSession = authService.slice(
      authService.indexOf('async ensurePasswordSetupSession'),
      authService.indexOf('async ensureRecoverySession'),
    )

    expect(setupSession.indexOf('if (code)')).toBeGreaterThan(-1)
    expect(setupSession.indexOf('exchangeCodeForSession(code)')).toBeGreaterThan(
      setupSession.indexOf('if (code)'),
    )
    expect(setupSession.indexOf('exchangeCodeForSession(code)')).toBeLessThan(
      setupSession.indexOf('sb.auth.getSession()'),
    )
  })
})
