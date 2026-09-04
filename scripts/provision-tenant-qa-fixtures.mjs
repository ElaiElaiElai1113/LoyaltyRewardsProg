import { existsSync, readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim().replace(/^"|"$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadDotEnv()

const configurations = {
  pinas: {
    businessName: 'RewardMe Partner',
    businessSlug: 'rewardme-partner',
    customerEmail: process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test',
    customerName: 'RewardMe Member',
    ownerEmail: process.env.E2E_REWARDME_BUSINESS_OWNER_EMAIL ?? 'owner@rewardme.test',
    ownerName: 'RewardMe Business Owner',
    staffEmail: process.env.E2E_REWARDME_BUSINESS_STAFF_EMAIL ?? 'staff@rewardme.test',
    staffName: 'RewardMe Business Staff',
    adminEmail: process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test',
    adminName: 'Rewards Platform Administrator',
    recoveryRedirect: 'https://rewardme-prod.vercel.app/reset-password',
    phone: '+63 917 555 0101',
    transactionRequestId: 'f1000000-0000-4000-8000-000000000001',
    transactionReceipt: 'REWARDME-001',
  },
  guatemala: {
    businessName: 'Guatemala QA Partner',
    businessSlug: 'guatemala-qa-partner',
    customerEmail: process.env.E2E_GUATEMALA_CUSTOMER_EMAIL ?? 'customer@guatemala.test',
    customerName: 'Guatemala QA Customer',
    ownerEmail: process.env.E2E_GUATEMALA_BUSINESS_OWNER_EMAIL ?? 'owner@guatemala.test',
    ownerName: 'Guatemala QA Owner',
    recoveryRedirect: 'https://guatemalarewards.com/reset-password',
    phone: '+502 5555 0101',
    transactionRequestId: 'f1000000-0000-4000-8000-000000000002',
    transactionReceipt: 'GUATEMALA-QA-001',
  },
}

const programSlug = String(process.env.QA_PROGRAM_SLUG ?? '').trim().toLowerCase()
const configuration = configurations[programSlug]
if (!configuration) {
  throw new Error('QA_PROGRAM_SLUG must be exactly "pinas" or "guatemala".')
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const password = process.env.E2E_PASSWORD
if (!supabaseUrl || !serviceRoleKey || !anonKey || !password) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY, and E2E_PASSWORD are required.')
}
if (password.length < 12) throw new Error('E2E_PASSWORD must be at least 12 characters.')

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: program, error: programError } = await client
  .from('programs')
  .select('id,name,slug,currency,program_subscriptions(status,subscription_plans(code,entitlements))')
  .eq('slug', programSlug)
  .single()
if (programError || !program) throw new Error(`Could not load ${programSlug}: ${programError?.message ?? 'missing program'}`)
if (!program.program_subscriptions?.subscription_plans) {
  throw new Error(`${program.name} has no launch entitlements. Apply the approved entitlement migration first.`)
}

let { data: business, error: businessReadError } = await client
  .from('businesses')
  .select('id,name,slug')
  .eq('program_id', program.id)
  .eq('slug', configuration.businessSlug)
  .maybeSingle()
if (businessReadError) throw businessReadError

if (!business) {
  const { data, error } = await client
    .from('businesses')
    .insert({
      program_id: program.id,
      name: configuration.businessName,
      slug: configuration.businessSlug,
      description: 'Isolated partner used only for authenticated release testing.',
      earn_rate: 10,
      tax_rate: 0,
      currency: program.currency,
      active: true,
    })
    .select('id,name,slug')
    .single()
  if (error || !data) throw new Error(`Could not create QA business: ${error?.message ?? 'missing row'}`)
  business = data
} else {
  const { data, error } = await client
    .from('businesses')
    .update({
      name: configuration.businessName,
      description: 'Isolated partner used only for authenticated release testing.',
      earn_rate: 10,
      tax_rate: 0,
      currency: program.currency,
      active: true,
    })
    .eq('id', business.id)
    .select('id,name,slug')
    .single()
  if (error || !data) throw new Error(`Could not update QA business: ${error?.message ?? 'missing row'}`)
  business = data
}

const usersByEmail = new Map()
for (let page = 1; ; page += 1) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 })
  if (error) throw error
  for (const user of data.users) usersByEmail.set(user.email?.toLowerCase(), user)
  if (data.users.length < 100) break
}

async function ensureUser({ email, fullName, role, businessId = null }) {
  const normalizedEmail = email.trim().toLowerCase()
  const appMetadata = { role, ...(businessId ? { business_id: businessId } : {}) }
  const userMetadata = {
    full_name: fullName,
    phone: configuration.phone,
    active_program_id: program.id,
  }
  let user = usersByEmail.get(normalizedEmail)

  if (user) {
    const { data, error } = await client.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
    if (error || !data.user) throw new Error(`Could not update ${normalizedEmail}: ${error?.message ?? 'missing user'}`)
    user = data.user
  } else {
    const { data, error } = await client.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
    if (error || !data.user) throw new Error(`Could not create ${normalizedEmail}: ${error?.message ?? 'missing user'}`)
    user = data.user
  }

  const { error: profileError } = await client
    .from('profiles')
    .update({
      full_name: fullName,
      email: normalizedEmail,
      phone: configuration.phone,
      role,
      business_id: businessId,
      ...(role === 'customer' ? { verification_status: 'verified' } : {}),
    })
    .eq('id', user.id)
  if (profileError) throw profileError
  return user
}

async function ensureProgramMembership(profileId, role, businessId = null) {
  let query = client
    .from('program_memberships')
    .select('id')
    .eq('program_id', program.id)
    .eq('profile_id', profileId)
    .eq('role', role)
  query = businessId ? query.eq('business_id', businessId) : query.is('business_id', null)
  const { data: existing, error: readError } = await query.maybeSingle()
  if (readError) throw readError

  const write = existing
    ? client.from('program_memberships').update({ status: 'active' }).eq('id', existing.id)
    : client.from('program_memberships').insert({
        program_id: program.id,
        profile_id: profileId,
        role,
        status: 'active',
        business_id: businessId,
      })
  const { error } = await write
  if (error) throw error
}

const customer = await ensureUser({
  email: configuration.customerEmail,
  fullName: configuration.customerName,
  role: 'customer',
})
const owner = await ensureUser({
  email: configuration.ownerEmail,
  fullName: configuration.ownerName,
  role: 'business-owner',
  businessId: business.id,
})
const staff = configuration.staffEmail
  ? await ensureUser({
      email: configuration.staffEmail,
      fullName: configuration.staffName,
      role: 'business-staff',
      businessId: business.id,
    })
  : null
const admin = configuration.adminEmail
  ? await ensureUser({
      email: configuration.adminEmail,
      fullName: configuration.adminName,
      role: 'platform-admin',
    })
  : null

await ensureProgramMembership(customer.id, 'member')
await ensureProgramMembership(owner.id, 'business-owner', business.id)
if (staff) await ensureProgramMembership(staff.id, 'business-staff', business.id)

// New auth identities can briefly receive a member row before the final QA role
// is applied. Remove that transitional access so every QA account has one
// intentional tenant role and the global platform admin has no tenant membership.
const nonMemberProfiles = [owner.id, staff?.id, admin?.id].filter(Boolean)
if (nonMemberProfiles.length) {
  const { error: transitionalMembershipError } = await client
    .from('program_memberships')
    .delete()
    .eq('program_id', program.id)
    .eq('role', 'member')
    .in('profile_id', nonMemberProfiles)
  if (transitionalMembershipError) throw transitionalMembershipError
}

const { error: balanceError } = await client.from('reward_balances').upsert({
  program_id: program.id,
  profile_id: customer.id,
  points: 1000,
  next_reward_points: 300,
  available_credits: 0,
}, { onConflict: 'program_id,profile_id' })
if (balanceError) throw balanceError

const { error: linkError } = await client.from('business_customer_links').upsert({
  program_id: program.id,
  business_id: business.id,
  profile_id: customer.id,
  linked_by: owner.id,
  source: 'registration',
}, { onConflict: 'program_id,business_id,profile_id' })
if (linkError) throw linkError

async function ensureCatalogRow(table, title, values) {
  const { data: existing, error: readError } = await client
    .from(table)
    .select('id')
    .eq('program_id', program.id)
    .eq('business_id', business.id)
    .eq('title', title)
    .maybeSingle()
  if (readError) throw readError
  if (existing) return existing.id
  const { data, error } = await client
    .from(table)
    .insert({ program_id: program.id, business_id: business.id, title, ...values })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Could not seed ${table}: ${error?.message ?? 'missing row'}`)
  return data.id
}

const catalogLabels = programSlug === 'pinas'
  ? {
      product: 'Member Coffee',
      reward: 'Welcome Reward',
      giftCard: 'RewardMe Gift Card',
      promotion: 'Member Bonus',
    }
  : {
      product: 'QA Coffee',
      reward: 'QA Welcome Reward',
      giftCard: 'QA Gift Card',
      promotion: 'QA Member Bonus',
    }

await ensureCatalogRow('products', catalogLabels.product, {
  description: 'Authenticated member catalog product.',
  category: 'Coffee',
  price: 5,
  inventory: 100,
  featured: false,
  highlight: 'Member favorite',
})
await ensureCatalogRow('rewards', catalogLabels.reward, {
  description: 'Authenticated member catalog reward.',
  category: 'Drink',
  points_cost: 10,
  inventory: 100,
  featured: false,
  highlight: 'Welcome offer',
})
const giftCardCatalogId = await ensureCatalogRow('gift_card_catalog', catalogLabels.giftCard, {
  description: 'Authenticated member gift card.',
  points_cost: 10,
  value_label: `${program.currency} 5`,
  expiry_days: 30,
  is_active: true,
  created_by: owner.id,
})
await ensureCatalogRow('promotions', catalogLabels.promotion, {
  description: 'Authenticated member promotion.',
  badge: 'Member offer',
  cta: 'View partner',
  audience: 'RewardMe members',
  expires_at: '2099-12-31T23:59:59.000Z',
  active: true,
})

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let { data: customerProfile, error: customerProfileError } = await client
  .from('profiles')
  .select('member_qr_token')
  .eq('id', customer.id)
  .single()
if (customerProfileError || !customerProfile) {
  throw new Error(`Could not load QA member QR token: ${customerProfileError?.message ?? 'missing profile'}`)
}
if (!customerProfile.member_qr_token) {
  const generatedQrToken = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '')
  const { data, error } = await client
    .from('profiles')
    .update({ member_qr_token: generatedQrToken })
    .eq('id', customer.id)
    .select('member_qr_token')
    .single()
  if (error || !data?.member_qr_token) {
    throw new Error(`Could not create QA member QR token: ${error?.message ?? 'missing token'}`)
  }
  customerProfile = data
}

const { error: ownerSignInError } = await authClient.auth.signInWithPassword({
  email: configuration.ownerEmail,
  password,
})
if (ownerSignInError) throw new Error(`Could not sign in QA owner for fixture creation: ${ownerSignInError.message}`)
const { data: transactionFixture, error: transactionFixtureError } = await authClient.rpc(
  'record_member_transaction',
  {
    p_member_qr_token: customerProfile.member_qr_token,
    p_purchase_amount: 25,
    p_receipt_number: configuration.transactionReceipt,
    p_note: 'Permanent launch account transaction.',
    p_client_request_id: configuration.transactionRequestId,
  },
)
if (transactionFixtureError || !transactionFixture) {
  throw new Error(`Could not create QA transaction: ${transactionFixtureError?.message ?? 'missing row'}`)
}
const transactionFixtureRow = Array.isArray(transactionFixture) ? transactionFixture[0] : transactionFixture
if (!transactionFixtureRow?.id) throw new Error('Could not read the created QA transaction.')
const { error: activityBrandError } = await client
  .from('activities')
  .update({ title: `Purchase at ${configuration.businessName} - ${program.currency} 25.00` })
  .eq('program_id', program.id)
  .eq('profile_id', customer.id)
  .eq('business_id', business.id)
  .eq('type', 'earned')
  .like('description', `%${configuration.transactionReceipt}%`)
if (activityBrandError) throw new Error(`Could not brand QA activity: ${activityBrandError.message}`)
await authClient.auth.signOut()

let { data: giftCardFixture, error: giftCardReadError } = await client
  .from('gift_cards')
  .select('id,status')
  .eq('program_id', program.id)
  .eq('catalog_id', giftCardCatalogId)
  .eq('customer_id', customer.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
if (giftCardReadError) throw giftCardReadError

if (!giftCardFixture) {
  const { error: customerSignInError } = await authClient.auth.signInWithPassword({
    email: configuration.customerEmail,
    password,
  })
  if (customerSignInError) {
    throw new Error(`Could not sign in QA member for gift-card fixture creation: ${customerSignInError.message}`)
  }
  const { data, error } = await authClient.rpc('issue_gift_card', {
    p_catalog_id: giftCardCatalogId,
    p_customer_id: customer.id,
  })
  if (error || !data) throw new Error(`Could not issue QA gift card: ${error?.message ?? 'missing row'}`)
  const issuedGiftCard = Array.isArray(data) ? data[0] : data
  if (!issuedGiftCard?.id) throw new Error('Could not read the issued QA gift card.')
  giftCardFixture = issuedGiftCard
  await authClient.auth.signOut()
}
if (!giftCardFixture?.id) throw new Error('Could not load the QA gift-card fixture.')

const qaAccountEmails = [
  configuration.customerEmail,
  configuration.ownerEmail,
  configuration.staffEmail,
  configuration.adminEmail,
].filter(Boolean)

for (const email of qaAccountEmails) {
  const { error } = await authClient.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login verification failed for ${email}: ${error.message}`)
  await authClient.auth.signOut()
}

const { data: recoveryLink, error: recoveryLinkError } = await client.auth.admin.generateLink({
  type: 'recovery',
  email: configuration.customerEmail,
  options: { redirectTo: configuration.recoveryRedirect },
})
if (recoveryLinkError || !recoveryLink.properties) {
  throw new Error(`Recovery-link verification failed: ${recoveryLinkError?.message ?? 'missing link properties'}`)
}
if (recoveryLink.properties.redirect_to !== configuration.recoveryRedirect) {
  throw new Error('Recovery-link verification returned an unexpected redirect.')
}

console.log(JSON.stringify({
  program: program.slug,
  business: business.slug,
  businessName: business.name,
  accounts: qaAccountEmails,
  passwordLoginVerified: true,
  passwordRecoveryRedirectVerified: true,
  transactionFixtureId: transactionFixtureRow.id,
  giftCardFixtureId: giftCardFixture.id,
  planAdministration: 'manual',
  isolatedProgramRolesVerified: true,
}, null, 2))
