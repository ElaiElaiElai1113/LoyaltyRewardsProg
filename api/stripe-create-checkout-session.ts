import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''

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
  if (!supabaseUrl || !serviceKey || !stripeKey) return response.status(503).json({ error: 'billing_not_configured' })

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return response.status(401).json({ error: 'authentication_required' })
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  })
  if (!userResponse.ok) return response.status(401).json({ error: 'invalid_session' })
  const user = await userResponse.json() as { id: string; email?: string }

  const programId = String(request.body?.programId ?? '')
  const membershipResponse = await supabaseRequest(
    `program_memberships?program_id=eq.${encodeURIComponent(programId)}&profile_id=eq.${encodeURIComponent(user.id)}&role=eq.program-admin&status=eq.active&select=id`,
  )
  const memberships = await membershipResponse.json() as unknown[]
  const platformAdminResponse = await supabaseRequest(
    `profiles?id=eq.${encodeURIComponent(user.id)}&role=eq.platform-admin&select=id`,
  )
  const platformAdmins = await platformAdminResponse.json() as unknown[]
  if (!membershipResponse.ok || (memberships.length === 0 && platformAdmins.length === 0)) {
    return response.status(403).json({ error: 'program_admin_required' })
  }

  const subscriptionResponse = await supabaseRequest(
    `program_subscriptions?program_id=eq.${encodeURIComponent(programId)}&select=id,stripe_customer_id,subscription_plans(stripe_price_id)`,
  )
  const subscriptions = await subscriptionResponse.json() as Array<{
    id: string
    stripe_customer_id: string | null
    subscription_plans: { stripe_price_id: string | null } | Array<{ stripe_price_id: string | null }>
  }>
  const subscription = subscriptions[0]
  const plan = Array.isArray(subscription?.subscription_plans) ? subscription.subscription_plans[0] : subscription?.subscription_plans
  if (!plan?.stripe_price_id) return response.status(409).json({ error: 'stripe_price_not_configured' })

  const origin = String(request.body?.origin ?? '').replace(/\/+$/, '')
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': plan.stripe_price_id,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/admin/programs?billing=success`,
    cancel_url: `${origin}/admin/programs?billing=canceled`,
    client_reference_id: programId,
    'metadata[program_id]': programId,
    'subscription_data[metadata][program_id]': programId,
  })
  if (subscription.stripe_customer_id) params.set('customer', subscription.stripe_customer_id)
  else if (user.email) params.set('customer_email', user.email)

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  const checkout = await stripeResponse.json() as { url?: string; error?: { message?: string } }
  if (!stripeResponse.ok || !checkout.url) return response.status(502).json({ error: checkout.error?.message ?? 'stripe_checkout_failed' })
  return response.status(200).json({ url: checkout.url })
}
