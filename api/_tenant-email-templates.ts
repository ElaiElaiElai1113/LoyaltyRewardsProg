export type TenantEmailBrand = {
  name: string
  hostname: string
  supportEmail: string
  primaryColor: string
  accentColor: string
  emailFromName?: string
  emailFromAddress?: string
}

export type TenantEmailKind = 'welcome' | 'invitation' | 'password-recovery' | 'email-verification' | 'administrator-invitation'

const content: Record<TenantEmailKind, { subject: (brand: TenantEmailBrand) => string; heading: string; body: string; action?: string }> = {
  welcome: {
    subject: (brand) => `Welcome to ${brand.name}`,
    heading: 'Welcome to early access',
    body: 'Your early access request has been received. You will be among the first to receive invitations, rewards opportunities, and member updates.',
  },
  invitation: {
    subject: (brand) => `You have been invited to ${brand.name}`,
    heading: 'Your invitation is ready',
    body: 'Create your membership to access this rewards program.',
    action: 'Accept invitation',
  },
  'password-recovery': {
    subject: (brand) => `Reset your ${brand.name} password`,
    heading: 'Reset your password',
    body: 'Use the secure link below to choose a new password. Ignore this message if you did not request it.',
    action: 'Reset password',
  },
  'email-verification': {
    subject: (brand) => `Verify your email for ${brand.name}`,
    heading: 'Verify your email',
    body: 'Confirm this email address to finish securing your rewards membership.',
    action: 'Verify email',
  },
  'administrator-invitation': {
    subject: (brand) => `Administrator access for ${brand.name}`,
    heading: 'Program administrator invitation',
    body: 'You have been invited to administer this rewards program. Access remains limited to this program.',
    action: 'Review invitation',
  },
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export function tenantActionUrl(brand: TenantEmailBrand, path: string) {
  const hostname = brand.hostname.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!hostname || !/^[a-z0-9.-]+(?::\d+)?$/i.test(hostname)) throw new Error('Invalid tenant email hostname')
  return `https://${hostname}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildTenantEmail(input: {
  kind: TenantEmailKind
  brand: TenantEmailBrand
  recipientName?: string
  actionUrl?: string
}) {
  const template = content[input.kind]
  const greeting = input.recipientName?.trim().split(/\s+/)[0] || 'there'
  const action = template.action && input.actionUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:${escapeHtml(input.brand.primaryColor)};color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">${template.action}</a></p>`
    : ''
  const text = [
    `Hi ${greeting},`, '', template.body,
    ...(template.action && input.actionUrl ? ['', `${template.action}: ${input.actionUrl}`] : []),
    '', input.brand.name, input.brand.hostname, `Support: ${input.brand.supportEmail}`,
  ].join('\n')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(template.subject(input.brand))}</title></head><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#242424"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-top:6px solid ${escapeHtml(input.brand.accentColor)}"><tr><td style="padding:28px"><p style="font-weight:700;color:${escapeHtml(input.brand.primaryColor)}">${escapeHtml(input.brand.name)}</p><h1>${escapeHtml(template.heading)}</h1><p>Hi ${escapeHtml(greeting)},</p><p style="line-height:1.7">${escapeHtml(template.body)}</p>${action}<p style="font-size:13px;color:#666">Support: ${escapeHtml(input.brand.supportEmail)}</p></td></tr></table></td></tr></table></body></html>`
  return { subject: template.subject(input.brand), text, html }
}
