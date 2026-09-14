import { createHmac } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { applyRequestContext } from './_request-context.js'
import { resolveTenantDatabaseHostname } from './_tenant-host-alias.js'

type Payload = Record<string, unknown>
class ValidationError extends Error {}
const models = new Set(['commission', 'credit'])
const rewardRates = new Set(['20% back', '30% back', '50% back', '100% back', 'Other — discuss with the team'])
const accessOptions = new Set(['earn-and-redeem', 'earn-only'])

function clean(body: Payload, key: string, max: number) {
  return typeof body[key] === 'string' ? body[key].trim().slice(0, max) : ''
}

function required(value: string, label: string, min = 1) {
  if (value.length < min) throw new ValidationError(`${label} is required.`)
  return value
}

function json(response: VercelResponse, status: number, body: Payload) {
  response.status(status).json(body)
}

function parse(body: unknown): Payload {
  if (body && typeof body === 'object') return body as Payload
  if (typeof body !== 'string') return {}
  try { return JSON.parse(body) as Payload } catch { return {} }
}

const applicationHosts: Readonly<Record<string,string>> = {
 'myrewardme.com':'pinas','www.myrewardme.com':'pinas','rewardme-prod.vercel.app':'pinas','loyalty-rewards-prog.vercel.app':'pinas','wondertown-rewards.vercel.app':'wondertown',
}


export default async function handler(request: VercelRequest, response: VercelResponse) {
  const requestId = applyRequestContext(request, response)
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    json(response, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    console.error('Business application Supabase configuration is missing.', { requestId })
    json(response, 500, { ok: false, error: 'Business applications are not configured.' })
    return
  }

  const rateSecret = process.env.BUSINESS_APPLICATION_RATE_LIMIT_SECRET
  const hourlyLimit = Number(process.env.BUSINESS_APPLICATION_HOURLY_LIMIT ?? 10)
  if (!rateSecret || !Number.isInteger(hourlyLimit) || hourlyLimit < 1 || hourlyLimit > 100) {
    json(response, 503, {ok:false,error:'Business application intake is temporarily unavailable.'}); return
  }
  const body = parse(request.body)
  const model = clean(body, 'model', 20)
  const hostname = clean(body, 'hostname', 253).toLowerCase()
  const actualHost = typeof request.headers.host === 'string' ? request.headers.host.toLowerCase() : ''
  const expectedSlug = applicationHosts[actualHost]
  if (!expectedSlug || hostname !== actualHost || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(body.requestId ?? '')) || body.disclosureVersion !== 'application-review-v1' || !models.has(model) || body.contactConsent !== true) {
    json(response, 400, { ok: false, noCommit: true, error: 'Choose a valid model and accept the application disclosures.' })
    return
  }

  try {
    const legalName = required(clean(body, 'legalName', 140), 'Legal business name', 2)
    const industry = required(clean(body, 'industry', 100), 'Industry', 2)
    const street = required(clean(body, 'street', 180), 'Street address', 2)
    const city = required(clean(body, 'city', 100), 'City', 2)
    const region = required(clean(body, 'region', 100), 'State or province', 2)
    const postal = required(clean(body, 'postal', 30), 'Postal code')
    const country = required(clean(body, 'country', 100), 'Country', 2)
    const representativeName = required(clean(body, 'representativeName', 100), 'Representative name', 2)
    const representativeTitle = required(clean(body, 'representativeTitle', 100), 'Representative title', 2)
    const representativeEmail = required(clean(body, 'representativeEmail', 160).toLowerCase(), 'Representative email', 5)
    const representativePhone = required(clean(body, 'representativePhone', 50), 'Representative phone', 7)
    const rewardRate = clean(body, 'rewardRate', 60)
    const redemptionAccess = clean(body, 'redemptionAccess', 30)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representativeEmail) || !rewardRates.has(rewardRate) || !accessOptions.has(redemptionAccess)) {
      throw new ValidationError('Enter a valid email, reward rate, and member access option.')
    }

    const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const databaseHostname = resolveTenantDatabaseHostname(hostname)
    const { data: programs, error: programError } = await supabase.rpc('resolve_program_by_hostname', { p_hostname: databaseHostname })
    const program = Array.isArray(programs) ? programs[0] : null
    if (programError || !program?.id || String(program.slug) !== expectedSlug) {
      json(response, 404, { ok: false, error: 'The rewards program was not found.' })
      return
    }

    const payload = {
      model,
      legal_name: legalName,
      dba: clean(body, 'dba', 140) || null,
      industry,
      street,
      city,
      region,
      postal,
      country,
      website: clean(body, 'website', 200) || null,
      off_peak: clean(body, 'offPeak', 160) || null,
      representative_name: representativeName,
      representative_title: representativeTitle,
      representative_email: representativeEmail,
      representative_phone: representativePhone,
      reward_rate: rewardRate,
      redemption_access: redemptionAccess,
      credit_method: model === 'credit' ? clean(body, 'creditMethod', 180) || null : null,
      disclosure_version: 'application-review-v1',
      contact_consent: true,
      source_hostname: databaseHostname,
    }
    // Vercel supplies this header; do not use user-controlled forwarding chains.
    const source = typeof request.headers['x-vercel-forwarded-for'] === 'string' ? request.headers['x-vercel-forwarded-for'] : request.socket?.remoteAddress ?? 'unknown'
    const {data: receipt,error} = await supabase.rpc('submit_business_application_intent', {
      p_program_id:program.id,p_request_id:body.requestId,p_payload:payload,
      p_source_hash:createHmac('sha256',rateSecret).update(source).digest('hex'),p_hourly_limit:hourlyLimit,
    })
    if(error){
      if(error.code==='BA409'){json(response,409,{ok:false,error:'This request was already submitted with different details. Restore the original application to check its receipt.'});return}
      if(error.code==='BA429'){json(response,429,{ok:false,error:'Too many applications. Please try again later.'});return}
      json(response,503,{ok:false,error:'The application could not be confirmed. Retry with the same details.'});return
    }
    if(!receipt?.reference || !receipt?.status){json(response,503,{ok:false,error:'The application could not be confirmed. Retry with the same details.'});return}
    json(response, receipt.replayed ? 200 : 201, {ok:true,reference:receipt.reference,status:receipt.status})
  } catch (error) {
    console.error('Business application submission failed.', { requestId, message: error instanceof Error ? error.message : 'Unknown error' })
    const definitive = error instanceof ValidationError
    json(response, definitive ? 400 : 503, {ok:false,noCommit:definitive,error:definitive ? error.message : 'The application could not be confirmed. Retry with the same details.'})
  }
}
