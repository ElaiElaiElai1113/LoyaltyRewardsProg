import type { VercelRequest, VercelResponse } from '@vercel/node'
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
  from: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sendJson(response: VercelResponse, status: number, body: Record<string, unknown>) {
  response.status(status).json(body)
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
  const from = process.env.SMTP_FROM

  if (!host || !portValue || !secureValue || !user || !pass || !from) {
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
    from,
  }
}

async function resolveEmailBrand(hostname: string): Promise<TenantEmailBrand> {
  const fallback = {
    name: 'Medellin Rewards',
    hostname: 'medellinrewards.com',
    supportEmail: 'support@medellinrewards.com',
    primaryColor: '#24190f',
    accentColor: '#f2c978',
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !hostname) return fallback
  try {
    const result = await fetch(`${url}/rest/v1/rpc/resolve_program_email_brand`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_hostname: hostname }),
    })
    const rows = await result.json() as Array<{
      name?: string
      support_email?: string
      primary_color?: string
      accent_color?: string
      email_from_name?: string
      email_from_address?: string
    }>
    return result.ok && rows[0]?.name ? {
      name: rows[0].name,
      hostname,
      supportEmail: rows[0].support_email || fallback.supportEmail,
      primaryColor: rows[0].primary_color || fallback.primaryColor,
      accentColor: rows[0].accent_color || fallback.accentColor,
      emailFromName: rows[0].email_from_name || rows[0].name,
      emailFromAddress: rows[0].email_from_address || '',
    } : fallback
  } catch {
    return fallback
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
  const hostname = typeof body.hostname === 'string' ? body.hostname.trim().toLowerCase() : ''

  if (!emailPattern.test(email)) {
    sendJson(response, 400, { ok: false, error: 'Valid email is required' })
    return
  }

  const smtpConfig = getSmtpConfig()

  if (!smtpConfig) {
    console.error('Welcome email SMTP configuration is missing or invalid.')
    sendJson(response, 500, { ok: false, error: 'Email service is not configured' })
    return
  }

  try {
    const brand = await resolveEmailBrand(hostname)
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
      from: brand.emailFromAddress
        ? `${brand.emailFromName || brand.name} <${brand.emailFromAddress}>`
        : smtpConfig.from,
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    })

    sendJson(response, 200, { ok: true })
  } catch (error) {
    console.error('Failed to send early access welcome email.', {
      email,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    sendJson(response, 502, { ok: false, error: 'Unable to send welcome email' })
  }
}
