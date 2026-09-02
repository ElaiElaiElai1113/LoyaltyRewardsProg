import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.hoisted(() => vi.fn())

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc }),
}))

import handler from './validate-referral'

function responseHarness() {
  const json = vi.fn()
  const response = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json,
  } as unknown as VercelResponse
  return { response, json }
}

function request(body: Record<string, unknown>) {
  return {
    method: 'POST',
    body,
    headers: {},
  } as unknown as VercelRequest
}

describe('referral validation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns invalid without querying the database for malformed input', async () => {
    const { response, json } = responseHarness()

    await handler(request({
      referralCode: 'BAD-CODE',
      programId: 'not-a-uuid',
      kind: 'member',
    }), response)

    expect(rpc).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ valid: false })
  })

  it('uses the service-only validator and returns only its boolean result', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    const { response, json } = responseHarness()

    await handler(request({
      referralCode: 'VALID-CODE',
      programId: '10000000-0000-4000-8000-000000000003',
      businessId: '20000000-0000-4000-8000-000000000001',
      kind: 'member',
    }), response)

    expect(rpc).toHaveBeenCalledWith('validate_signup_referral', {
      p_referral_code: 'VALID-CODE',
      p_program_id: '10000000-0000-4000-8000-000000000003',
      p_business_id: '20000000-0000-4000-8000-000000000001',
      p_kind: 'member',
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ valid: true })
  })
})
