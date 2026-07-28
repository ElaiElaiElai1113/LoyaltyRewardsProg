import { createHmac, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

function verifySignature(payload: string, signatureHeader: string) {
  const fields = Object.fromEntries(signatureHeader.split(',').map((part) => part.split('=', 2)))
  const timestamp = fields.t
  const signature = fields.v1
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
  const expected = createHmac('sha256', webhookSecret).update(`${timestamp}.${payload}`).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
}

async function updateSubscription(programId: string, values: Record<string, unknown>) {
  return fetch(`${supabaseUrl}/rest/v1/program_subscriptions?program_id=eq.${encodeURIComponent(programId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(values),
  })
}

async function claimEvent(eventId: string, eventType: string) {
  const result = await fetch(`${supabaseUrl}/rest/v1/stripe_webhook_events`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ id: eventId, event_type: eventType }),
  })
  if (result.status === 409) return false
  if (!result.ok) throw new Error('webhook_event_claim_failed')
  return true
}

function normalizeSubscriptionStatus(status?: string) {
  if (status === 'incomplete_expired') return 'canceled'
  if (status === 'paused') return 'past_due'
  return ['incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'].includes(status ?? '')
    ? status
    : 'incomplete'
}

export const config = { api: { bodyParser: false } }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'method_not_allowed' })
  if (!supabaseUrl || !serviceKey || !webhookSecret) return response.status(503).json({ error: 'webhook_not_configured' })

  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const payload = Buffer.concat(chunks).toString('utf8')
  const signature = String(request.headers['stripe-signature'] ?? '')
  if (!verifySignature(payload, signature)) return response.status(400).json({ error: 'invalid_signature' })

  const event = JSON.parse(payload) as {
    id: string
    type: string
    data: {
      object: {
        metadata?: { program_id?: string }
        client_reference_id?: string
        customer?: string
        subscription?: string
        id?: string
        status?: string
        current_period_start?: number
        current_period_end?: number
        cancel_at_period_end?: boolean
      }
    }
  }
  if (!(await claimEvent(event.id, event.type))) return response.status(200).json({ received: true, duplicate: true })
  const object = event.data.object
  const programId = object.metadata?.program_id ?? object.client_reference_id
  if (!programId) return response.status(200).json({ received: true })

  if (event.type === 'checkout.session.completed') {
    await updateSubscription(programId, {
      stripe_customer_id: object.customer,
      stripe_subscription_id: object.subscription,
      status: 'active',
    })
  } else if (event.type.startsWith('customer.subscription.')) {
    await updateSubscription(programId, {
      stripe_customer_id: object.customer,
      stripe_subscription_id: object.id,
      status: normalizeSubscriptionStatus(object.status),
      current_period_start: object.current_period_start ? new Date(object.current_period_start * 1000).toISOString() : null,
      current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(object.cancel_at_period_end),
    })
  }

  return response.status(200).json({ received: true })
}
