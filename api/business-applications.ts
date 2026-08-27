import { randomBytes } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { applyRequestContext } from './_request-context.js'
import { resolveTenantDatabaseHostname } from './_tenant-host-alias.js'

type Payload = Record<string, unknown>
const models = new Set(['commission', 'credit'])
const rewardRates = new Set(['20% back', '30% back', '50% back', '100% back', 'Other — discuss with the team'])
const accessOptions = new Set(['earn-and-redeem', 'earn-only'])

function clean(body: Payload, key: string, max: number) {
  return typeof body[key] === 'string' ? body[key].trim().slice(0, max) : ''
}

function required(value: string, label: string, min = 1) {
  if (value.length < min) throw new Error(`${label} is required.`)
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

function reference() {
  return `RWD-BIZ-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
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

  const body = parse(request.body)
  const model = clean(body, 'model', 20)
  const hostname = clean(body, 'hostname', 253).toLowerCase()
  if (!models.has(model) || body.contactConsent !== true) {
    json(response, 400, { ok: false, error: 'Choose a valid model and accept the application disclosures.' })
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
      throw new Error('Enter a valid email, reward rate, and member access option.')
    }

    const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const databaseHostname = resolveTenantDatabaseHostname(hostname)
    const { data: programs, error: programError } = await supabase.rpc('resolve_program_by_hostname', { p_hostname: databaseHostname })
    const program = Array.isArray(programs) ? programs[0] : null
    if (programError || !program?.id || !['pinas', 'rewardme', 'wondertown'].includes(String(program.slug))) {
      json(response, 404, { ok: false, error: 'The rewards program was not found.' })
      return
    }

    const applicationReference = reference()
    const { error } = await supabase.from('business_applications').insert({
      program_id: program.id,
      application_reference: applicationReference,
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
      disclosure_version: clean(body, 'disclosureVersion', 80) || 'business-application-v1',
      contact_consent_at: new Date().toISOString(),
      source_hostname: databaseHostname,
    })
    if (error) throw error
    json(response, 201, { ok: true, reference: applicationReference })
  } catch (error) {
    console.error('Business application submission failed.', { requestId, message: error instanceof Error ? error.message : 'Unknown error' })
    const message = error instanceof Error && !('code' in error) ? error.message : 'The application could not be submitted.'
    json(response, 400, { ok: false, error: message })
  }
}
