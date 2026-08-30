import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('RewardMe approval-gated launch foundations', () => {
  it('keeps the commercial register aligned with the pitch deck', () => {
    const register = source('docs/rewardme-commercial-decision-register.md')
    const signoff = source('docs/rewardme-commercial-owner-signoff.md')

    expect(register).toContain('$25/month')
    expect(register).toContain('$100/year')
    expect(register).toContain('Three months; no rewards or referral bonuses during trial')
    expect(register).not.toContain('₱4,000/year')
    expect(signoff).toContain('DO NOT ACTIVATE REGULAR/GOLD BENEFITS OR SAVINGS')
    expect(signoff).toContain('Membership-fee reward match timing')
  })

  it('keeps savings double-gated and the ledger read-only to members', () => {
    const migration = source('supabase/migrations/20260811084843_rewardme_savings_foundation.sql')

    expect(migration).toContain("p.feature_flags ->> 'savingsPlans'")
    expect(migration).toContain("sp.entitlements -> 'features' ->> 'savingsPlans'")
    expect(migration).toMatch(/select coalesce\(\([\s\S]*?\), false\);/)
    expect(migration).toContain('alter table public.savings_goals enable row level security')
    expect(migration).toContain('alter table public.savings_ledger_entries enable row level security')
    expect(migration).toContain('revoke all on table public.savings_ledger_entries from anon, authenticated')
    expect(migration).toContain('grant select on table public.savings_ledger_entries to authenticated')
    expect(migration).not.toMatch(/grant\s+(insert|update|delete)[^;]*savings_ledger_entries\s+to authenticated/i)
    expect(migration).toContain('{"savingsPlans":false}')
  })

  it('keeps online payment processing out of the active RewardMe application', () => {
    const migration = source('supabase/migrations/20260811085042_rewardme_member_billing_foundation.sql')
    const environment = source('.env.example')
    const membership = source('src/features/membership/pages/rewardme-membership-page.tsx')
    const planAdministration = source('src/features/program/pages/program-billing-page.tsx')

    expect(environment).not.toMatch(/STRIPE|MEMBER_BILLING_ENABLED/)
    expect(existsSync('api/rewardme-create-checkout-session.ts')).toBe(false)
    expect(existsSync('api/rewardme-stripe-webhook.ts')).toBe(false)
    expect(existsSync('api/stripe-create-checkout-session.ts')).toBe(false)
    expect(existsSync('api/stripe-webhook.ts')).toBe(false)
    expect(membership).toContain('Manual enrollment:')
    expect(membership).toContain('does not collect online payments or card details')
    expect(planAdministration).toContain('RewardMe does not collect payments online.')
    expect(migration).toContain('{"memberBilling":false}')
  })

  it('uses browser-led QA without a container-based runner', () => {
    const packageJson = source('package.json')
    const localQaGuide = source('docs/rewardme-local-qa-setup.md')

    expect(packageJson).not.toContain('qa:isolated')
    expect(packageJson).not.toContain('test:local-qa-readiness')
    expect(existsSync('scripts/run-rewardme-isolated-qa.ps1')).toBe(false)
    expect(localQaGuide).toContain('RewardMe browser QA workflow')
    expect(localQaGuide).toMatch(/does\s+not require a local database runtime/)
  })

  it('provisions production QA without persisting or printing privileged keys', () => {
    const provisioner = source('scripts/provision-rewardme-production-qa.ps1')

    expect(provisioner).toContain('/api-keys?reveal=true')
    expect(provisioner).toContain("$env:QA_PROGRAM_SLUG = 'pinas'")
    expect(provisioner).toContain('scripts/provision-tenant-qa-fixtures.mjs')
    expect(provisioner).not.toContain('test:e2e:rewardme-accounts')
    expect(provisioner).toContain('test:e2e:rewardme-safe')
    expect(provisioner).toContain('Remove-Item "Env:$name"')
    expect(provisioner).not.toContain('WriteAllText')
    expect(provisioner).not.toContain('Set-Content')

    const fixtureProvisioner = source('scripts/provision-tenant-qa-fixtures.mjs')
    expect(fixtureProvisioner).toContain("businessName: 'RewardMe QA Partner'")
    expect(fixtureProvisioner).toContain('Could not update QA business')
  })

  it('includes counsel drafts for referrals and savings plus an approval register', () => {
    const index = source('docs/legal-drafts/README.md')
    const referrals = source('docs/legal-drafts/referral-program-terms.md')
    const savings = source('docs/legal-drafts/savings-plan-supplement.md')
    const checklist = source('docs/legal-drafts/legal-approval-checklist.md')

    expect(index).toContain('Referral Program Terms')
    expect(index).toContain('Savings Plan Supplement')
    expect(referrals).toContain('DRAFT FOR LEGAL REVIEW')
    expect(savings).toContain('FEATURE NOT LIVE')
    expect(checklist).toContain('Approved to publish')
  })
})
