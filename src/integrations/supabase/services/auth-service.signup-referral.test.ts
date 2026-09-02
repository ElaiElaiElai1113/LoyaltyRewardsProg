import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
}))
vi.mock('./shared', () => ({
  camelCaseRow: (row: Record<string, unknown>) => row,
  requireSupabase: () => ({ auth }),
}))

vi.mock('@/features/tenant/tenant-service', () => ({
  getActiveProgram: () => ({ id: '10000000-0000-4000-8000-000000000003' }),
}))

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
}))

import { authService, INVALID_REFERRAL_CODE_MESSAGE } from './auth-service'

const signUpValues = {
  fullName: 'New Member',
  email: 'new.member@example.com',
  phone: '+1 555 010 1111',
  password: 'Rewards 123!',
  role: 'customer' as const,
}

describe('signup referral validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'stop after signup request' },
    })
  })

  it('blocks an invalid member referral before creating an auth user', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ valid: false }), { status: 200 }))

    await expect(authService.signUp({
      ...signUpValues,
      referralCode: 'NOT-A-REAL-CODE',
    })).rejects.toThrow(INVALID_REFERRAL_CODE_MESSAGE)

    expect(fetch).toHaveBeenCalledWith('/api/validate-referral', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        referralCode: 'NOT-A-REAL-CODE',
        programId: '10000000-0000-4000-8000-000000000003',
        businessId: null,
        kind: 'member',
      }),
    }))
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('passes a valid tenant referral into the server-enforced signup metadata', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ valid: true }), { status: 200 }))

    await expect(authService.signUp({
      ...signUpValues,
      referralCode: '  valid-code  ',
      referralBusinessId: '20000000-0000-4000-8000-000000000001',
    })).rejects.toThrow('stop after signup request')

    expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({
        data: expect.objectContaining({
          referral_code: 'valid-code',
          referral_business_id: '20000000-0000-4000-8000-000000000001',
        }),
      }),
    }))
  })

  it('requires a valid business id for a partner referral', async () => {
    await expect(authService.signUp({
      ...signUpValues,
      partnerReferralCode: 'PARTNER-CODE',
      partnerBusinessId: 'not-a-uuid',
    })).rejects.toThrow(INVALID_REFERRAL_CODE_MESSAGE)

    expect(fetch).not.toHaveBeenCalled()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('allows an ordinary signup to continue without a referral lookup', async () => {
    await expect(authService.signUp(signUpValues)).rejects.toThrow('stop after signup request')

    expect(fetch).not.toHaveBeenCalled()
    expect(auth.signUp).toHaveBeenCalledOnce()
  })
})
