import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { applyRequestContext } from './_request-context.js'

type ReferralValidationRequest = {
  referralCode?: unknown
  programId?: unknown
  businessId?: unknown
  kind?: unknown
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseBody(body: unknown): ReferralValidationRequest {
  if (body && typeof body === 'object') return body as ReferralValidationRequest
  if (typeof body !== 'string') return {}
  try {
    return JSON.parse(body) as ReferralValidationRequest
  } catch {
    return {}
  }
}

function cleanString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function json(response: VercelResponse, status: number, body: Record<string, unknown>) {
  response.status(status).json(body)
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const requestId = applyRequestContext(request, response)
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    json(response, 405, { valid: false, error: 'Method not allowed' })
    return
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    console.error('Referral validation Supabase configuration is missing.', { requestId })
    json(response, 500, { valid: false, error: 'Referral validation is not configured.' })
    return
  }

  const body = parseBody(request.body)
  const referralCode = cleanString(body.referralCode, 120)
  const programId = cleanString(body.programId, 36)
  const businessId = cleanString(body.businessId, 36)
  const kind = cleanString(body.kind, 12)
  if (
    !referralCode
    || !UUID_PATTERN.test(programId)
    || (businessId && !UUID_PATTERN.test(businessId))
    || !['member', 'partner'].includes(kind)
    || (kind === 'partner' && !businessId)
  ) {
    json(response, 200, { valid: false })
    return
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.rpc('validate_signup_referral', {
    p_referral_code: referralCode,
    p_program_id: programId,
    p_business_id: businessId || null,
    p_kind: kind,
  })

  if (error) {
    console.error('Referral validation failed.', { requestId, message: error.message })
    json(response, 502, { valid: false, error: 'Referral validation is temporarily unavailable.' })
    return
  }

  json(response, 200, { valid: data === true })
}
