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
const password = process.env.E2E_PASSWORD

if (!supabaseUrl || !serviceRoleKey || !password) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and E2E_PASSWORD are required.')
}

if (password.length < 12) {
  throw new Error('E2E_PASSWORD must be at least 12 characters for production QA accounts.')
}

const accounts = [
  { email: process.env.E2E_CUSTOMER_EMAIL ?? 'customer@medellin.test', role: 'customer', name: 'E2E Verified Customer' },
  { email: process.env.E2E_UNVERIFIED_CUSTOMER_EMAIL ?? 'unverified@medellin.test', role: 'customer', name: 'E2E Unverified Customer' },
  { email: process.env.E2E_BUSINESS_STAFF_EMAIL ?? 'staff@velvetbrew.test', role: 'business-staff', name: 'E2E Pinas Staff' },
  { email: process.env.E2E_BUSINESS_OWNER_EMAIL ?? 'owner@velvetbrew.test', role: 'business-owner', name: 'E2E Pinas Owner' },
  { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@medellin.test', role: 'platform-admin', name: 'E2E Platform Admin' },
  { email: process.env.E2E_AGREEMENT_PENDING_CUSTOMER_EMAIL ?? 'agreement-pending-customer@medellin.test', role: 'customer', name: 'E2E Agreement Pending Customer' },
  { email: process.env.E2E_AGREEMENT_PENDING_BUSINESS_OWNER_EMAIL ?? 'agreement-pending-owner@velvetbrew.test', role: 'business-owner', name: 'E2E Agreement Pending Owner' },
  { email: process.env.E2E_AGREEMENT_UNSIGNED_CUSTOMER_EMAIL ?? 'agreement-unsigned-customer@medellin.test', role: 'customer', name: 'E2E Unsigned Agreement Customer' },
]

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const usersByEmail = new Map()
for (let page = 1; ; page += 1) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 })
  if (error) throw error
  for (const user of data.users) usersByEmail.set(user.email?.toLowerCase(), user)
  if (data.users.length < 100) break
}

const qaProgramSlug = process.env.QA_PROGRAM_SLUG ?? 'pinas'
const { data: pinasProgram, error: programError } = await client
  .from('programs')
  .select('id')
  .eq('slug', qaProgramSlug)
  .single()
if (programError) throw programError

let { data: qaBusiness, error: businessReadError } = await client
  .from('businesses')
  .select('id')
  .eq('program_id', pinasProgram.id)
  .eq('slug', process.env.QA_BUSINESS_SLUG ?? 'pinas-qa-partner')
  .maybeSingle()
if (businessReadError) throw businessReadError

if (!qaBusiness && process.env.QA_ALLOW_BUSINESS_CREATE === 'true') {
  const { data, error } = await client
    .from('businesses')
    .insert({
      program_id: pinasProgram.id,
      name: 'Pinas QA Partner',
      slug: 'pinas-qa-partner',
      description: 'Isolated partner used only for release acceptance testing.',
      earn_rate: 10,
      tax_rate: 0.12,
      currency: 'PHP',
      active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  qaBusiness = data
}

const provisionableAccounts = qaBusiness
  ? accounts
  : accounts.filter((account) => !account.role.startsWith('business-'))

for (const account of accounts) {
  if (!provisionableAccounts.includes(account)) continue
  const businessId = account.role.startsWith('business-') ? qaBusiness.id : undefined
  let user = usersByEmail.get(account.email.toLowerCase())

  if (!user) {
    if (process.env.QA_ALLOW_USER_CREATE !== 'true') {
      console.warn(`Skipped missing QA account ${account.email}; set QA_ALLOW_USER_CREATE=true to provision it intentionally.`)
      continue
    }
    const { data, error } = await client.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      app_metadata: { role: account.role, ...(businessId ? { business_id: businessId } : {}) },
      user_metadata: { full_name: account.name, phone: '+639000000000' },
    })
    if (error) throw new Error(`Could not create ${account.email}: ${error.message}`)
    user = data.user
  } else {
    const { error } = await client.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: { role: account.role, ...(businessId ? { business_id: businessId } : {}) },
    })
    if (error) throw new Error(`Could not reset ${account.email}: ${error.message}`)
  }

  const { error: profileError } = await client
    .from('profiles')
    .update({ role: account.role, business_id: businessId ?? null })
    .eq('id', user.id)
  if (profileError) throw profileError

  if (account.role !== 'platform-admin' && process.env.QA_ASSIGN_PROGRAM_MEMBERSHIPS === 'true') {
    const programRole = account.role === 'customer' ? 'member' : account.role
    const { data: existingMembership, error: membershipReadError } = await client
      .from('program_memberships')
      .select('id')
      .eq('program_id', pinasProgram.id)
      .eq('profile_id', user.id)
      .eq('role', programRole)
      .maybeSingle()
    if (membershipReadError) throw membershipReadError

    const membershipWrite = existingMembership
      ? client.from('program_memberships').update({
          status: 'active',
          business_id: businessId ?? null,
        }).eq('id', existingMembership.id)
      : client.from('program_memberships').insert({
          program_id: pinasProgram.id,
          profile_id: user.id,
          role: programRole,
          status: 'active',
          business_id: businessId ?? null,
        })
    const { error: membershipError } = await membershipWrite
    if (membershipError) throw membershipError

    if (account.role === 'customer') {
      const { error: balanceError } = await client.from('reward_balances').upsert(
        { program_id: pinasProgram.id, profile_id: user.id, points: 0, next_reward_points: 300, available_credits: 0 },
        { onConflict: 'program_id,profile_id' },
      )
      if (balanceError) throw balanceError
    }
  }
}

console.log(`Provisioned or reset ${provisionableAccounts.length} isolated QA accounts without changing real user accounts.`)
if (!qaBusiness) {
  console.warn('Skipped business QA accounts because no designated Pinas business exists and plan limits must not be bypassed.')
}
