import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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
    'That’s why we’re building Medellin Rewards: the highest-paying rewards program. Earn 20-100% back on almost everything you already buy daily.',
    'No extra spending. Just real money back to help you do more of what you love.',
    'As an early adopter, you’ll get exclusive benefits before anyone else.',
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

runTest('global CSS includes an app-wide neutral color override', () => {
  const css = readFileSync('src/index.css', 'utf8')

  assert.match(css, /--background:\s*#ffffff/)
  assert.match(css, /--foreground:\s*#111111/)
  assert.match(css, /filter:\s*grayscale\(1\)/)
  assert.match(css, /\.warm-hero,\s*\n\s*\.warm-hero-muted,\s*\n\s*\.gold-frame,/)
})

runTest('admin portal header uses visible neutral contrast', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const headerStart = adminPage.indexOf("rounded-[2rem] border border-neutral-200 bg-neutral-50")
  const tabsStart = adminPage.indexOf('<Tabs defaultValue="members"')

  assert.ok(headerStart > -1)
  assert.ok(tabsStart > headerStart)

  const headerMarkup = adminPage.slice(headerStart, tabsStart)

  assert.match(headerMarkup, /text-black/)
  assert.match(headerMarkup, /text-neutral-700/)
  assert.doesNotMatch(headerMarkup, /text-white\//)
  assert.doesNotMatch(headerMarkup, /bg-white\/10/)
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

runTest('reward cards keep visible neutral contrast', () => {
  const cardFiles = [
    'src/features/rewards/components/reward-card.tsx',
    'src/features/shop/components/product-card.tsx',
    'src/features/gift-cards/components/gift-card-tile.tsx',
  ]

  for (const file of cardFiles) {
    const card = readFileSync(file, 'utf8')

    assert.match(card, /bg-neutral-100/)
    assert.match(card, /text-black/)
    assert.doesNotMatch(card, /text-\[var\(--cream\)\]/)
    assert.doesNotMatch(card, /text-\[var\(--champagne\)\]/)
  }
})

runTest('promotion cards avoid overlapping admin badges and keep neutral contrast', () => {
  const promotionCard = readFileSync('src/features/rewards/components/promotion-card.tsx', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  assert.match(promotionCard, /businessName\?: string/)
  assert.match(promotionCard, /bg-neutral-100/)
  assert.match(promotionCard, /text-black/)
  assert.doesNotMatch(promotionCard, /text-\[var\(--champagne\)\]/)
  assert.doesNotMatch(promotionCard, /bg-\[var\(--espresso-soft\)\]/)
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
  assert.equal(landingTagline, 'The world’s highest paying Rewards Program!')
  assert.equal(
    landingBody,
    'Imagine being able to earn enough rewards every year for a free vacation by doing what you already do, with Medellin Rewards you can do exactly that!',
  )
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

runTest('member signup page uses simplified neutral layout', () => {
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')

  assert.match(joinPage, /bg-white/)
  assert.match(joinPage, /border-neutral-200/)
  assert.doesNotMatch(joinPage, /heroImage/)
  assert.doesNotMatch(joinPage, /Spend \$X locally/)
  assert.doesNotMatch(joinPage, /Why we verify members/)
  assert.doesNotMatch(joinPage, /bg-\[#24150e\]/)
  assert.doesNotMatch(joinPage, /#f2c978/)
})
