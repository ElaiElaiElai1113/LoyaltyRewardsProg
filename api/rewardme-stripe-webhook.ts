import type { VercelRequest, VercelResponse } from '@vercel/node'

import { verifyStripeSignature } from './_stripe-signature.js'

const rewardMeProgramId = '10000000-0000-4000-8000-000000000004'
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const webhookSecret = process.env.REWARDME_STRIPE_WEBHOOK_SECRET ?? ''

type MembershipTier = 'regular' | 'gold'

function normalizeStatus(status?: string) {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due' || status === 'paused') return 'past_due'
  if (status === 'unpaid') return 'unpaid'
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled'
  return 'pending'
}

async function databaseRequest(path: string, init: RequestInit) {
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

async function claimEvent(eventId: string, eventType: string, programId: string, profileId: string) {
  const result = await databaseRequest('stripe_member_webhook_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ id: eventId, event_type: eventType, program_id: programId, profile_id: profileId }),
  })
  if (result.status === 409) return false
  if (!result.ok) throw new Error('member_webhook_event_claim_failed')
  return true
}

async function releaseEvent(eventId: string) {
  await databaseRequest(`stripe_member_webhook_events?id=eq.${encodeURIComponent(eventId)}`, { method: 'DELETE' })
}

async function upsertMembership(values: Record<string, unknown>) {
  const result = await databaseRequest('memberships?on_conflict=program_id,profile_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(values),
  })
  if (!result.ok) throw new Error('member_subscription_update_failed')
}

export const config = { api: { bodyParser: false } }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'method_not_allowed' })
  if (!supabaseUrl || !serviceKey || !webhookSecret) return response.status(503).json({ error: 'webhook_not_configured' })

  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const payload = Buffer.concat(chunks).toString('utf8')
  const signature = String(request.headers['stripe-signature'] ?? '')
  if (!verifyStripeSignature(payload, signature, webhookSecret)) return response.status(400).json({ error: 'invalid_signature' })

  let event: {
    id: string
    type: string
    data: { object: Record<string, unknown> & { metadata?: Record<string, string> } }
  }
  try {
    event = JSON.parse(payload) as typeof event
  } catch {
    return response.status(400).json({ error: 'invalid_payload' })
  }

  if (event.type !== 'checkout.session.completed' && !event.type.startsWith('customer.subscription.')) {
    return response.status(200).json({ received: true, ignored: true })
  }

  const object = event.data.object
  const metadata = object.metadata ?? {}
  const programId = metadata.program_id
  const profileId = metadata.profile_id ?? (event.type === 'checkout.session.completed' ? String(object.client_reference_id ?? '') : '')
  const tier = metadata.membership_tier as MembershipTier
  if (programId !== rewardMeProgramId || !profileId || !['regular', 'gold'].includes(tier)) {
    return response.status(200).json({ received: true, ignored: true })
  }

  if (!(await claimEvent(event.id, event.type, programId, profileId))) {
    return response.status(200).json({ received: true, duplicate: true })
  }

  try {
    const isCheckout = event.type === 'checkout.session.completed'
    const periodStart = Number(object.current_period_start ?? 0)
    const periodEnd = Number(object.current_period_end ?? 0)
    await upsertMembership({
      program_id: programId,
      profile_id: profileId,
      status: isCheckout ? 'pending' : normalizeStatus(String(object.status ?? '')),
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString(),
      cancel_at_period_end: Boolean(object.cancel_at_period_end),
      price_cents: tier === 'regular' ? 2500 : 10000,
      currency: 'USD',
      tier,
      provider: 'stripe',
      provider_status: isCheckout ? 'checkout_completed' : String(object.status ?? 'unknown'),
      provider_subscription_id: String((isCheckout ? object.subscription : object.id) ?? ''),
      stripe_customer_id: String(object.customer ?? ''),
    })
  } catch {
    await releaseEvent(event.id)
    return response.status(500).json({ error: 'member_webhook_processing_failed' })
  }

  return response.status(200).json({ received: true })
}
