import { existsSync, readFileSync } from 'node:fs'

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
  .eq('slug', 'wondertown')
  .single()

if (programError || !program) {
  throw new Error(`Could not load Wondertown Rewards: ${programError?.message ?? 'missing program'}`)
}
if (program.program_subscriptions?.status !== 'trialing'
  || program.program_subscriptions?.subscription_plans?.code !== 'launch') {
  throw new Error('Wondertown Rewards does not have the expected non-Stripe launch entitlement.')
}

const businessFixtures = [
  {
    slug: 'wondertown-moonbeam-cafe',
    name: 'Moonbeam Café',
    description: 'Cozy cups, cloud-soft pastries, and a little starlight with every visit.',
    address: '1 Starlight Square, Wondertown',
    latitude: 39.8301,
    longitude: -98.5795,
    rewardRate: 15,
    commissionRate: 15,
    product: {
      title: 'Starlight Latte', description: 'Vanilla oat latte dusted with cinnamon stars.',
      category: 'Coffee', price: 6, highlight: 'Town favorite',
    },
    reward: {
      title: 'Moonbeam Breakfast', description: 'A cozy breakfast pairing for a bright start.',
      category: 'Experience', pointsCost: 240, highlight: 'Morning magic',
    },
    giftCard: {
      title: 'Moonbeam Gift Card', description: 'Coffee, pastries, and a table by the window.',
      pointsCost: 500, valueLabel: '$25',
    },
    promotion: {
      title: 'Twilight Treat', description: 'Earn double Sparks after 4 p.m. during the demo.',
      badge: '2× Sparks', cta: 'Visit Moonbeam Café', audience: 'All Wondertown members',
    },
  },
  {
    slug: 'wondertown-dragonfly-books',
    name: 'Dragonfly Books',
    description: 'Stories, stationery, and unexpected treasures for wonderfully curious people.',
    address: '8 Storybook Lane, Wondertown',
    latitude: 39.8311,
    longitude: -98.5778,
    rewardRate: 12,
    commissionRate: 15,
    product: {
      title: 'Pocket Constellation Journal', description: 'A clothbound notebook for bright ideas.',
      category: 'Merch', price: 18, highlight: 'New arrival',
    },
    reward: {
      title: 'Mystery Book Bundle', description: 'Three surprise reads selected by the bookseller.',
      category: 'Merch', pointsCost: 650, highlight: 'Curious pick',
    },
    giftCard: {
      title: 'Dragonfly Gift Card', description: 'A little credit for the next great story.',
      pointsCost: 600, valueLabel: '$30',
    },
    promotion: {
      title: 'Secret Shelf Saturday', description: 'A rotating demo offer for curious readers.',
      badge: 'Members only', cta: 'Browse the shelves', audience: 'Members',
    },
  },
  {
    slug: 'wondertown-stardust-salon',
    name: 'Stardust Salon',
    description: 'Fresh looks, bright moods, and feel-good rewards from neighborhood stylists.',
    address: '22 Comet Crescent, Wondertown',
    latitude: 39.8286,
    longitude: -98.5769,
    rewardRate: 20,
    commissionRate: 18,
    product: {
      title: 'Shine Serum', description: 'A lightweight finishing serum with a soft floral scent.',
      category: 'Merch', price: 24, highlight: 'Stylist pick',
    },
    reward: {
      title: 'Stardust Mini Makeover', description: 'A playful styling refresh for your next outing.',
      category: 'Experience', pointsCost: 900, highlight: 'Feel luminous',
    },
    giftCard: {
      title: 'Stardust Gift Card', description: 'A little glow-up for someone wonderful.',
      pointsCost: 800, valueLabel: '$40',
    },
    promotion: {
      title: 'Glow Hour', description: 'Bonus Sparks on selected fictional salon services.',
      badge: '+100 Sparks', cta: 'Book a demo visit', audience: 'All Wondertown members',
    },
  },
  {
    slug: 'wondertown-lantern-hotel',
    name: 'Lantern Hotel',
    description: 'A storybook stay in the heart of town, complete with warm local charm.',
    address: '4 Lantern Walk, Wondertown',
    latitude: 39.8269,
    longitude: -98.5815,
    rewardRate: 18,
    commissionRate: 20,
    product: {
      title: 'Wondertown Postcard Set', description: 'Six illustrated keepsakes from around town.',
      category: 'Merch', price: 12, highlight: 'Take Wondertown home',
    },
    reward: {
      title: 'Lantern Afternoon Tea', description: 'Tea and tiny cakes in the hotel conservatory.',
      category: 'Experience', pointsCost: 1200, highlight: 'Slow afternoon',
    },
    giftCard: {
      title: 'Lantern Stay Credit', description: 'Fictional hotel credit for testing gift-card flows.',
      pointsCost: 2000, valueLabel: '$100',
    },
    promotion: {
      title: 'Stay a Little Longer', description: 'A sample late-checkout offer for demo members.',
      badge: 'Demo perk', cta: 'Explore the hotel', audience: 'Members',
    },
  },
  {
    slug: 'wondertown-cloud-nine-bakery',
    name: 'Cloud Nine Bakery',
    description: 'Dreamy bakes made every morning for celebrations and ordinary Tuesdays.',
    address: '9 Sprinkle Street, Wondertown',
    latitude: 39.8277,
    longitude: -98.5831,
    rewardRate: 10,
    commissionRate: 15,
    product: {
      title: 'Cloud Croissant Box', description: 'A flaky four-pack made for sharing.',
      category: 'Pastry', price: 16, highlight: 'Baked today',
    },
    reward: {
      title: 'Birthday Sprinkle Upgrade', description: 'Add a little celebration to any bakery order.',
      category: 'Pastry', pointsCost: 300, highlight: 'Tiny celebration',
    },
    giftCard: {
      title: 'Cloud Nine Gift Card', description: 'A sweet invitation to pick something from the case.',
      pointsCost: 400, valueLabel: '$20',
    },
    promotion: {
      title: 'First Batch Bonus', description: 'Sample morning bonus for early Wondertown visitors.',
      badge: 'Morning bonus', cta: 'Visit the bakery', audience: 'All Wondertown members',
    },
  },
]

async function ensureBusiness(fixture) {
  const values = {
    program_id: program.id,
    slug: fixture.slug,
    name: fixture.name,
    description: fixture.description,
    address: fixture.address,
    latitude: fixture.latitude,
    longitude: fixture.longitude,
    earn_rate: fixture.rewardRate,
    reward_rate_percent: fixture.rewardRate,
    commission_rate_percent: fixture.commissionRate,
    tax_rate: 0,
    currency: program.currency,
    active: true,
  }
  const { data: existing, error: readError } = await client
    .from('businesses')
    .select('id')
    .eq('slug', fixture.slug)
    .maybeSingle()
  if (readError) throw readError

  if (existing) {
    const { data, error } = await client.from('businesses').update(values).eq('id', existing.id).select('*').single()
    if (error || !data) throw new Error(`Could not update ${fixture.name}: ${error?.message ?? 'missing row'}`)
    return data
  }

  const { data, error } = await client.from('businesses').insert(values).select('*').single()
  if (error || !data) throw new Error(`Could not create ${fixture.name}: ${error?.message ?? 'missing row'}`)
  return data
}

const businesses = new Map()
for (const fixture of businessFixtures) {
  businesses.set(fixture.slug, await ensureBusiness(fixture))
}
const moonbeam = businesses.get('wondertown-moonbeam-cafe')

const usersByEmail = new Map()
for (let page = 1; ; page += 1) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 })
  if (error) throw error
  for (const user of data.users) usersByEmail.set(user.email?.toLowerCase(), user)
  if (data.users.length < 100) break
}

async function ensureUser({ email, fullName, role, businessId = null, favoriteOrder = '' }) {
  const normalizedEmail = email.trim().toLowerCase()
  const appMetadata = { role, active_program_id: program.id, ...(businessId ? { business_id: businessId } : {}) }
  const userMetadata = {
    full_name: fullName,
    phone: '+1 555 019 2026',
    location: 'Wondertown Square',
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
    usersByEmail.set(normalizedEmail, user)
  }

  const { error: profileError } = await client
    .from('profiles')
    .update({
      full_name: fullName,
      email: normalizedEmail,
      phone: '+1 555 019 2026',
      location: 'Wondertown Square',
      favorite_order: favoriteOrder,
      role,
      business_id: businessId,
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

const member = await ensureUser({
  email: process.env.E2E_WONDERTOWN_CUSTOMER_EMAIL ?? 'member@wondertown.test',
  fullName: 'Wendy Wonder',
  role: 'customer',
  favoriteOrder: 'Starlight latte, extra cinnamon',
})
const neighbor = await ensureUser({
  email: process.env.E2E_WONDERTOWN_NEIGHBOR_EMAIL ?? 'neighbor@wondertown.test',
  fullName: 'Nico Neighbor',
  role: 'customer',
  favoriteOrder: 'Cloud croissant box',
})
const owner = await ensureUser({
  email: process.env.E2E_WONDERTOWN_BUSINESS_OWNER_EMAIL ?? 'owner@wondertown.test',
  fullName: 'Mira Moonbeam',
  role: 'business-owner',
  businessId: moonbeam.id,
})
const staff = await ensureUser({
  email: process.env.E2E_WONDERTOWN_BUSINESS_STAFF_EMAIL ?? 'staff@wondertown.test',
  fullName: 'Sam Starlight',
  role: 'business-staff',
  businessId: moonbeam.id,
})

await ensureProgramMembership(member.id, 'member')
await ensureProgramMembership(neighbor.id, 'member')
await ensureProgramMembership(owner.id, 'business-owner', moonbeam.id)
await ensureProgramMembership(staff.id, 'business-staff', moonbeam.id)

// The auth profile trigger initially treats a brand-new identity as a member
// before this provisioner applies its final business role. Remove that
// transitional membership so every permanent account has one unambiguous role.
const { error: transitionalMembershipError } = await client
  .from('program_memberships')
  .delete()
  .eq('program_id', program.id)
  .eq('role', 'member')
  .in('profile_id', [owner.id, staff.id])
if (transitionalMembershipError) throw transitionalMembershipError

const { error: ownerAssignmentError } = await client
  .from('businesses')
  .update({ owner_profile_id: owner.id })
  .eq('id', moonbeam.id)
if (ownerAssignmentError) throw ownerAssignmentError

for (const [profileId, points] of [[member.id, 1500], [neighbor.id, 725]]) {
  const { error } = await client.from('reward_balances').upsert({
    program_id: program.id,
    profile_id: profileId,
    points,
    next_reward_points: 2000,
    available_credits: 0,
  }, { onConflict: 'program_id,profile_id' })
  if (error) throw error

  const { error: linkError } = await client.from('business_customer_links').upsert({
    program_id: program.id,
    business_id: moonbeam.id,
    profile_id: profileId,
    linked_by: owner.id,
    source: 'registration',
  }, { onConflict: 'program_id,business_id,profile_id' })
  if (linkError) throw linkError
}

async function ensureCatalogRow(table, businessId, title, values) {
  const { data: existing, error: readError } = await client
    .from(table)
    .select('id')
    .eq('program_id', program.id)
    .eq('business_id', businessId)
    .eq('title', title)
    .maybeSingle()
  if (readError) throw readError
  if (existing) {
    const { error } = await client.from(table).update(values).eq('id', existing.id)
    if (error) throw error
    return existing.id
  }
  const { data, error } = await client
    .from(table)
    .insert({ program_id: program.id, business_id: businessId, title, ...values })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Could not seed ${table}: ${error?.message ?? 'missing row'}`)
  return data.id
}

for (const fixture of businessFixtures) {
  const business = businesses.get(fixture.slug)
  await ensureCatalogRow('products', business.id, fixture.product.title, {
    description: fixture.product.description,
    category: fixture.product.category,
    price: fixture.product.price,
    inventory: 100,
    featured: fixture.slug === 'wondertown-moonbeam-cafe',
    highlight: fixture.product.highlight,
  })
  await ensureCatalogRow('rewards', business.id, fixture.reward.title, {
    description: fixture.reward.description,
    category: fixture.reward.category,
    points_cost: fixture.reward.pointsCost,
    inventory: 100,
    featured: fixture.slug === 'wondertown-moonbeam-cafe',
    highlight: fixture.reward.highlight,
  })
  await ensureCatalogRow('gift_card_catalog', business.id, fixture.giftCard.title, {
    description: fixture.giftCard.description,
    points_cost: fixture.giftCard.pointsCost,
    value_label: fixture.giftCard.valueLabel,
    expiry_days: 90,
    is_active: true,
    created_by: owner.id,
  })
  await ensureCatalogRow('promotions', business.id, fixture.promotion.title, {
    description: fixture.promotion.description,
    badge: fixture.promotion.badge,
    cta: fixture.promotion.cta,
    audience: fixture.promotion.audience,
    expires_at: '2099-12-31T23:59:59.000Z',
    active: true,
  })
}

async function ensureWelcomeActivity(profileId, points) {
  const { data: existing, error: readError } = await client
    .from('activities')
    .select('id')
    .eq('program_id', program.id)
    .eq('profile_id', profileId)
    .eq('title', 'Welcome to Wondertown')
    .maybeSingle()
  if (readError) throw readError
  if (existing) return
  const { error } = await client.from('activities').insert({
    program_id: program.id,
    profile_id: profileId,
    business_id: moonbeam.id,
    type: 'bonus',
    title: 'Welcome to Wondertown',
    description: 'Demo Sparks added so every member flow is ready to explore.',
    points,
    status: 'posted',
  })
  if (error) throw error
}

await ensureWelcomeActivity(member.id, 1500)
await ensureWelcomeActivity(neighbor.id, 725)

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
for (const email of [member.email, owner.email, staff.email]) {
  const { error } = await authClient.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login verification failed for ${email}: ${error.message}`)
  await authClient.auth.signOut()
}

const { data: memberProfile, error: profileError } = await client
  .from('profiles')
  .select('member_qr_token,phone,location')
  .eq('id', member.id)
  .single()
if (profileError || !memberProfile?.member_qr_token) {
  throw new Error(`Wondertown member QR verification failed: ${profileError?.message ?? 'missing token'}`)
}
if (!memberProfile.phone || !memberProfile.location) {
  throw new Error('Wondertown member contact details were not persisted.')
}

console.log(JSON.stringify({
  program: program.name,
  hostname: 'wondertown-rewards.vercel.app',
  businesses: businessFixtures.map((fixture) => fixture.name),
  accounts: {
    member: member.email,
    neighbor: neighbor.email,
    owner: owner.email,
    staff: staff.email,
  },
  catalogCounts: {
    products: businessFixtures.length,
    rewards: businessFixtures.length,
    giftCards: businessFixtures.length,
    promotions: businessFixtures.length,
  },
  passwordVerified: true,
  memberQrVerified: true,
  contactDetailsVerified: true,
}, null, 2))
