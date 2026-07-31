import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'
import { createTransport } from 'nodemailer'
import { buildTenantEmail, type TenantEmailBrand } from './_tenant-email-templates.js'

type WelcomeEmailRequest = {
  fullName?: unknown
  email?: unknown
  hostname?: unknown
}

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

type ResolvedTenantEmailBrand = TenantEmailBrand & {
  emailFromName: string
  emailFromAddress: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const hostnamePattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
const burstWindowMs = 10 * 60 * 1000
const burstLimit = 5
const requestBursts = new Map<string, number[]>()

class WelcomeEmailAuthorizationError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'WelcomeEmailAuthorizationError'
    this.status = status
  }
}

function sendJson(response: VercelResponse, status: number, body: Record<string, unknown>) {
  response.setHeader('Cache-Control', 'no-store')
  response.status(status).json(body)
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeHostname(value: string | undefined) {
  const candidate = value?.trim().toLowerCase() ?? ''
  if (!candidate || candidate.includes(',') || candidate.includes('/') || candidate.includes('@')) {
    return null
  }

  try {
    const parsed = new URL(`https://${candidate}`)
    if (parsed.port && parsed.port !== '443') return null
    return hostnamePattern.test(parsed.hostname) ? parsed.hostname : null
  } catch {
    return null
  }
}

function requestOriginMatchesHostname(request: VercelRequest, hostname: string) {
  const origin = firstHeader(request.headers.origin)
  if (!origin) return true

  try {
    const parsed = new URL(origin)
    return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === hostname
  } catch {
    return false
  }
}

function requestFingerprint(request: VercelRequest) {
  const forwardedFor = firstHeader(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
  const address = forwardedFor || request.socket.remoteAddress || 'unknown'
  return createHash('sha256').update(address).digest('hex')
}

function consumeBurstAllowance(fingerprint: string) {
  const now = Date.now()
  const recent = (requestBursts.get(fingerprint) ?? []).filter(
    (timestamp) => timestamp > now - burstWindowMs,
  )

  if (recent.length >= burstLimit) {
    requestBursts.set(fingerprint, recent)
    return false
  }

  recent.push(now)
  requestBursts.set(fingerprint, recent)

  if (requestBursts.size > 5_000) {
    for (const [key, timestamps] of requestBursts) {
      if (!timestamps.some((timestamp) => timestamp > now - burstWindowMs)) {
        requestBursts.delete(key)
      }
    }
  }

  return true
}

function parseRequestBody(body: unknown): WelcomeEmailRequest {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as WelcomeEmailRequest
    } catch {
      return {}
    }
  }

  if (body && typeof body === 'object') {
    return body as WelcomeEmailRequest
  }

  return {}
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const portValue = process.env.SMTP_PORT
  const secureValue = process.env.SMTP_SECURE
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !portValue || !secureValue || !user || !pass) {
    return null
  }

  const port = Number(portValue)

  if (!Number.isInteger(port) || port <= 0) {
    return null
  }

  return {
    host,
    port,
    secure: secureValue.toLowerCase() === 'true',
    user,
    pass,
  }
}

async function authorizeWelcomeEmail(
  hostname: string,
  email: string,
): Promise<ResolvedTenantEmailBrand> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Tenant email brand resolution is not configured.')
  }

  const result = await fetch(`${url}/rest/v1/rpc/authorize_early_access_welcome_email`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_hostname: hostname, p_email: email }),
  })
  const payload = await result.json().catch(() => null) as unknown
  const rows = Array.isArray(payload) ? payload as Array<{
    name?: string
    support_email?: string
    primary_color?: string
    accent_color?: string
    email_from_name?: string
    email_from_address?: string
  }> : []
  const row = rows[0]

  if (!result.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message?: unknown }).message ?? '')
      : ''
    throw new WelcomeEmailAuthorizationError(
      message.includes('welcome_email_rate_limited')
        ? 'Welcome email request rate limit reached.'
        : 'Welcome email request was not authorized.',
      message.includes('welcome_email_rate_limited') ? 429 : 403,
    )
  }

  if (
    !row?.name?.trim()
    || !row.support_email?.trim()
    || !row.primary_color?.trim()
    || !row.accent_color?.trim()
    || !row.email_from_address?.trim()
    || !emailPattern.test(row.email_from_address.trim())
  ) {
    throw new WelcomeEmailAuthorizationError(
      'No active verified tenant email brand is configured for this hostname.',
      403,
    )
  }

  return {
    name: row.name.trim(),
    hostname,
    supportEmail: row.support_email.trim(),
    primaryColor: row.primary_color.trim(),
    accentColor: row.accent_color.trim(),
    emailFromName: row.email_from_name?.trim() || row.name.trim(),
    emailFromAddress: row.email_from_address.trim(),
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const body = parseRequestBody(request.body)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const requestHostname = normalizeHostname(firstHeader(request.headers.host))
  const suppliedHostname = typeof body.hostname === 'string'
    ? normalizeHostname(body.hostname)
    : requestHostname

  if (!emailPattern.test(email) || email.length > 254) {
    sendJson(response, 400, { ok: false, error: 'Valid email is required' })
    return
  }

  if (fullName.length > 120) {
    sendJson(response, 400, { ok: false, error: 'Name is too long' })
    return
  }

  if (!requestHostname || !suppliedHostname || suppliedHostname !== requestHostname) {
    sendJson(response, 400, { ok: false, error: 'Verified tenant hostname is required' })
    return
  }

  if (!requestOriginMatchesHostname(request, requestHostname)) {
    sendJson(response, 403, { ok: false, error: 'Request origin is not allowed' })
    return
  }

  const fingerprint = requestFingerprint(request)
  if (!consumeBurstAllowance(fingerprint)) {
    sendJson(response, 429, { ok: false, error: 'Too many email requests. Try again later.' })
    return
  }

  const smtpConfig = getSmtpConfig()

  if (!smtpConfig) {
    console.error('Welcome email SMTP configuration is missing or invalid.')
    sendJson(response, 500, { ok: false, error: 'Email service is not configured' })
    return
  }

  try {
    const brand = await authorizeWelcomeEmail(requestHostname, email)
    const content = buildTenantEmail({ kind: 'welcome', brand, recipientName: fullName })
    const transporter = createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    })

    await transporter.sendMail({
      from: `${brand.emailFromName} <${brand.emailFromAddress}>`,
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    })

    sendJson(response, 200, { ok: true })
  } catch (error) {
    if (error instanceof WelcomeEmailAuthorizationError) {
      sendJson(response, error.status, { ok: false, error: error.message })
      return
    }

    console.error('Failed to send early access welcome email.', {
      recipientHash: createHash('sha256').update(email).digest('hex'),
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    sendJson(response, 502, { ok: false, error: 'Unable to send welcome email' })
  }
}
