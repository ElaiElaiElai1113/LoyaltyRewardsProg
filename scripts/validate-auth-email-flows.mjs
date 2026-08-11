import { readFile } from 'node:fs/promises'

const files = {
  authService: await readFile('src/integrations/supabase/services/auth-service.ts', 'utf8'),
  invitationFunction: await readFile('supabase/functions/register-customer/index.ts', 'utf8'),
  router: await readFile('src/routes/router.tsx', 'utf8'),
  recoveryTemplate: await readFile('supabase/email-templates/recovery.html', 'utf8'),
  invitationTemplate: await readFile('supabase/email-templates/invite.html', 'utf8'),
  confirmationTemplate: await readFile('supabase/email-templates/confirmation.html', 'utf8'),
}

const checks = [
  ['recovery API', files.authService.includes('auth.resetPasswordForEmail(normalizedEmail')],
  ['normalized recovery recipient', files.authService.includes("email.trim().toLowerCase()")],
  ['recovery redirect', files.authService.includes("/reset-password`" )],
  ['recovery route', files.router.includes("path: '/reset-password'")],
  ['invitation API', files.invitationFunction.includes('auth.admin.inviteUserByEmail')],
  ['verified invitation domains', files.invitationFunction.includes(".eq('verification_status', 'verified')")],
  ['invitation redirect', files.invitationFunction.includes('`${origin}/accept-invitation`')],
  ['invitation route', files.router.includes("path: '/accept-invitation'")],
  ['invitation screen mode', files.router.includes('<ResetPasswordPage flow="invite" />')],
  ['PKCE exchange', files.authService.includes('exchangeCodeForSession(code)')],
  ['recovery template action', files.recoveryTemplate.includes('{{ .ConfirmationURL }}')],
  ['invitation template action', files.invitationTemplate.includes('{{ .ConfirmationURL }}')],
  ['confirmation template action', files.confirmationTemplate.includes('{{ .ConfirmationURL }}')],
]

const templateCopy = [
  files.recoveryTemplate,
  files.invitationTemplate,
  files.confirmationTemplate,
].join('\n')
checks.push([
  'neutral shared templates',
  !/Medellin|PinasRewards|Pinas Rewards/i.test(templateCopy),
])

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name)
console.log(JSON.stringify({
  passed: failures.length === 0,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  externalDeliveryVerificationRequired: true,
}, null, 2))
process.exit(failures.length ? 1 : 0)
