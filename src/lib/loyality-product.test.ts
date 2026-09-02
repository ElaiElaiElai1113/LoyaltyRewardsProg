import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { translateForLanguage } from './language'

const root = process.cwd()
const migration = readFileSync(resolve(root, 'supabase/migrations/20260824170041_loyality_single_business_platform.sql'), 'utf8')
const themeMigration = readFileSync(resolve(root, 'supabase/migrations/20260831175223_align_loyality_option_b_theme.sql'), 'utf8')
const home = readFileSync(resolve(root, 'src/features/loyality/pages/loyality-home-page.tsx'), 'utf8')
const homeCss = readFileSync(resolve(root, 'src/features/loyality/pages/loyality-home-page.css'), 'utf8')
const appCss = readFileSync(resolve(root, 'src/features/loyality/loyality-app.css'), 'utf8')
const service = readFileSync(resolve(root, 'src/features/loyality/loyality-service.ts'), 'utf8')
const businessGrowth = readFileSync(resolve(root, 'src/features/loyality/pages/loyality-business-growth-page.tsx'), 'utf8')
const businessDashboard = readFileSync(resolve(root, 'src/features/business-owner/pages/business-dashboard-page.tsx'), 'utf8')
const appShell = readFileSync(resolve(root, 'src/features/loyality/components/loyality-app-shell.tsx'), 'utf8')
const languagePicker = readFileSync(resolve(root, 'src/components/language-picker.tsx'), 'utf8')
const language = readFileSync(resolve(root, 'src/lib/language.tsx'), 'utf8')
const publicLayout = readFileSync(resolve(root, 'src/layouts/public-browse-layout.tsx'), 'utf8')

describe('Loyality product contract', () => {
  it('is a separate, single-business tenant on Loyalty Platforms', () => {
    expect(migration).toContain('"loyalitySingleBusiness":true')
    expect(migration).toContain("'10000000-0000-4000-8000-000000000007'")
    expect(migration).toContain("'loyality-rewards.vercel.app'")
    expect(migration).toContain('unique (program_id)')
  })

  it('implements acquisition, referral, visits, specific vouchers, and raffles', () => {
    for (const table of [
      'loyality_offers',
      'loyality_offer_claims',
      'loyality_visits',
      'loyality_visit_rules',
      'loyality_vouchers',
      'loyality_raffle_entries',
    ]) expect(migration).toContain(`public.${table}`)
    expect(migration).toContain('claim_loyality_offer')
    expect(migration).toContain('process_loyality_member_transaction')
    expect(migration).toContain('referral_reward_issued_at')
  })

  it('publishes the approved Option B promise without marketplace leakage or dead ends', () => {
    for (const copy of [
      'Turn your customers into members.',
      'Hardware or apps required',
      'One membership. Any incentive you want.',
      'A membership does three jobs at once.',
      'Four steps, fully automated after launch.',
      "Everything a loyalty app does. Plus what most of them don't.",
      "We're confident enough to put it in writing.",
      'Onboarding, made simple.',
    ]) expect(home).toContain(copy)
    expect(home).not.toContain('partner businesses')
    expect(home).not.toContain('href="#"')
    expect(home).not.toMatch(/Photo 1|Photo 2|Option B/)
    expect(service).toContain("sourceKind: 'acquisition_offer' | 'referral' | 'visit_rule' | 'points_catalog' | 'manual'")
  })

  it('carries the approved fonts and palette through public and signed-in Loyality surfaces', () => {
    for (const source of [homeCss, appCss]) {
      expect(source).toContain('Fraunces')
      expect(source).toContain('IBM Plex Sans')
      expect(source).toContain('IBM Plex Mono')
    }
    for (const color of ['#f6f1e4', '#efe8d6', '#1f3a2e', '#b8862e', '#d8b36a', '#a23b2e', '#d9cfaf', '#211d16', '#5b5546']) {
      expect(`${homeCss}\n${appCss}`).toContain(color)
    }
    expect(themeMigration).toContain("primary_color = '#1f3a2e'")
    expect(themeMigration).toContain("accent_color = '#b8862e'")
  })

  it('lets business owners pause, reactivate, cancel, and safely delete unused raffles', () => {
    expect(service).toContain('async setRaffleStatus')
    expect(service).toContain(".from('loyality_raffle_entries')")
    expect(service).toContain('already has entries')
    expect(service).toContain('async deleteRaffle')
    expect(businessGrowth).toContain('Manage raffles')
    expect(businessGrowth).toContain('Raffle paused.')
    expect(businessGrowth).toContain('Raffle cancelled.')
    expect(businessGrowth).toContain('Unused raffle deleted.')
  })

  it('keeps staff on a read-only overview and hides owner-only navigation', () => {
    expect(businessDashboard).toContain('<LoyalityBusinessGrowthPage mode="overview" />')
    expect(businessGrowth).toContain("mode = 'manage'")
    expect(businessGrowth).toContain("mode === 'manage'")
    expect(appShell).toContain('businessLinks.filter((item) => canAccessBusinessPath(profile?.role, item.to))')
  })

  it('offers persistent English and Spanish controls on every Loyality surface', () => {
    expect(languagePicker).toContain("const options = ['en', 'es'] as Language[]")
    expect(languagePicker).not.toContain("['en', 'tl', 'es']")
    expect(languagePicker).not.toContain("if (program.slug === 'loyality') return null")
    expect(language).not.toContain("if (getActiveProgram().slug === 'loyality') return 'en'")
    expect(publicLayout).not.toContain('isLoyality ? null : (\n              <LanguagePicker')
    expect(home).toContain('<LanguagePicker')
    expect(appShell).toContain('<LanguagePicker')

    for (const source of [
      'Turn your customers into members.',
      'One membership. Any incentive you want.',
      'One business. One loyalty loop.',
      'Private loyalty control room',
      'Offers are shared privately',
      'Voucher redeemed and recorded.',
    ]) {
      expect(translateForLanguage('es', source), source).not.toBe(source)
    }
  })
})
