import type { VercelRequest, VercelResponse } from '@vercel/node'

const rewardMeProgramId = '10000000-0000-4000-8000-000000000004'
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
const publicSiteUrl = process.env.VITE_PUBLIC_SITE_URL ?? ''
const billingEnabled = process.env.REWARDME_MEMBER_BILLING_ENABLED === 'true'

const priceByTier = {
  regular: process.env.REWARDME_REGULAR_STRIPE_PRICE_ID ?? '',
  gold: process.env.REWARDME_GOLD_STRIPE_PRICE_ID ?? '',
} as const

function configuredOrigin() {
  try {
    const url = new URL(publicSiteUrl)
    const isLocal = url.hostname === 'localhost' || url.hostname.startsWith('127.')
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) return null
    return url.origin
  } catch {
    return null
  }
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'method_not_allowed' })
  const origin = configuredOrigin()
  if (!billingEnabled || !supabaseUrl || !serviceKey || !stripeKey || !origin) {
    return response.status(503).json({ error: 'member_billing_not_configured' })
  }

  const tier = String(request.body?.tier ?? '') as keyof typeof priceByTier
  const requestId = String(request.body?.requestId ?? '')
  if (!(tier in priceByTier) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return response.status(400).json({ error: 'invalid_checkout_request' })
  }
  const priceId = priceByTier[tier]
  if (!priceId) return response.status(503).json({ error: 'member_price_not_configured' })

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return response.status(401).json({ error: 'authentication_required' })
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  })
  if (!userResponse.ok) return response.status(401).json({ error: 'invalid_session' })
  const user = await userResponse.json() as { id: string; email?: string }

  const [programResponse, membershipResponse, billingProfileResponse] = await Promise.all([
    supabaseRequest(`programs?id=eq.${rewardMeProgramId}&slug=eq.pinas&status=eq.active&select=id,feature_flags`),
    supabaseRequest(`program_memberships?program_id=eq.${rewardMeProgramId}&profile_id=eq.${encodeURIComponent(user.id)}&role=eq.member&status=eq.active&select=id`),
    supabaseRequest(`memberships?program_id=eq.${rewardMeProgramId}&profile_id=eq.${encodeURIComponent(user.id)}&select=stripe_customer_id`),
  ])
  const programs = await programResponse.json() as Array<{ feature_flags?: Record<string, boolean> }>
  const memberships = await membershipResponse.json() as unknown[]
  const billingProfiles = await billingProfileResponse.json() as Array<{ stripe_customer_id?: string | null }>
  if (!programResponse.ok || programs[0]?.feature_flags?.memberBilling !== true) {
    return response.status(503).json({ error: 'member_billing_not_enabled' })
  }
  if (!membershipResponse.ok || memberships.length === 0) {
    return response.status(403).json({ error: 'rewardme_membership_required' })
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/membership?billing=success`,
    cancel_url: `${origin}/membership?billing=canceled`,
    client_reference_id: user.id,
    'metadata[program_id]': rewardMeProgramId,
    'metadata[profile_id]': user.id,
    'metadata[membership_tier]': tier,
    'subscription_data[metadata][program_id]': rewardMeProgramId,
    'subscription_data[metadata][profile_id]': user.id,
    'subscription_data[metadata][membership_tier]': tier,
  })
  const stripeCustomerId = billingProfiles[0]?.stripe_customer_id
  if (stripeCustomerId) params.set('customer', stripeCustomerId)
  else if (user.email) params.set('customer_email', user.email)

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `rewardme:${user.id}:${tier}:${requestId}`,
    },
    body: params,
  })
  const checkout = await stripeResponse.json() as { url?: string }
  if (!stripeResponse.ok || !checkout.url) return response.status(502).json({ error: 'stripe_checkout_failed' })
  return response.status(200).json({ url: checkout.url })
}
