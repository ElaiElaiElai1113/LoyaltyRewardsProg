import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, describe, expect, it, vi } from 'vitest'

function responseRecorder() {
  let statusCode = 200
  let payload: unknown
  const response = {
    status(code: number) {
      statusCode = code
      return response
    },
    json(body: unknown) {
      payload = body
      return response
    },
  } as unknown as VercelResponse

  return {
    response,
    result: () => ({ statusCode, payload }),
  }
}

function request(values: Partial<VercelRequest>) {
  return values as VercelRequest
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('RewardMe member checkout release gates', () => {
  it('rejects unsupported methods before doing any work', async () => {
    const { default: handler } = await import('./rewardme-create-checkout-session.js')
    const recorder = responseRecorder()

    await handler(request({ method: 'GET' }), recorder.response)

    expect(recorder.result()).toEqual({ statusCode: 405, payload: { error: 'method_not_allowed' } })
  })

  it('fails closed while member billing is disabled', async () => {
    vi.stubEnv('REWARDME_MEMBER_BILLING_ENABLED', 'false')
    const { default: handler } = await import('./rewardme-create-checkout-session.js')
    const recorder = responseRecorder()

    await handler(request({ method: 'POST', body: {} }), recorder.response)

    expect(recorder.result()).toEqual({
      statusCode: 503,
      payload: { error: 'member_billing_not_configured' },
    })
  })

  it('rejects malformed checkout requests before contacting Stripe', async () => {
    vi.stubEnv('REWARDME_MEMBER_BILLING_ENABLED', 'true')
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-test-key')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_rewardme')
    vi.stubEnv('VITE_PUBLIC_SITE_URL', 'https://loyalty-rewards-prog.vercel.app')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { default: handler } = await import('./rewardme-create-checkout-session.js')
    const recorder = responseRecorder()

    await handler(request({ method: 'POST', body: { tier: 'regular', requestId: 'not-a-uuid' } }), recorder.response)

    expect(recorder.result()).toEqual({
      statusCode: 400,
      payload: { error: 'invalid_checkout_request' },
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

describe('RewardMe Stripe webhook release gates', () => {
  it('rejects unsupported methods before reading a request body', async () => {
    const { default: handler } = await import('./rewardme-stripe-webhook.js')
    const recorder = responseRecorder()

    await handler(request({ method: 'GET' }), recorder.response)

    expect(recorder.result()).toEqual({ statusCode: 405, payload: { error: 'method_not_allowed' } })
  })

  it('fails closed without its server-only configuration', async () => {
    const { default: handler } = await import('./rewardme-stripe-webhook.js')
    const recorder = responseRecorder()

    await handler(request({ method: 'POST' }), recorder.response)

    expect(recorder.result()).toEqual({
      statusCode: 503,
      payload: { error: 'webhook_not_configured' },
    })
  })

  it('rejects an unsigned payload before changing membership data', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-test-key')
    vi.stubEnv('REWARDME_STRIPE_WEBHOOK_SECRET', 'whsec_rewardme')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { default: handler } = await import('./rewardme-stripe-webhook.js')
    const recorder = responseRecorder()
    const webhookRequest = {
      method: 'POST',
      headers: {},
      async *[Symbol.asyncIterator]() {
        yield Buffer.from('{"id":"evt_unsigned"}')
      },
    }

    await handler(request(webhookRequest as Partial<VercelRequest>), recorder.response)

    expect(recorder.result()).toEqual({ statusCode: 400, payload: { error: 'invalid_signature' } })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
