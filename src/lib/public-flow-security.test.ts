import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260801060000_harden_public_referral_and_auth_flows.sql',
  ),
  'utf8',
)
const welcomeApi = readFileSync(join(process.cwd(), 'api/send-welcome-email.ts'), 'utf8')
const giftCardService = readFileSync(
  join(process.cwd(), 'src/integrations/supabase/services/gift-cards-service.ts'),
  'utf8',
)
const referralService = readFileSync(
  join(process.cwd(), 'src/integrations/supabase/services/referrals-service.ts'),
  'utf8',
)
const partnerService = readFileSync(
  join(process.cwd(), 'src/integrations/supabase/services/partner-service.ts'),
  'utf8',
)
const authService = readFileSync(
  join(process.cwd(), 'src/integrations/supabase/services/auth-service.ts'),
  'utf8',
)
const router = readFileSync(join(process.cwd(), 'src/routes/router.tsx'), 'utf8')

function functionBody(name: string, nextName?: string) {
  const start = migration.indexOf(`function public.${name}(`)
  expect(start, `${name} must exist in the public-flow hardening migration`).toBeGreaterThan(-1)
  const end = nextName
    ? migration.indexOf(`function public.${nextName}(`, start + 1)
    : migration.length
  return migration.slice(start, end > start ? end : migration.length)
}

describe('public and legacy flow tenant security', () => {
  it('authorizes welcome email only for an exact verified host and an existing tenant lead', () => {
    const authorization = functionBody(
      'authorize_early_access_welcome_email',
      'get_member_by_qr_token',
    )

    expect(authorization).toContain("d.verification_status = 'verified'")
    expect(authorization).toContain("p.status = 'active'")
    expect(authorization).toContain('eal.program_id = v_program.id')
    expect(authorization).toContain('lower(eal.email) = v_email')
    expect(authorization).toContain('welcome_email_delivery_attempts')
    expect(authorization).toContain("interval '10 minutes'")
    expect(authorization).toContain("interval '24 hours'")
    expect(authorization).toContain('welcome_email_rate_limited')

    expect(welcomeApi).toContain('request.headers.host')
    expect(welcomeApi).toContain('requestOriginMatchesHostname')
    expect(welcomeApi).toContain('suppliedHostname !== requestHostname')
    expect(welcomeApi).toContain('authorize_early_access_welcome_email')
    expect(welcomeApi).toContain('p_email: email')
    expect(welcomeApi).not.toContain('SMTP_FROM')
  })

  it('scopes QR lookup to the active business program', () => {
    const lookup = functionBody('get_member_by_qr_token', 'get_public_gift_card_by_token')

    expect(lookup).toContain('public.has_active_business_program_access')
    expect(lookup).toContain('pm.program_id = v_business.program_id')
    expect(lookup).toContain("pm.role = 'member'")
    expect(lookup).toContain("pm.status = 'active'")
  })

  it('requires program context for public gift cards and returns tenant colors', () => {
    const lookup = functionBody('get_public_gift_card_by_token', 'create_referral')

    expect(migration).toContain(
      'revoke all on function public.get_public_gift_card_by_token(text) from public, anon, authenticated',
    )
    expect(lookup).toContain('gc.program_id = p_program_id')
    expect(lookup).toContain("p_token ~ '^[0-9a-f]{32}$'")
    expect(lookup).toContain('auth.uid() is not null')
    expect(lookup).toContain('public.has_active_business_program_access')
    expect(lookup).toContain('pr.primary_color')
    expect(lookup).toContain('pr.accent_color')
    expect(lookup).not.toContain("'#f4a84f'::text")
    expect(lookup).not.toContain("'#7bd8cf'::text")
    expect(giftCardService).toMatch(
      /get_public_gift_card_by_token[\s\S]*p_program_id: getActiveProgram\(\)\.id/,
    )
  })

  it('makes referrals and reward credits explicitly program scoped', () => {
    const createReferral = functionBody('create_referral', 'get_staff_referrals')
    const approveReferral = functionBody('approve_referral', 'reject_referral')
    const redeemCredit = functionBody('redeem_credit_code', 'consume_reward_credit')
    const consumeCredit = functionBody('consume_reward_credit', 'attribute_partner_referral')

    expect(migration).toMatch(/alter table public\.referrals[\s\S]*program_id/)
    expect(createReferral).toMatch(/insert into public\.referrals \(\s*program_id/)
    expect(approveReferral).toContain('on conflict (program_id, profile_id) do nothing')
    expect(redeemCredit).toContain('cr.program_id = v_business.program_id')
    expect(redeemCredit).toContain('rb.program_id = v_business.program_id')
    expect(consumeCredit).toContain('rb.program_id = p_program_id')
    expect(migration).not.toContain('on conflict (profile_id)')
    expect(referralService).toMatch(
      /credit_redemptions[\s\S]*program_id: getActiveProgram\(\)\.id/,
    )
    expect(referralService).toMatch(
      /consume_reward_credit[\s\S]*p_program_id: getActiveProgram\(\)\.id/,
    )
  })

  it('binds partner writes and attribution to one program', () => {
    const attribution = functionBody('attribute_partner_referral')

    expect(attribution).toContain('pr.program_id = v_business.program_id')
    expect(attribution).toMatch(/insert into public\.partner_referrals \(\s*program_id/)
    expect(attribution).toContain('pm.program_id = v_business.program_id')
    expect(partnerService).toMatch(
      /createPartnerReferrer[\s\S]*programId: getActiveProgram\(\)\.id/,
    )
  })

  it('uses a tenant-aware confirmation redirect and a dedicated safe callback route', () => {
    expect(authService).toContain('emailRedirectTo: `${getPublicSiteUrl()}/auth/confirm`')
    expect(authService).toContain('async ensureEmailConfirmationSession')
    expect(router).toContain("path: '/auth/confirm'")
    expect(router).toContain('<EmailConfirmationPage />')

    const confirmation = authService.slice(
      authService.indexOf('async ensureEmailConfirmationSession'),
      authService.indexOf('getPendingSignInRole'),
    )
    expect(confirmation.indexOf('exchangeCodeForSession(code)')).toBeGreaterThan(-1)
    expect(confirmation.indexOf('exchangeCodeForSession(code)')).toBeLessThan(
      confirmation.indexOf('sb.auth.getSession()'),
    )
  })
})
