import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('./shared', () => ({
  camelCaseRow: (row: Record<string, unknown>) => row,
  requireSupabase: () => ({ auth }),
}))

vi.mock('@/features/tenant/tenant-service', () => ({
  getActiveProgram: () => ({ id: 'rewardme-program' }),
}))

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
}))

import { authService } from './auth-service'

function setBrowserLocation(search = '', hash = '', pathname = '/reset-password') {
  const replaceState = vi.fn()
  vi.stubGlobal('window', {
    location: {
      origin: 'https://loyalty-rewards-prog.vercel.app',
      href: `https://loyalty-rewards-prog.vercel.app${pathname}${search}${hash}`,
      pathname,
      search,
      hash,
    },
    history: { replaceState },
  })
  vi.stubGlobal('document', { title: 'RewardMe' })
  return replaceState
}

describe('authentication email flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.exchangeCodeForSession.mockResolvedValue({ error: null })
    auth.getSession.mockResolvedValue({ data: { session: null } })
    auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    auth.setSession.mockResolvedValue({ error: null })
    auth.updateUser.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes the recipient and uses the production recovery route', async () => {
    setBrowserLocation()

    await authService.resetPassword('  MEMBER@RewardMe.Test  ')

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('member@rewardme.test', {
      redirectTo: 'https://loyalty-rewards-prog.vercel.app/reset-password',
    })
  })

  it('establishes a recovery session from fragment tokens and removes them from the URL', async () => {
    const replaceState = setBrowserLocation(
      '',
      '#type=recovery&access_token=access-secret&refresh_token=refresh-secret',
    )

    await expect(authService.ensurePasswordSetupSession('recovery')).resolves.toBe(true)
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'access-secret',
      refresh_token: 'refresh-secret',
    })
    expect(replaceState).toHaveBeenCalledWith({}, 'RewardMe', '/reset-password')
  })

  it('exchanges a PKCE code before consulting a persisted browser session', async () => {
    setBrowserLocation('?code=one-time-code')

    await expect(authService.ensurePasswordSetupSession('recovery')).resolves.toBe(true)
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('one-time-code')
    expect(auth.getSession).not.toHaveBeenCalled()
  })

  it('rejects an invitation token on the recovery screen without creating a session', async () => {
    setBrowserLocation(
      '?type=invite',
      '#access_token=access-secret&refresh_token=refresh-secret',
    )

    await expect(authService.ensurePasswordSetupSession('recovery')).rejects.toThrow(
      'This authentication link is for a different password flow.',
    )
    expect(auth.setSession).not.toHaveBeenCalled()
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('updates the password only through the authenticated Supabase session', async () => {
    await authService.updatePassword('Rewards 123!')
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'Rewards 123!' })
  })
})
