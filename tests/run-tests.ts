import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  landingClientHero,
  landingEarlySubscriberBenefits,
  landingFaqQuestions,
  landingHeroEyebrow,
  landingHeroHeadline,
  landingHeroInfoRows,
  landingHeroPills,
  landingMembershipAdvantages,
  landingJoinButtonLabel,
  landingOfferLines,
  landingRewardsSteps,
  landingTagline,
  landingTags,
  landingWhyJoinItems,
} from '../src/features/auth/landing-content.js'
import { isPickupWindow, normalizeCheckoutItems } from '../src/features/critical-flows/critical-flow.js'
import { calculateMemberTransaction } from '../src/features/critical-flows/member-transaction.js'

function runTest(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return getSourceFiles(entryPath)
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

function getFilesByExtension(directory: string, extension: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return getFilesByExtension(entryPath, extension)
    }

    return entry.name.endsWith(extension) ? [entryPath] : []
  })
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

runTest('calculateMemberTransaction converts outside purchase amount into reward value, points, and commission', () => {
  const result = calculateMemberTransaction({
    purchaseAmount: 50,
    rewardRatePercent: 20,
    commissionRatePercent: 10,
  })

  assert.deepEqual(result, {
    rewardValue: 10,
    pointsAwarded: 1000,
    commissionAmount: 5,
  })
})

runTest('early access content preserves the approved conversion copy', () => {
  assert.deepEqual(earlyAccessMessageLines, [
    'Hola:',
    'Estamos cansados de ver a las personas trabajar duro y, aun así, luchar para pagar el estilo de vida que desean: vacaciones, libertad financiera y esos extras que hacen la vida más agradable.',
    'Por eso estamos creando Medellín Rewards, el programa de recompensas que más paga. Obtén entre un 20 % y un 100 % de devolución en gran parte de las compras que ya realizas cada día.',
    'Sin gastar de más. Sin complicaciones. Solo dinero real de vuelta para ayudarte a disfrutar más de lo que amas.',
    'Actualmente estamos preparando nuestro lanzamiento e invitando a los primeros miembros antes que a nadie.',
    'Cuando lancemos oficialmente, los suscriptores serán los primeros en enterarse y tendrán acceso a beneficios exclusivos, novedades y oportunidades especiales para maximizar sus recompensas.',
  ])
})

runTest('early access subscribe form only exposes WhatsApp and email contact fields', () => {
  assert.deepEqual(earlyAccessSubscribeFields.map((field) => field.name), ['whatsapp', 'email'])
  assert.equal(earlyAccessSubscribeButtonLabel, 'Subscribe')
  assert.equal(earlyAccessSubscribePrompt, 'Enter your WhatsApp number and email')
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
  const tabsStart = adminPage.indexOf('<Tabs value={activeAdminTab}')

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

runTest('landing page content covers the client requested topics', () => {
  const landingContent = readFileSync('src/features/auth/landing-content.ts', 'utf8')

  assert.match(landingContent, /landingWhyJoinItems/)
  assert.match(landingContent, /landingEarlySubscriberBenefits/)
  assert.match(landingContent, /landingRewardsSteps/)
  assert.match(landingContent, /landingMembershipAdvantages/)
})

runTest('landing page FAQs are clickable and include answers', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /<details/)
  assert.match(landingPage, /<summary/)
  assert.match(landingPage, /faqs\.map/)
  assert.match(landingPage, /answer:/)
  assert.match(landingPage, /partnered businesses inside the Medellin Rewards network/)
  assert.match(landingPage, /ID verification/)
})

runTest('landing FAQ and footer follow the Figma lower page', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /id="faq"/)
  assert.match(landingPage, /max-w-\[700px\]/)
  assert.match(landingPage, /min-h-\[58px\]/)
  assert.match(landingPage, /rounded-\[7px\] border border-\[#dfe3e8\] bg-\[#ffffff\]/)
  assert.match(landingPage, /MapPin/)
  assert.match(landingPage, /Users/)
  assert.match(landingPage, /BadgeCheck/)
  assert.match(landingPage, /DollarSign/)
  assert.doesNotMatch(landingPage, /ChevronRight/)
  assert.match(landingPage, /min-h-\[86px\]/)
  assert.match(landingPage, /md:grid-cols-\[1fr_auto_1fr\]/)
  assert.match(landingPage, /max-w-\[1336px\]/)
})

runTest('client landing page renders the screenshot sections', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /free vacation<\/span>/)
  assert.match(landingPage, /Early adopter monthly subscription/)
  assert.match(landingPage, /\$100,000 in Rewards/)
  assert.match(landingPage, /id="how-it-works"/)
  assert.match(landingPage, /steps\.map/)
  assert.match(landingPage, /faqs\.map/)
})

runTest('landing Figma reference asset is stored with app assets', () => {
  assert.equal(existsSync('src/assets/medellin-landing.png'), true)
})

runTest('member signup page uses compact black and gold portal layout', () => {
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')

  assert.match(joinPage, /AuthPortalShell/)
  assert.match(joinPage, /activeTab="signup"/)
  assert.match(joinPage, /Create my account/)
  assert.doesNotMatch(joinPage, /heroImage/)
  assert.doesNotMatch(joinPage, /Spend \$X locally/)
  assert.doesNotMatch(joinPage, /Why we verify members/)
  assert.doesNotMatch(joinPage, /bg-\[#24150e\]/)
})

runTest('member signup schema no longer requires ID verification fields', () => {
  const forms = readFileSync('src/types/forms.ts', 'utf8')
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const referralPage = readFileSync('src/features/referrals/pages/referral-register-page.tsx', 'utf8')
  const authService = readFileSync('src/integrations/supabase/services/auth-service.ts', 'utf8')

  assert.match(forms, /export const memberSignUpSchema = authSchema\.extend\(\{[\s\S]*role: z\.literal\('customer'\)/)
  assert.match(forms, /export type MemberSignUpSubmission = MemberSignUpFormValues/)
  assert.doesNotMatch(forms, /MemberSignUpSubmission = MemberSignUpFormValues & \{\s*verificationDocument: File/)
  assert.doesNotMatch(joinPage, /verificationDocument/)
  assert.doesNotMatch(joinPage, /verificationIdNumber/)
  assert.doesNotMatch(referralPage, /verificationDocument/)
  assert.doesNotMatch(referralPage, /verificationIdNumber/)
  assert.doesNotMatch(authService, /validateVerificationDocument\(input\.verificationDocument\)/)
  assert.doesNotMatch(authService, /MEMBER_VERIFICATION_BUCKET/)
})

runTest('profile verification remains the ID upload path after signup', () => {
  const profilePage = readFileSync('src/features/profile/pages/profile-page.tsx', 'utf8')
  const profileService = readFileSync('src/integrations/supabase/services/profile-service.ts', 'utf8')
  const forms = readFileSync('src/types/forms.ts', 'utf8')

  assert.match(forms, /export const memberVerificationSchema/)
  assert.match(forms, /export type MemberVerificationSubmission = MemberVerificationFormValues & \{\s*verificationDocument: File\s*\}/)
  assert.match(profilePage, /Submit ID/)
  assert.match(profilePage, /verificationForm\.register\('verificationIdNumber'\)/)
  assert.match(profileService, /validateVerificationDocument\(values\.verificationDocument\)/)
  assert.match(profileService, /submit_member_verification/)
})

runTest('new customer auth trigger allows account creation before ID submission', () => {
  const migration = readFileSync('supabase/migrations/20260512000000_member_identity_verification.sql', 'utf8')
  const forwardMigration = readFileSync(
    'supabase/migrations/20260608000000_allow_member_signup_without_verification_id.sql',
    'utf8',
  )

  assert.doesNotMatch(migration, /Verification ID is required for member signup/)
  assert.doesNotMatch(migration, /Verification document is required for member signup/)
  assert.match(migration, /else 'not_submitted'/)
  assert.match(forwardMigration, /create or replace function public\.handle_new_user/)
  assert.doesNotMatch(forwardMigration, /Verification ID is required for member signup/)
  assert.doesNotMatch(forwardMigration, /Verification document is required for member signup/)
  assert.match(forwardMigration, /else 'not_submitted'/)
})

runTest('landing Join CTAs go to invitation', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const authPageStart = landingPage.indexOf('export function LegacyAuthPage')
  const landingMarkup = landingPage.slice(0, authPageStart)

  assert.ok((landingMarkup.match(/to="\/invitation"/g) ?? []).length >= 2)
  assert.doesNotMatch(landingMarkup, /to="\/early-access"/)
  assert.doesNotMatch(landingMarkup, /to="\/join"/)
  assert.match(landingPage, /min-h-\[61px\]/)
  assert.match(landingPage, /How it works/)
  assert.match(landingPage, /Businesses/)
  assert.match(landingPage, /FAQ/)
  assert.match(landingPage, /Join now/)
  assert.match(landingPage, /Join Medellin Rewards/)
  assert.match(landingPage, /Early adopter monthly subscription/)
  assert.doesNotMatch(landingPage, /leadModalOpen/)
  assert.doesNotMatch(landingPage, /memberLeadSchema/)
})

runTest('landing early subscriber section follows the client-focused design', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /Early adopter monthly subscription/)
  assert.match(landingPage, /Early adopter offer/)
  assert.match(landingPage, /Monthly subscription/)
  assert.match(landingPage, /\$100,000 Bonus 100%/)
  assert.match(landingPage, /Member agreement applies/)
  assert.match(landingPage, /View Agreement/)
})

runTest('landing rewards system section explains the flow and disclaimer', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /id="how-it-works"/)
  assert.match(landingPage, /steps\.map/)
  assert.match(landingPage, /lg:grid-cols-4/)
  assert.match(landingPage, /rounded-\[10px\] border border-\[#dfe3e8\] bg-\[#ffffff\]/)
  assert.match(landingPage, /size-\[36px\]/)
  assert.match(landingPage, /Three simple steps to start earning rewards/)
  assert.match(landingPage, /Use your rewards for travel, experiences, and more - free vacation every year\./)
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
  assert.match(earlyAccessPage, /email: z\.string\(\)\.trim\(\)\.min\(1, 'Enter your email'\)\.pipe\(z\.email\('Enter a valid email'\)\)/)
  assert.ok((earlyAccessPage.match(/bg-\[#16a34a\]/g) ?? []).length >= 2)
})

runTest('early access sends welcome email after saving lead without blocking success', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')
  const emailClient = readFileSync('src/features/early-access/welcome-email-service.ts', 'utf8')

  assert.match(earlyAccessPage, /sendEarlyAccessWelcomeEmail/)
  assert.match(emailClient, /\/api\/send-welcome-email/)

  const createLeadIndex = earlyAccessPage.indexOf('earlyAccessService.createLead')
  const sendEmailIndex = earlyAccessPage.indexOf('await sendEarlyAccessWelcomeEmail')
  const resetIndex = earlyAccessPage.indexOf('leadForm.reset(defaultValues)')
  const emailFailureStart = earlyAccessPage.indexOf('catch (emailError)')
  const emailFailureEnd = earlyAccessPage.indexOf('leadForm.reset(defaultValues)')
  const emailFailureBlock = earlyAccessPage.slice(emailFailureStart, emailFailureEnd)

  assert.ok(createLeadIndex > -1)
  assert.ok(sendEmailIndex > createLeadIndex)
  assert.ok(resetIndex > sendEmailIndex)
  assert.match(earlyAccessPage, /email: lead\.email/)
  assert.match(emailFailureBlock, /console\.warn/)
  assert.doesNotMatch(emailFailureBlock, /setSubmitError/)
})

runTest('public invitation route renders the early access page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const invitationRouteStart = router.indexOf("path: '/invitation'")
  const earlyAccessRouteStart = router.indexOf("path: '/early-access'")
  const invitationRoute = router.slice(invitationRouteStart, earlyAccessRouteStart)

  assert.ok(invitationRouteStart > -1)
  assert.match(invitationRoute, /element: <EarlyAccessPage \/>/)
})

runTest('legacy early access route redirects to invitation', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const earlyAccessRouteStart = router.indexOf("path: '/early-access'")
  const landingRouteStart = router.indexOf("path: '/landing-page'")
  const legacyRoute = router.slice(earlyAccessRouteStart, landingRouteStart)

  assert.ok(earlyAccessRouteStart > -1)
  assert.match(legacyRoute, /<Navigate replace to="\/invitation" \/>/)
})

runTest('welcome email does not expose the legacy early access URL', () => {
  const api = readFileSync('api/send-welcome-email.ts', 'utf8')

  assert.doesNotMatch(api, /\/early-access/)
})

runTest('welcome email API uses server-only Hostinger SMTP settings', () => {
  const api = readFileSync('api/send-welcome-email.ts', 'utf8')
  const envExample = readFileSync('.env.example', 'utf8')
  const packageJson = readFileSync('package.json', 'utf8')

  assert.match(api, /nodemailer/)
  assert.match(api, /createTransport/)
  assert.match(api, /process\.env\.SMTP_HOST/)
  assert.match(api, /process\.env\.SMTP_PORT/)
  assert.match(api, /process\.env\.SMTP_SECURE/)
  assert.match(api, /process\.env\.SMTP_USER/)
  assert.match(api, /process\.env\.SMTP_PASS/)
  assert.match(api, /process\.env\.SMTP_FROM/)
  assert.match(api, /Welcome to Medellin Rewards/)
  assert.match(api, /private rewards experience for women who enjoy beautiful places/)
  assert.match(api, /elevated moments/)
  assert.match(api, /lifestyle they already love/)
  assert.match(api, /selected invitations, rewards opportunities, and member updates/)
  assert.match(api, /Selected invitations and early rewards opportunities will be shared/)
  assert.match(api, /html:/)
  assert.match(api, /text:/)
  assert.match(envExample, /SMTP_HOST=smtp\.hostinger\.com/)
  assert.match(envExample, /SMTP_USER=info@medellinrewards\.com/)
  assert.match(packageJson, /"nodemailer"/)

  for (const source of [api, envExample, packageJson]) {
    assert.doesNotMatch(source, /VITE_SMTP/)
  }
})

runTest('root route renders only the early access letter page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const rootRouteStart = router.indexOf('function RootRoute()')
  const protectedRouteStart = router.indexOf('function ProtectedCustomerRoute()')
  const rootRoute = router.slice(rootRouteStart, protectedRouteStart)

  assert.match(rootRoute, /<EarlyAccessPage \/>/)
  assert.doesNotMatch(rootRoute, /<LandingPage \/>/)
  assert.doesNotMatch(rootRoute, /landing-header-figma/)
})

runTest('client landing page is available at /landing-page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')

  assert.match(router, /path: '\/landing-page'/)
  assert.match(router, /element: <LandingPage \/>/)
})

runTest('member auth pages use the approved black and gold portal shell', () => {
  const authShell = readFileSync('src/features/auth/components/auth-portal-shell.tsx', 'utf8')
  const authPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')

  assert.match(authShell, /auth-portal-shell/)
  assert.match(authShell, /auth-portal-backdrop/)
  assert.match(authShell, /radial-gradient/)
  assert.match(authShell, /linear-gradient/)
  assert.doesNotMatch(authShell, /<main className="auth-portal-shell[^"]*bg-\[#000000\]/)
  assert.match(authShell, /ThemeToggle/)
  assert.match(authShell, /LanguagePicker/)
  assert.match(authShell, /useLanguage/)
  assert.match(authShell, /color-mix\(in_srgb,var\(--surface-container-lowest\)/)
  assert.match(authShell, /border-\[#d1ad4a\]/)
  assert.match(authShell, /to="\/signin"/)
  assert.match(authShell, /to="\/join"/)
  assert.match(authShell, /activeTab === 'signin'/)
  assert.match(authShell, /activeTab === 'signup'/)
  assert.match(authPage, /<AuthPortalShell activeTab="signin"/)
  assert.match(joinPage, /<AuthPortalShell activeTab="signup"/)
})

runTest('member sign in page matches the compact portal reference', () => {
  const authPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')
  const authSectionStart = authPage.indexOf('export function AuthPage')
  const authSection = authPage.slice(authSectionStart)

  assert.match(authSection, /t\('Member Portal'\)\.toUpperCase\(\)/)
  assert.match(authSection, /id="signin-email"/)
  assert.match(authSection, /id="signin-password"/)
  assert.match(authSection, /t\('Forgot password\?'\)/)
  assert.match(authSection, /t\('Sign in to my account'\)/)
  assert.match(authSection, /t\("Don't have an account\?"\)/)
  assert.match(authSection, /t\('Join Medellin Rewards'\)/)
  assert.match(language, /'Member Portal': 'Portal de miembro'/)
  assert.match(language, /'Sign in to my account': 'Iniciar sesion en mi cuenta'/)
  assert.match(language, /"Don't have an account\?": 'No tienes cuenta\?'/)
  assert.match(authSection, /Eye/)
  assert.doesNotMatch(authSection, /Sign in to your member account\./)
  assert.doesNotMatch(authSection, /Track your rewards, gift-card value/)
})

runTest('member signup page shares the compact portal reference layout', () => {
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')

  assert.match(joinPage, /t\('Member Portal'\)\.toUpperCase\(\)/)
  assert.match(joinPage, /id="join-name"/)
  assert.match(joinPage, /id="join-email"/)
  assert.match(joinPage, /id="join-password"/)
  assert.match(joinPage, /t\('Create my account'\)/)
  assert.match(joinPage, /t\('Already have an account\?'\)/)
  assert.match(joinPage, /t\('Sign in'\)/)
  assert.match(language, /'Create my account': 'Crear mi cuenta'/)
  assert.match(language, /'Already have an account\?': 'Ya tienes cuenta\?'/)
  assert.match(joinPage, /Eye/)
  assert.doesNotMatch(joinPage, /soft-luxe-shell/)
  assert.doesNotMatch(joinPage, /gold-frame/)
})

runTest('early access typography keeps the launch copy readable', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')

  assert.match(earlyAccessPage, /font-sans/)
  assert.match(earlyAccessPage, /earlyAccessParagraphClass/)
  assert.match(earlyAccessPage, /earlyAccessMessageLines\.slice\(0, 6\)\.map/)
  assert.match(earlyAccessPage, /earlyAccessMessageLines\.slice\(6, 8\)\.map/)
  assert.doesNotMatch(earlyAccessPage, /text-\[clamp\(/)
  assert.doesNotMatch(earlyAccessPage, /text-3xl/)
  assert.doesNotMatch(earlyAccessPage, /text-2xl/)
  assert.doesNotMatch(earlyAccessPage, /text-8xl/)
  assert.doesNotMatch(earlyAccessPage, /text-7xl/)
  assert.doesNotMatch(earlyAccessPage, /text-6xl/)
})

runTest('early access page defaults to Spanish and exposes language picker', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')
  const languagePicker = readFileSync('src/components/language-picker.tsx', 'utf8')

  assert.match(language, /if \(typeof window === 'undefined'\) return 'es'/)
  assert.match(language, /=== 'en' \? 'en' : 'es'/)
  assert.match(languagePicker, /\(\['es', 'en'\] as Language\[\]\)/)
  assert.match(earlyAccessPage, /LanguagePicker/)
  assert.match(earlyAccessPage, /t\(line\)/)
  assert.match(language, /'Hey,': 'Hola,'/)
  assert.match(language, /'Subscribe': 'Suscribirse'/)
  assert.match(language, /'When we officially launch, subscribers will be the first to know/)
})

runTest('all literal translated UI strings have Spanish entries', () => {
  const languageSource = readFileSync('src/lib/language.tsx', 'utf8')
  const translationsSource = languageSource.match(
    /const spanishTranslations: Record<string, string> = \{([\s\S]*?)\n\}/,
  )?.[1]

  assert.ok(translationsSource)

  const translatedKeys = new Set<string>()
  const translationKeyPattern =
    /(?:^|\n)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z][A-Za-z0-9_]*))\s*:/g

  for (const match of translationsSource.matchAll(translationKeyPattern)) {
    translatedKeys.add(match[1] ?? match[2] ?? match[3])
  }

  const usedKeys = new Set<string>()
  const literalTranslationPattern = /\bt\(\s*(?:'([^']+)'|"([^"]+)")/g

  for (const value of Object.values(landingClientHero)) {
    usedKeys.add(value)
  }

  for (const item of [
    ...landingWhyJoinItems,
    ...landingEarlySubscriberBenefits,
    ...landingRewardsSteps,
    ...landingMembershipAdvantages,
  ]) {
    usedKeys.add(item.title)
    usedKeys.add(item.body)
  }

  for (const filePath of getSourceFiles('src')) {
    const source = readFileSync(filePath, 'utf8')

    for (const match of source.matchAll(literalTranslationPattern)) {
      usedKeys.add(match[1] ?? match[2])
    }
  }

  const missingKeys = [...usedKeys].filter((key) => !translatedKeys.has(key)).sort()

  if (missingKeys.length > 0) {
    console.error(`Missing Spanish translation keys:\n${missingKeys.join('\n')}`)
  }

  assert.deepEqual(missingKeys, [])
})

runTest('supabase seed can be rerun without duplicate seeded rows', () => {
  const seed = readFileSync('supabase/seed.sql', 'utf8')

  assert.match(seed, /insert into public\.businesses[\s\S]*on conflict \(slug\) do update/i)
  assert.match(seed, /to_regclass\('public\.business_branding'\)/i)
  assert.match(seed, /insert into public\.business_branding/i)
  assert.match(seed, /unsupported_required_columns/i)
  assert.match(seed, /array_append\(insert_columns, 'slug'\)/i)
  assert.match(seed, /status_data_type = 'USER-DEFINED'/i)
  assert.match(seed, /status_udt_schema/i)
  assert.match(seed, /select id from public\.businesses where slug = 'velvet-brew'/i)
  assert.match(seed, /select id from public\.businesses where slug = 'mystic-coffee'/i)
  assert.match(seed, /delete from public\.rewards[\s\S]*Signature Velvet Latte/i)
  assert.match(seed, /delete from public\.products[\s\S]*Oat Milk Latte/i)
  assert.match(seed, /delete from public\.promotions[\s\S]*Double points after 3 PM/i)
  assert.match(seed, /insert into auth\.users[\s\S]*on conflict \(id\) do update/i)
  assert.match(seed, /insert into auth\.identities[\s\S]*on conflict \(id\) do update/i)
})

runTest('member transaction migration creates QR tokens, transaction ledger, and secure RPCs', () => {
  const migration = readFileSync('supabase/migrations/20260521000000_member_transactions.sql', 'utf8')

  assert.match(migration, /add column if not exists member_qr_token/i)
  assert.match(migration, /add column if not exists reward_rate_percent/i)
  assert.match(migration, /add column if not exists commission_rate_percent/i)
  assert.match(migration, /create type public\.member_transaction_commission_status/i)
  assert.match(migration, /create table if not exists public\.member_transactions/i)
  assert.match(migration, /purchase_amount/i)
  assert.match(migration, /reward_value/i)
  assert.match(migration, /points_awarded/i)
  assert.match(migration, /commission_amount/i)
  assert.match(migration, /client_request_id/i)
  assert.match(migration, /create or replace function public\.get_member_by_qr_token/)
  assert.match(migration, /create or replace function public\.record_member_transaction/)
  assert.match(migration, /member_profile\.verification_status::text <> 'verified'/)
  assert.match(migration, /raise exception 'identity_verification_required'/)
  assert.match(migration, /create or replace function public\.mark_member_transaction_commission_paid/)
  assert.match(migration, /points_awarded_value := floor\(reward_value_value \* 100\)/i)
  assert.match(migration, /commission_rate_percent >= 10/i)
})

runTest('customer profile only exposes the scannable member QR after verification', () => {
  const profilePage = readFileSync('src/features/profile/pages/profile-page.tsx', 'utf8')
  const qrSectionStart = profilePage.indexOf('<h2 className="font-serif text-2xl text-primary">Member QR</h2>')
  const preferencesStart = profilePage.indexOf('<span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t(\'Preferences\')}</span>')

  assert.ok(qrSectionStart > -1)
  assert.ok(preferencesStart > qrSectionStart)

  const qrSection = profilePage.slice(qrSectionStart, preferencesStart)

  assert.match(profilePage, /const isMemberVerified = verificationStatus === 'verified'/)
  assert.match(qrSection, /isMemberVerified && memberQrUrl/)
  assert.match(qrSection, /<QRCodeSVG value=\{memberQrUrl\}/)
  assert.match(profilePage, /Verify your ID to activate your member QR\./)
  assert.match(profilePage, /Your ID is under review\. Your member QR activates after approval\./)
  assert.match(profilePage, /Resubmit ID verification to activate your member QR\./)
  assert.match(qrSection, /href="#id-verification"/)
  assert.match(qrSection, /disabled=\{!isMemberVerified \|\| !memberQrUrl\}/)
})

runTest('business member-sale page clearly blocks unverified scanned QR transactions', () => {
  const page = readFileSync('src/features/business-owner/pages/member-sale-page.tsx', 'utf8')

  assert.match(page, /const isMemberVerified = member\.data\.verificationStatus === 'verified'/)
  assert.match(page, /disabled=\{!isMemberVerified \|\| !preview \|\| recordTransaction\.isPending\}/)
  assert.match(page, /This member QR is not active yet\. Ask the member to complete ID verification before recording rewards\./)
})

runTest('router exposes protected business member-sale route', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')

  assert.match(router, /MemberSalePage/)
  assert.match(router, /path: '\/business\/member-sale\/:token'/)
})

runTest('business transaction page previews rewards and commission before recording sale', () => {
  const page = readFileSync('src/features/business-owner/pages/member-sale-page.tsx', 'utf8')

  assert.match(page, /calculateMemberTransaction/)
  assert.match(page, /purchaseAmount/)
  assert.match(page, /rewardValue/)
  assert.match(page, /pointsAwarded/)
  assert.match(page, /commissionAmount/)
  assert.match(page, /recordTransaction/)
})

runTest('admin members profile panel uses compact stats and action tabs instead of one long vertical card', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const membersStart = adminPage.indexOf('<TabsContent value="members"')
  const catalogStart = adminPage.indexOf('<TabsContent value="catalog"')
  const membersSection = adminPage.slice(membersStart, catalogStart)

  assert.match(membersSection, /member-action-panel/)
  assert.match(membersSection, /member-stat-grid/)
  assert.match(membersSection, /member-action-tabs/)
  assert.match(membersSection, /value="award-points"/)
  assert.match(membersSection, /value="use-credit"/)
  assert.match(membersSection, /value="verification"/)
  assert.match(membersSection, /Profile Summary/)
  assert.match(membersSection, /Recent Value/)
  const profileSummaryIndex = membersSection.indexOf('Profile Summary')
  const actionTabsIndex = membersSection.indexOf('member-action-tabs')
  const summaryBeforeTabs = membersSection.slice(profileSummaryIndex, actionTabsIndex)

  assert.doesNotMatch(summaryBeforeTabs, /Verification ID/)
  assert.doesNotMatch(summaryBeforeTabs, /\{t\('Phone'\)\}/)
})

runTest('admin member action tabs use short labels that fit the compact panel', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const tabsStart = adminPage.indexOf('member-action-tabs')
  const tabsEnd = adminPage.indexOf('<TabsContent value="award-points"')
  const actionTabs = adminPage.slice(tabsStart, tabsEnd)

  assert.match(actionTabs, /grid-cols-\[1fr_1fr_1fr\]/)
  assert.match(actionTabs, /min-w-0/)
  assert.match(actionTabs, /whitespace-normal/)
  assert.match(actionTabs, />ID<\/TabsTrigger>/)
  assert.doesNotMatch(actionTabs, />Verification<\/TabsTrigger>/)
})

runTest('admin layout renders admin portal section navigation inside the sidebar', () => {
  const adminLayout = readFileSync('src/layouts/admin-layout.tsx', 'utf8')

  assert.match(adminLayout, /adminPortalSections/)
  assert.match(adminLayout, /isAdminPortal \? \(/)
  assert.match(adminLayout, /href=\{`\/admin\/portal#\$\{item\.value\}`\}/)
  assert.match(adminLayout, /overflow-y-auto/)
  assert.match(adminLayout, /flex-1 min-h-0/)
  assert.doesNotMatch(adminLayout, /isAdminPortal \? \(\s*<div className="flex-1" \/>/)
})

runTest('admin portal page uses controlled tab content without duplicating sidebar navigation', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const tabsStart = adminPage.indexOf('<Tabs value={activeAdminTab}')
  const membersStart = adminPage.indexOf('<TabsContent value="members"')
  const tabsShell = adminPage.slice(tabsStart, membersStart)

  assert.match(adminPage, /activeAdminTab/)
  assert.match(adminPage, /onValueChange=\{handleAdminTabChange\}/)
  assert.match(adminPage, /hashchange/)
  assert.match(tabsShell, /className="min-w-0 space-y-12"/)
  assert.doesNotMatch(adminPage, /admin-portal-tabs/)
  assert.doesNotMatch(tabsShell, /TabsTrigger value="members"/)
  assert.doesNotMatch(tabsShell, /fixed/)
})

runTest('customer layout exposes full desktop navigation in the header', () => {
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')
  const headerStart = customerLayout.indexOf('<header')
  const mainStart = customerLayout.indexOf('<main')
  const headerMarkup = customerLayout.slice(headerStart, mainStart)

  assert.match(customerLayout, /customerNavigation/)
  assert.match(headerMarkup, /hidden items-center gap-1 lg:flex/)
  assert.match(headerMarkup, /customerNavigation\.map/)
  for (const path of ['/dashboard', '/shop', '/rewards', '/gift-cards', '/activity', '/profile']) {
    assert.match(headerMarkup, new RegExp(`to: '${path}'|to=\\{item\\.to\\}`))
  }
  assert.doesNotMatch(headerMarkup, /<span className="hidden text-xs[^>]*>\s*Home\s*<\/span>/)
})

runTest('customer mobile bottom nav exposes core routes and verification status', () => {
  const bottomNav = readFileSync('src/components/customer-bottom-nav.tsx', 'utf8')
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')

  for (const route of ['/dashboard', '/rewards', '/shop', '/activity', '/profile']) {
    assert.match(bottomNav, new RegExp(`to: '${route}'`))
  }

  for (const label of ['Home', 'Rewards', 'Shop', 'Activity', 'Profile']) {
    assert.match(bottomNav, new RegExp(`label: '${label}'`))
  }

  assert.match(bottomNav, /grid-cols-5/)
  assert.match(bottomNav, /md:hidden/)
  assert.match(bottomNav, /verificationStatus\?: Profile\['verificationStatus'\] \| null/)
  assert.match(bottomNav, /\/profile#id-verification/)
  assert.match(bottomNav, /Verification required/)
  assert.match(bottomNav, /Under review/)
  assert.match(bottomNav, /Needs resubmission/)
  assert.match(bottomNav, /Verified/)
  assert.match(bottomNav, /pathname\.startsWith\(prefix\)/)
  assert.match(bottomNav, /'\/redeem'/)

  assert.match(customerLayout, /<CustomerBottomNav verificationStatus=\{profile\?\.verificationStatus\} \/>/)
  assert.match(customerLayout, /pb-32/)
})

runTest('customer dashboard exposes a guided onboarding checklist', () => {
  const dashboardPage = readFileSync('src/features/dashboard/pages/dashboard-page.tsx', 'utf8')
  const checklist = readFileSync('src/features/dashboard/components/customer-onboarding-checklist.tsx', 'utf8')

  assert.match(dashboardPage, /CustomerOnboardingChecklist/)
  assert.match(dashboardPage, /verificationStatus=\{verificationStatus\}/)
  assert.match(dashboardPage, /isMembershipActive=\{isMembershipActive\}/)
  assert.match(dashboardPage, /points=\{points\}/)
  assert.match(dashboardPage, /recentActivity=\{recentActivity\}/)

  for (const label of ['Account created', 'Verify ID', 'Activate membership', 'Unlock member QR', 'Earn first reward']) {
    assert.match(checklist, new RegExp(label))
  }

  assert.match(checklist, /\/profile#id-verification/)
  assert.match(checklist, /\/membership/)
  assert.match(checklist, /\/profile/)
  assert.match(checklist, /\/shop/)
  assert.match(checklist, /Under review/)
  assert.match(checklist, /Needs resubmission/)
})

runTest('customer dashboard exposes a guided wallet summary', () => {
  const dashboardPage = readFileSync('src/features/dashboard/pages/dashboard-page.tsx', 'utf8')
  const walletSummary = readFileSync('src/features/dashboard/components/customer-wallet-summary.tsx', 'utf8')

  assert.match(dashboardPage, /CustomerWalletSummary/)
  assert.match(dashboardPage, /verificationStatus=\{verificationStatus\}/)
  assert.match(dashboardPage, /isMembershipActive=\{isMembershipActive\}/)
  assert.match(dashboardPage, /points=\{points\}/)
  assert.match(dashboardPage, /availableCredits=\{balance\?\.availableCredits \?\? 0\}/)
  assert.match(dashboardPage, /activeGiftCardCount=\{activeGiftCardCount\}/)

  for (const label of ['Verify ID', 'Activate membership', 'Redeem rewards', 'Browse businesses']) {
    assert.match(walletSummary, new RegExp(label))
  }

  assert.match(walletSummary, /\/profile#id-verification/)
  assert.match(walletSummary, /\/membership/)
  assert.match(walletSummary, /\/rewards/)
  assert.match(walletSummary, /\/shop/)
  assert.match(walletSummary, /Reward wallet/)
  assert.match(walletSummary, /Ready to redeem/)
  assert.match(walletSummary, /Start earning/)

  assert.doesNotMatch(dashboardPage, /<MetricCard[\s\S]*Reward Credits/)
  assert.doesNotMatch(dashboardPage, /<MetricCard[\s\S]*Gift Cards/)
})

runTest('customer header exposes verification status pill', () => {
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')
  const pill = readFileSync('src/features/membership/components/verification-status-pill.tsx', 'utf8')

  assert.match(customerLayout, /VerificationStatusPill/)
  assert.match(customerLayout, /status=\{profile\?\.verificationStatus\}/)
  assert.match(pill, /Verification required/)
  assert.match(pill, /Under review/)
  assert.match(pill, /Verified/)
  assert.match(pill, /Needs resubmission/)
  assert.match(pill, /\/profile#id-verification/)
  assert.match(pill, /\/profile/)
})

runTest('reward cards explain ID verification locked redemption', () => {
  const rewardCard = readFileSync('src/features/rewards/components/reward-card.tsx', 'utf8')

  assert.match(rewardCard, /Verify ID to redeem/)
  assert.doesNotMatch(rewardCard, /\? 'Verify ID'\s*:/)
})

runTest('activity feedback uses clear labels and customer empty actions', () => {
  const activityList = readFileSync('src/features/activity/components/activity-list.tsx', 'utf8')
  const dashboardPage = readFileSync('src/features/dashboard/pages/dashboard-page.tsx', 'utf8')
  const activityPage = readFileSync('src/features/activity/pages/activity-page.tsx', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  for (const label of ['Earned', 'Redeemed', 'Bonus', 'Adjusted', 'Gift card issued', 'Gift card redeemed']) {
    assert.match(activityList, new RegExp(label))
  }

  assert.match(activityList, /emptyActionTo\?: string/)
  assert.match(activityList, /emptyActionLabel\?: string/)
  assert.match(activityList, /Pending/)
  assert.match(activityList, /<Button asChild/)
  assert.match(activityList, /<Link to=\{emptyActionTo\}/)

  assert.match(dashboardPage, /emptyActionTo="\/shop"/)
  assert.match(dashboardPage, /emptyActionLabel="Browse businesses"/)
  assert.match(activityPage, /emptyActionTo="\/shop"/)
  assert.match(activityPage, /emptyActionLabel="Browse businesses"/)
  assert.doesNotMatch(adminPage, /emptyActionTo="\/shop"/)
})

runTest('gift card tiles explain ID verification locked issuance', () => {
  const giftCardTile = readFileSync('src/features/gift-cards/components/gift-card-tile.tsx', 'utf8')

  assert.match(giftCardTile, /Verify ID to issue/)
  assert.doesNotMatch(giftCardTile, /\? t\('Verify ID'\) : t\('Issue'\)/)
})

runTest('gift card catalog exposes claimable filtering and summary feedback', () => {
  const giftCardsPage = readFileSync('src/features/gift-cards/pages/gift-cards-page.tsx', 'utf8')

  assert.match(giftCardsPage, /showClaimableOnly/)
  assert.match(giftCardsPage, /setShowClaimableOnly/)
  assert.match(giftCardsPage, /const catalogItems = catalog\.data \?\? \[\]/)
  assert.match(giftCardsPage, /const claimableGiftCards = catalogItems\.filter/)
  assert.match(giftCardsPage, /balancePoints >= item\.pointsCost/)
  assert.match(giftCardsPage, /!rewardActionsLocked/)
  assert.match(giftCardsPage, /const visibleGiftCards = showClaimableOnly/)
  assert.match(giftCardsPage, /Claimable/)

  for (const label of ['Gift card summary', 'Available points', 'Total gift cards', 'Claimable gift cards', 'Active business']) {
    assert.match(giftCardsPage, new RegExp(label))
  }

  assert.match(giftCardsPage, /No claimable gift cards yet/)
  assert.match(giftCardsPage, /No gift cards for this business/)
  assert.match(giftCardsPage, /Earn more points, verify your ID, or check back when new gift cards are available\./)
  assert.match(giftCardsPage, /Try another business or clear the business filter\./)
})

runTest('checkout and order pages explain purchase feedback and next actions', () => {
  const cartPage = readFileSync('src/features/shop/pages/cart-page.tsx', 'utf8')
  const checkoutPage = readFileSync('src/features/shop/pages/checkout-page.tsx', 'utf8')
  const confirmationPage = readFileSync('src/features/shop/pages/order-confirmation-page.tsx', 'utf8')
  const ordersPage = readFileSync('src/features/shop/pages/orders-page.tsx', 'utf8')

  assert.match(cartPage, /Pick products from participating businesses before checking out\./)
  assert.match(cartPage, /Start shopping/)

  for (const label of [
    'Checkout summary',
    'Items in order',
    'Estimated total',
    'Estimated reward impact',
    'Verification required before earning rewards',
  ]) {
    assert.match(checkoutPage, new RegExp(label))
  }
  assert.match(checkoutPage, /resolvedItems\.reduce\(\(sum, \{ quantity \}\) => sum \+ quantity, 0\)/)

  assert.match(confirmationPage, /to="\/orders"/)
  assert.match(confirmationPage, /to="\/shop"/)
  assert.match(confirmationPage, /to="\/rewards"/)
  assert.match(confirmationPage, /View rewards/)

  assert.match(ordersPage, /Purchases and points earned after checkout will appear here\./)
  assert.match(ordersPage, /Start shopping/)
  assert.match(ordersPage, /to="\/shop"/)
})

runTest('reward catalog exposes claimable filtering and summary feedback', () => {
  const rewardsPage = readFileSync('src/features/rewards/pages/rewards-page.tsx', 'utf8')

  assert.match(rewardsPage, /'Claimable'/)
  assert.match(rewardsPage, /const allRewards = rewards\.data \?\? \[\]/)
  assert.match(rewardsPage, /const claimableRewards = allRewards\.filter/)
  assert.match(rewardsPage, /reward\.inventory > 0/)
  assert.match(rewardsPage, /balancePoints >= reward\.pointsCost/)
  assert.match(rewardsPage, /!rewardActionsLocked/)
  assert.match(rewardsPage, /isMembershipActive/)
  assert.match(rewardsPage, /activeFilter === 'Claimable'/)

  for (const label of ['Catalog summary', 'Available points', 'Total rewards', 'Claimable rewards', 'Active filter']) {
    assert.match(rewardsPage, new RegExp(label))
  }

  assert.match(rewardsPage, /No claimable rewards yet/)
  assert.match(rewardsPage, /No rewards match this filter/)
  assert.match(rewardsPage, /Earn more points, verify your ID, or check back when new rewards are available\./)
  assert.match(rewardsPage, /Try a different category or business filter\./)
})

runTest('admin partners page uses table-first operations layout with modal create flow', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const partnersStart = adminPage.indexOf('<TabsContent value="partners"')
  const nextSectionStart = adminPage.indexOf('<TabsContent value="activity"')
  const partnersSection = adminPage.slice(partnersStart, nextSectionStart)

  assert.match(partnersSection, /partner-operations-layout/)
  assert.match(partnersSection, /partner-create-dialog/)
  assert.match(partnersSection, /partner-management-table/)
  assert.match(partnersSection, /Partner Operations/)
  assert.match(partnersSection, /Create Partner/)
  assert.match(partnersSection, /Recent Referral Activity/)
  assert.match(partnersSection, /Commission Owed/)
  assert.doesNotMatch(partnersSection, /2xl:grid-cols-\[420px_minmax\(0,1fr\)\]/)
  assert.doesNotMatch(partnersSection, /Partner Cards/)
})

runTest('business staff role policy is centralized and marks catalog management owner-only', () => {
  const policy = readFileSync('src/lib/business-role-policy.ts', 'utf8')

  assert.match(policy, /businessOwnerOnlyPaths/)
  assert.match(policy, /businessStaffOperationalPaths/)
  assert.match(policy, /canAccessBusinessPath/)

  for (const path of ['/business/products', '/business/rewards', '/business/promotions', '/business/gift-cards', '/business/settings']) {
    assert.match(policy, new RegExp(`'${path}'`))
  }

  for (const path of ['/business/dashboard', '/business/redemptions', '/business/member-sale', '/business/members', '/business/partners']) {
    assert.match(policy, new RegExp(`'${path}'`))
  }
})

runTest('business staff owner-only routes are guarded and hidden from navigation', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const layout = readFileSync('src/layouts/business-owner-layout.tsx', 'utf8')

  assert.match(router, /OwnerOnlyBusinessRoute/)
  for (const path of ['/business/products', '/business/rewards', '/business/promotions', '/business/gift-cards', '/business/settings']) {
    assert.match(router, new RegExp(`path: '${path.replaceAll('/', '\\/')}'[\\s\\S]*<OwnerOnlyBusinessRoute>`))
  }

  assert.match(layout, /canAccessBusinessPath/)
  assert.match(layout, /businessNavigationItems/)
  assert.doesNotMatch(layout, /\.filter\(\(item\) => !item\.ownerOnly \|\| profile\?\.role === 'business-owner'\)/)
})

runTest('public business page header uses business onboarding actions', () => {
  const layout = readFileSync('src/layouts/public-browse-layout.tsx', 'utf8')

  assert.match(layout, /useLocation/)
  assert.match(layout, /isBusinessOnboarding/)
  assert.match(layout, /href="#book-demo"/)
  assert.match(layout, /to="\/business\/login"/)
  assert.match(layout, /isBusinessOnboarding[\s\S]*Start Onboarding/)
  assert.match(layout, /isBusinessOnboarding[\s\S]*Business Login/)
})

runTest('business login page does not point business users to customer sign in', () => {
  const page = readFileSync('src/features/auth/pages/staff-login-page.tsx', 'utf8')

  assert.match(page, /businessSignInLink/)
  assert.match(page, /businessSignInLink[\s\S]*\/business/)
  assert.doesNotMatch(page, /Public member sign in[\s\S]*to="\/signin"/)
})

runTest('staff permission migration keeps operational access but restricts catalog management', () => {
  const migrations = getFilesByExtension('supabase/migrations', '.sql')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  assert.match(migrations, /can_manage_business_catalog/)
  assert.match(migrations, /jwt_role\(\) = 'business-owner'/)
  assert.match(migrations, /business-staff[\s\S]*record_member_transaction|record_member_transaction[\s\S]*business-staff/)
  assert.match(migrations, /Business owners can create products for their business/)
  assert.match(migrations, /Business owners can create rewards for their business/)
  assert.match(migrations, /Business owners can create promotions/)
})

runTest('workflow QA docs record staff operational policy and seeded workflow command', () => {
  const qaDoc = readFileSync('docs/workflow-qa-2026-05-21.md', 'utf8')

  assert.match(qaDoc, /business staff are operational users/i)
  assert.match(qaDoc, /cannot manage products, rewards, promotions, gift-card catalog, or settings/i)
  assert.match(qaDoc, /npx supabase db reset/)
  assert.match(qaDoc, /npm run test:e2e:workflows/)
})

runTest('package exposes a launch checklist test command', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

  assert.equal(pkg.scripts?.['test:launch'], 'playwright test tests/e2e/launch-checklist.spec.ts')
})

runTest('launch checklist Playwright suite maps to PT001 through PT008', () => {
  const launchChecklist = readFileSync('tests/e2e/launch-checklist.spec.ts', 'utf8')
  const launchHelper = readFileSync('tests/e2e/helpers/supabase.ts', 'utf8')
  const launchCoverage = `${launchChecklist}\n${launchHelper}`

  for (const testId of ['PT001', 'PT002', 'PT003', 'PT004', 'PT005', 'PT006', 'PT007', 'PT008']) {
    assert.match(launchChecklist, new RegExp(`test(?:\\.skip)?\\('${testId}`))
  }

  assert.match(launchChecklist, /test\.skip\([^)]*PT007/)
  assert.match(launchCoverage, /getSupabaseSessionClient/)
  assert.match(launchCoverage, /member_transactions/)
  assert.match(launchCoverage, /early_access_leads/)
})

runTest('launch checklist command enables authenticated workflow tests', () => {
  const envHelper = readFileSync('tests/e2e/helpers/env.ts', 'utf8')

  assert.match(envHelper, /test:e2e:workflows/)
  assert.match(envHelper, /test:launch/)
})

runTest('focused workflow commands enable authenticated workflow tests', () => {
  const envHelper = readFileSync('tests/e2e/helpers/env.ts', 'utf8')

  for (const command of ['test:referrals', 'test:onboarding', 'test:gift-cards', 'test:rewards', 'test:agreements']) {
    assert.match(envHelper, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

runTest('workflow QA docs explain the automated launch checklist command', () => {
  const qaDoc = readFileSync('docs/workflow-qa-2026-05-21.md', 'utf8')

  assert.match(qaDoc, /npm run test:launch/)
  assert.match(qaDoc, /PT001/)
  assert.match(qaDoc, /PT008/)
  assert.match(qaDoc, /Use Playwright pass, fail, and skipped output to update the platform testing log/)
})

runTest('package exposes focused workflow automation commands', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

  assert.equal(pkg.scripts?.['test:referrals'], 'playwright test tests/e2e/referrals.spec.ts')
  assert.equal(pkg.scripts?.['test:onboarding'], 'playwright test tests/e2e/onboarding.spec.ts')
  assert.equal(pkg.scripts?.['test:gift-cards'], 'playwright test tests/e2e/gift-cards.spec.ts')
  assert.equal(pkg.scripts?.['test:rewards'], 'playwright test tests/e2e/rewards-redemption.spec.ts')
  assert.equal(pkg.scripts?.['test:load'], 'playwright test tests/e2e/load.spec.ts')
  assert.equal(pkg.scripts?.['test:agreements'], 'playwright test tests/e2e/agreements.spec.ts')
})

runTest('focused workflow suites cover referrals, onboarding, gift cards, rewards, agreements, and load', () => {
  const expectedSpecs = [
    ['tests/e2e/referrals.spec.ts', ['QR001', 'REF001', 'REF002', 'REF003']],
    ['tests/e2e/onboarding.spec.ts', ['ONB001', 'ONB002', 'ONB003']],
    ['tests/e2e/gift-cards.spec.ts', ['GC001', 'GC002', 'GC003']],
    ['tests/e2e/rewards-redemption.spec.ts', ['RW001', 'RW002', 'RW003']],
    ['tests/e2e/load.spec.ts', ['LOAD001']],
    ['tests/e2e/agreements.spec.ts', ['AGR001', 'AGR002', 'AGR003']],
  ] as const

  for (const [filePath, testIds] of expectedSpecs) {
    const spec = readFileSync(filePath, 'utf8')
    for (const testId of testIds) {
      assert.match(spec, new RegExp(`test\\('${testId}`))
    }
  }
})

runTest('agreement workflow QA has seeded signed and unsigned users', () => {
  const seed = readFileSync('supabase/seed.sql', 'utf8')
  const envHelper = readFileSync('tests/e2e/helpers/env.ts', 'utf8')
  const zeroBalanceMigration = readFileSync('supabase/migrations/20260607000000_allow_zero_signup_reward_balances.sql', 'utf8')

  assert.match(envHelper, /test:agreements/)
  assert.match(envHelper, /agreementPendingCustomer/)
  assert.match(envHelper, /agreementPendingBusinessOwner/)
  assert.match(envHelper, /agreementUnsignedCustomer/)
  assert.match(seed, /agreement-pending-customer@medellin\.test/)
  assert.match(seed, /agreement-pending-owner@velvetbrew\.test/)
  assert.match(seed, /agreement-unsigned-customer@medellin\.test/)
  assert.match(seed, /insert into public\.agreement_acceptances[\s\S]*signature_svg/i)
  assert.match(seed, /data-signature="drawn"/)
  assert.match(zeroBalanceMigration, /tg_table_name = 'reward_balances'/)
  assert.match(zeroBalanceMigration, /coalesce\(new\.points, 0\) = 0/)
  assert.match(zeroBalanceMigration, /coalesce\(new\.available_credits, 0\) = 0/)
})

runTest('Supabase E2E helpers expose workflow assertion utilities', () => {
  const helper = readFileSync('tests/e2e/helpers/supabase.ts', 'utf8')

  for (const helperName of [
    'createAnonymousSupabaseClient',
    'signUpTestCustomer',
    'getBusinessBySlug',
    'getPartnerReferralForCustomer',
    'getLatestGiftCardForCustomer',
    'getLatestRedemptionForCustomer',
  ]) {
    assert.match(helper, new RegExp(`export async function ${helperName}|export function ${helperName}`))
  }
})

runTest('gift card issuing migration enables pgcrypto token generation', () => {
  const migration = readFileSync('supabase/migrations/20260528000000_enable_pgcrypto_for_gift_cards.sql', 'utf8')

  assert.match(migration, /create extension if not exists pgcrypto/i)
  assert.match(migration, /gen_random_bytes/i)
})

runTest('workflow QA docs list focused automation commands', () => {
  const qaDoc = readFileSync('docs/workflow-qa-2026-05-21.md', 'utf8')

  for (const command of [
    'npm run test:referrals',
    'npm run test:onboarding',
    'npm run test:gift-cards',
    'npm run test:rewards',
    'npm run test:load',
    'npm run test:agreements',
  ]) {
    assert.match(qaDoc, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})
