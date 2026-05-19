import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import {
  earlyAccessMessageLines,
  earlyAccessSubscribePrompt,
  earlyAccessSubscribeButtonLabel,
  earlyAccessSubscribeFields,
} from '../src/features/early-access/early-access-content.js'
import {
  ambassadorCreatorSignals,
  ambassadorFormIntro,
  ambassadorPerks,
  ambassadorPrimaryCta,
  ambassadorSuccessMessage,
  ambassadorSuccessTitle,
  ambassadorVipHeadline,
  ambassadorVipSupportingCopy,
} from '../src/features/ambassadors/ambassador-content.js'
import {
  landingBody,
  landingFaqQuestions,
  landingHeroEyebrow,
  landingHeroHeadline,
  landingHeroInfoRows,
  landingHeroPills,
  landingJoinButtonLabel,
  landingOfferLines,
  landingTagline,
  landingTags,
} from '../src/features/auth/landing-content.js'
import { isPickupWindow, normalizeCheckoutItems } from '../src/features/critical-flows/critical-flow.js'

function runTest(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

runTest('normalizeCheckoutItems aggregates duplicate products for one business', () => {
  const result = normalizeCheckoutItems([
    { productId: 'prod-1', businessId: 'biz-1', quantity: 1 },
    { productId: 'prod-1', businessId: 'biz-1', quantity: 2 },
    { productId: 'prod-2', businessId: 'biz-1', quantity: 1 },
  ])

  assert.equal(result.businessId, 'biz-1')
  assert.deepEqual(result.items, [
    { productId: 'prod-1', quantity: 3 },
    { productId: 'prod-2', quantity: 1 },
  ])
})

runTest('normalizeCheckoutItems rejects mixed-business carts', () => {
  assert.throws(
    () =>
      normalizeCheckoutItems([
        { productId: 'prod-1', businessId: 'biz-1', quantity: 1 },
        { productId: 'prod-2', businessId: 'biz-2', quantity: 1 },
      ]),
    /one business at a time/i,
  )
})

runTest('normalizeCheckoutItems rejects invalid quantities', () => {
  assert.throws(
    () =>
      normalizeCheckoutItems([
        { productId: 'prod-1', businessId: 'biz-1', quantity: 0 },
      ]),
    /invalid item/i,
  )
})

runTest('isPickupWindow only accepts supported redemption windows', () => {
  assert.equal(isPickupWindow('Now'), true)
  assert.equal(isPickupWindow('Within 30 mins'), true)
  assert.equal(isPickupWindow('Tonight'), false)
})

runTest('early access content preserves the approved conversion copy', () => {
  assert.deepEqual(earlyAccessMessageLines, [
    'Hey,',
    'We’re tired of watching people work hard but still struggle to afford the life they want — vacations, freedom, extras.',
    'That’s why we’re building Medellín Rewards: the highest-paying rewards program. Earn 20–100% back on almost everything you already buy daily.',
    'No extra spending. Just real money back to help you do more of what you love.',
    'We’re currently preparing for launch, and we’re inviting early supporters to join before anyone else.',
    'When we officially launch, subscribers will be the first to know — with access to exclusive benefits, updates, and early rewards opportunities.',
    'Ready to earn more?',
    'Let’s make this happen together.',
    'Medellín Rewards Team',
  ])
})

runTest('early access subscribe form only exposes WhatsApp and email contact fields', () => {
  assert.deepEqual(earlyAccessSubscribeFields.map((field) => field.name), ['whatsapp', 'email'])
  assert.equal(earlyAccessSubscribeButtonLabel, 'Subscribe')
  assert.equal(earlyAccessSubscribePrompt, 'Enter your WhatsApp number and/or email')
})

runTest('ambassador content uses approved VIP creator positioning', () => {
  assert.equal(ambassadorVipHeadline, 'Join the VIP Creator Circle.')
  assert.equal(
    ambassadorVipSupportingCopy,
    'Medellin Rewards is building a private network of creators, promoters, hosts, and social connectors who can introduce people to the best local businesses while unlocking exclusive rewards, VIP perks, and selected paid opportunities.',
  )
  assert.deepEqual(ambassadorCreatorSignals, [
    'Lifestyle creators',
    'Promoters',
    'Social connectors',
    'Hosts and community builders',
  ])
})

runTest('ambassador content keeps first-version offer and form language scoped', () => {
  assert.deepEqual(
    ambassadorPerks.map((perk) => [perk.title, perk.body]),
    [
      ['VIP rewards access', 'Get early access to member rewards, local offers, and private partner perks.'],
      [
        'Paid promoter opportunities',
        'Selected creators may be invited into paid campaigns and higher-value VIP options as the network grows.',
      ],
      ['Business discovery', 'Help people find places worth visiting, sharing, and coming back to.'],
    ],
  )
  assert.equal(ambassadorFormIntro, 'Tell us where you share recommendations and how we can reach you.')
  assert.equal(ambassadorSuccessTitle, "You're on the VIP creator list.")
  assert.equal(
    ambassadorSuccessMessage,
    'We saved your details. Our team will review your socials and contact you when creator opportunities open.',
  )
  assert.equal(ambassadorPrimaryCta, 'Submit VIP creator request')
})

runTest('global CSS restores the brand theme outside early access', () => {
  const css = readFileSync('src/index.css', 'utf8')

  assert.match(css, /--background:\s*#fbefe2/)
  assert.match(css, /--foreground:\s*#24190f/)
  assert.match(css, /--champagne:\s*#f2c978/)
  assert.doesNotMatch(css, /#root\s*\{[^}]*filter:\s*grayscale\(1\)/)
  assert.doesNotMatch(css, /App-wide neutral mode/)
  assert.match(css, /\.early-access-neutral/)
})

runTest('admin portal header uses the restored warm theme', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const headerStart = adminPage.indexOf('warm-hero-muted relative min-w-0')
  const tabsStart = adminPage.indexOf('<Tabs defaultValue="members"')

  assert.ok(headerStart > -1)
  assert.ok(tabsStart > headerStart)

  const headerMarkup = adminPage.slice(headerStart, tabsStart)

  assert.match(headerMarkup, /text-\[var\(--cream\)\]/)
  assert.match(headerMarkup, /text-\[var\(--champagne\)\]/)
  assert.match(headerMarkup, /bg-\[var\(--cream\)\]\/12/)
  assert.doesNotMatch(headerMarkup, /border-neutral-200/)
  assert.doesNotMatch(headerMarkup, /bg-neutral-50/)
})

runTest('admin portal exposes early access lead workflow', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const earlyAccessService = readFileSync('src/integrations/supabase/services/early-access-service.ts', 'utf8')
  const adminHooks = readFileSync('src/hooks/use-admin-data.ts', 'utf8')

  assert.match(adminPage, /value="early-access"/)
  assert.match(adminPage, /Early Access Leads/)
  assert.match(adminPage, /earlyAccessLeadStatusOptions/)
  assert.match(earlyAccessService, /async getLeads\(/)
  assert.match(earlyAccessService, /async updateLeadStatus\(/)
  assert.match(adminHooks, /useAdminEarlyAccessLeads/)
  assert.match(adminHooks, /useUpdateEarlyAccessLeadStatus/)
})

runTest('admin early access rows label captured contact details', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const sectionStart = adminPage.indexOf('<TabsContent value="early-access"')
  const sectionEnd = adminPage.indexOf('<TabsContent value="referrals"')

  assert.ok(sectionStart > -1)
  assert.ok(sectionEnd > sectionStart)

  const earlyAccessSection = adminPage.slice(sectionStart, sectionEnd)

  assert.match(earlyAccessSection, /Contact Details/)
  assert.match(earlyAccessSection, /Name/)
  assert.match(earlyAccessSection, /Email/)
  assert.match(earlyAccessSection, /WhatsApp/)
  assert.match(earlyAccessSection, /Instagram/)
  assert.match(earlyAccessSection, /lead\.whatsapp/)
  assert.match(earlyAccessSection, /lead\.email/)
  assert.match(earlyAccessSection, /lead\.notes/)
})

runTest('reward cards use branded luxe artwork', () => {
  const cardFiles = [
    'src/features/rewards/components/reward-card.tsx',
    'src/features/shop/components/product-card.tsx',
    'src/features/gift-cards/components/gift-card-tile.tsx',
  ]

  for (const file of cardFiles) {
    const card = readFileSync(file, 'utf8')

    assert.match(card, /luxe-art/)
    assert.match(card, /text-\[var\(--cream\)\]/)
    assert.match(card, /--champagne/)
    assert.doesNotMatch(card, /bg-neutral-100/)
  }
})

runTest('promotion cards avoid overlapping admin badges and use branded contrast', () => {
  const promotionCard = readFileSync('src/features/rewards/components/promotion-card.tsx', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  assert.match(promotionCard, /businessName\?: string/)
  assert.match(promotionCard, /text-\[var\(--champagne\)\]/)
  assert.match(promotionCard, /bg-\[var\(--espresso-soft\)\]/)
  assert.match(promotionCard, /hover:border-primary\/30/)
  assert.doesNotMatch(promotionCard, /bg-neutral-100/)
  assert.match(adminPage, /businessName=\{businessNameById\.get\(promotion\.businessId\) \?\? 'Unknown partner'\}/)
  assert.doesNotMatch(adminPage, /absolute top-4 left-4 border-outline-variant\/20 bg-white\/90/)
})

runTest('referral approval can award credits before ID verification but still blocks credit use', () => {
  const migration = readFileSync('supabase/migrations/20260519000200_fix_referral_approval_credit_awards.sql', 'utf8')

  assert.match(migration, /create or replace function public\.enforce_verified_profile_value_action/)
  assert.match(migration, /new\.available_credits >= old\.available_credits/)
  assert.match(migration, /insert into public\.reward_balances \(profile_id\)/)
  assert.match(migration, /on conflict \(profile_id\) do nothing/)
  assert.match(migration, /create or replace function public\.approve_referral/)
  assert.match(migration, /grant execute on function public\.approve_referral\(uuid, uuid\) to authenticated/)
})

runTest('landing page content follows the approved member-facing wording', () => {
  assert.equal(landingHeroEyebrow, "THE WORLD'S HIGHEST PAYING REWARDS PROGRAM")
  assert.deepEqual(landingHeroHeadline, {
    beforeHighlight: 'Earn a ',
    highlight: 'free vacation',
    afterHighlight: ' every year — doing what you already do',
  })
  assert.equal(landingTagline, 'Earn a free vacation every year — doing what you already do')
  assert.equal(
    landingBody,
    'Imagine being able to earn enough rewards every year for a free vacation by doing what you already do, with Medellin Rewards you can do exactly that!',
  )
  assert.deepEqual(landingHeroInfoRows.map((row) => row.text), [
    'Earn between 20% - 100% by simply spending at amazing businesses within our platform',
    'Earn from purchasing almost any type of product or service from going to a restaurant or hotel to buying a car or home.',
  ])
  assert.deepEqual(landingHeroPills.map((pill) => pill.label), [
    'Restaurants & hotels',
    'Cars & real estate',
    '20% – 100% back',
    'Any product or service',
  ])
  assert.equal(landingJoinButtonLabel, 'Join Medellin Rewards')
  assert.deepEqual(landingTags, [
    'Earn between 20% - 100% by simply spending at amazing businesses within our platform',
    'Earn from purchasing almost any type of product or service from going to a restaurant or hotel to buying a car or home.',
  ])
  assert.deepEqual(landingOfferLines, [
    'Early adopter',
    'Monthly subscription',
    '$100,000 bonus 100%',
    '$100,000 in Rewards',
  ])
  assert.deepEqual(landingFaqQuestions, [
    'Where can I use my rewards?',
    'Can I have more than one rewards account?',
    'Can I transfer rewards to another account?',
    'Can rewards be exchanged for money?',
  ])
})

runTest('landing page FAQs are clickable and include answers', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const landingContent = readFileSync('src/features/auth/landing-content.ts', 'utf8')

  assert.match(landingPage, /<details/)
  assert.match(landingPage, /<summary/)
  assert.match(landingPage, /landingFaqItems\.map/)
  assert.doesNotMatch(landingPage, /landingFaqQuestions\.map/)
  assert.match(landingContent, /export const landingFaqItems/)
  assert.match(landingContent, /answer:/)
})

runTest('landing FAQ and footer follow the Figma lower page', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /landing-faq-figma/)
  assert.match(landingPage, /max-w-\[672px\]/)
  assert.match(landingPage, /border-t border-\[#dde1e6\] bg-\[#f6f7f8\]/)
  assert.match(landingPage, /min-h-\[63px\]/)
  assert.match(landingPage, /rounded-\[0\.45rem\] border border-\[#dde1e6\] bg-\[#ffffff\]/)
  assert.match(landingPage, /landingFaqIconByQuestion/)
  assert.match(landingPage, /MapPin/)
  assert.match(landingPage, /Users/)
  assert.match(landingPage, /ArrowLeftRight/)
  assert.match(landingPage, /DollarSign/)
  assert.doesNotMatch(landingPage, /ChevronRight/)
  assert.match(landingPage, /landing-footer-figma/)
  assert.match(landingPage, /min-h-\[108px\]/)
  assert.match(landingPage, /border-t border-\[#dde1e6\] bg-\[#ffffff\]/)
  assert.match(landingPage, /min-h-\[108px\][^"]*items-center/)
  assert.match(landingPage, /grid-cols-\[1fr_auto_1fr\]/)
  assert.match(landingPage, /max-w-none/)
})

runTest('landing Figma reference asset is stored with app assets', () => {
  assert.equal(existsSync('src/assets/medellin-landing.png'), true)
})

runTest('member signup page uses simplified branded layout', () => {
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')

  assert.match(joinPage, /soft-luxe-shell/)
  assert.match(joinPage, /gold-frame/)
  assert.match(joinPage, /luxe-card/)
  assert.doesNotMatch(joinPage, /heroImage/)
  assert.doesNotMatch(joinPage, /Spend \$X locally/)
  assert.doesNotMatch(joinPage, /Why we verify members/)
  assert.doesNotMatch(joinPage, /bg-\[#24150e\]/)
})

runTest('landing hero Join Medellin Rewards button goes to early access', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /to="\/early-access"/)
  assert.match(landingPage, /landing-header-figma/)
  assert.match(landingPage, /h-\[61px\]/)
  assert.match(landingPage, /How it works/)
  assert.match(landingPage, /Businesses/)
  assert.match(landingPage, /FAQ/)
  assert.match(landingPage, /landing-hero-exact/)
  assert.match(landingPage, /min-h-\[777px\]/)
  assert.match(landingPage, /landingHeroEyebrow/)
  assert.match(landingPage, /landingHeroInfoRows\.map/)
  assert.match(landingPage, /landingHeroPills\.map/)
  assert.match(landingPage, /landingJoinButtonLabel/)
  assert.doesNotMatch(landingPage, /leadModalOpen/)
  assert.doesNotMatch(landingPage, /memberLeadSchema/)
})

runTest('landing subscription section follows the Figma card proportions', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /landing-subscription-figma/)
  assert.match(landingPage, /id="businesses"/)
  assert.match(landingPage, /border-t border-\[#dde1e6\] bg-\[#ffffff\]/)
  assert.match(landingPage, /text-\[26px\]/)
  assert.match(landingPage, /max-w-\[340px\]/)
  assert.match(landingPage, /border-2 border-\[#d0a534\] bg-\[#ffffff\]/)
  assert.match(landingPage, /min-w-\[193px\]/)
  assert.match(landingPage, /max-w-\[280px\][\s\S]*rounded-\[0\.45rem\] bg-\[#f7f8fb\]/)
  assert.match(landingPage, /text-\[24px\] font-semibold/)
  assert.match(landingPage, /min-h-\[45px\] w-full max-w-\[280px\]/)
  assert.match(landingPage, /View Agreement/)
})

runTest('landing how it works section follows the Figma card row', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /landing-how-it-works-figma/)
  assert.match(landingPage, /max-w-\[1216px\]/)
  assert.match(landingPage, /lg:grid-cols-4/)
  assert.match(landingPage, /h-\[155px\]/)
  assert.match(landingPage, /rounded-\[0\.7rem\] border border-\[#dde1e6\] bg-\[#fbfcfd\]/)
  assert.match(landingPage, /size-\[34px\]/)
  assert.match(landingPage, /text-\[#9f730f\]/)
  assert.match(landingPage, /text-\[13px\] leading-\[1\.55\] text-\[#667083\]/)
})

runTest('early access CTA opens a lead capture modal', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')

  assert.match(earlyAccessPage, /early-access-neutral/)
  assert.match(earlyAccessPage, /Dialog open=\{leadModalOpen\}/)
  assert.match(earlyAccessPage, /earlyAccessModalSchema/)
  assert.match(earlyAccessPage, /earlyAccessService\.createLead/)
  assert.match(earlyAccessPage, /leadForm\.register\('fullName'\)/)
  assert.match(earlyAccessPage, /leadForm\.register\('whatsapp'\)/)
  assert.match(earlyAccessPage, /leadForm\.register\('instagram'\)/)
  assert.match(earlyAccessPage, /leadForm\.register\('email'\)/)
  assert.match(earlyAccessPage, /Instagram/)
})

runTest('early access typography keeps the launch copy readable', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')

  assert.match(earlyAccessPage, /font-sans/)
  assert.match(earlyAccessPage, /text-\[clamp\(2\.75rem,7vw,4\.25rem\)\]/)
  assert.match(earlyAccessPage, /text-\[clamp\(1\.75rem,3\.4vw,2\.25rem\)\]/)
  assert.match(earlyAccessPage, /max-w-3xl space-y-5 text-\[1\.125rem\]/)
  assert.doesNotMatch(earlyAccessPage, /text-8xl/)
  assert.doesNotMatch(earlyAccessPage, /text-7xl/)
  assert.doesNotMatch(earlyAccessPage, /text-6xl/)
})
