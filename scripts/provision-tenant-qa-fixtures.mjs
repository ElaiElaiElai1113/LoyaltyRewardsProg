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

const configurations = {
  pinas: {
    businessName: 'RewardMe QA Partner',
    businessSlug: 'pinas-qa-partner',
    customerEmail: process.env.E2E_PINAS_CUSTOMER_EMAIL ?? 'customer@pinas.test',
    customerName: 'RewardMe QA Customer',
    ownerEmail: process.env.E2E_PINAS_BUSINESS_OWNER_EMAIL ?? 'owner@pinas.test',
    ownerName: 'RewardMe QA Owner',
    phone: '+63 917 555 0101',
  },
  guatemala: {
    businessName: 'Guatemala QA Partner',
    businessSlug: 'guatemala-qa-partner',
    customerEmail: process.env.E2E_GUATEMALA_CUSTOMER_EMAIL ?? 'customer@guatemala.test',
    customerName: 'Guatemala QA Customer',
    ownerEmail: process.env.E2E_GUATEMALA_BUSINESS_OWNER_EMAIL ?? 'owner@guatemala.test',
    ownerName: 'Guatemala QA Owner',
    phone: '+502 5555 0101',
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

await ensureProgramMembership(customer.id, 'member')
await ensureProgramMembership(owner.id, 'business-owner', business.id)

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

await ensureCatalogRow('products', 'QA Coffee', {
  description: 'Authenticated tenant QA product.',
  category: 'Coffee',
  price: 5,
  inventory: 100,
  featured: false,
  highlight: 'QA fixture',
})
await ensureCatalogRow('rewards', 'QA Welcome Reward', {
  description: 'Authenticated tenant QA reward.',
  category: 'Drink',
  points_cost: 10,
  inventory: 100,
  featured: false,
  highlight: 'QA fixture',
})
await ensureCatalogRow('gift_card_catalog', 'QA Gift Card', {
  description: 'Authenticated tenant QA gift card.',
  points_cost: 10,
  value_label: `${program.currency} 5`,
  expiry_days: 30,
  is_active: true,
  created_by: owner.id,
})

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
for (const email of [configuration.customerEmail, configuration.ownerEmail]) {
  const { error } = await authClient.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login verification failed for ${email}: ${error.message}`)
  await authClient.auth.signOut()
}

console.log(JSON.stringify({
  program: program.slug,
  business: business.slug,
  accounts: [configuration.customerEmail, configuration.ownerEmail],
  passwordLoginVerified: true,
  billingConfigured: false,
}, null, 2))
