import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const password = process.env.E2E_PASSWORD

if (!supabaseUrl || !serviceRoleKey || !anonKey || !password) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY, and E2E_PASSWORD are required.')
}
if (password.length < 12) throw new Error('E2E_PASSWORD must be at least 12 characters.')

const accounts = [
  { email: 'customer@loyality.test', fullName: 'Loyality Test Customer', role: 'customer' },
  { email: 'owner@loyality.test', fullName: 'Loyality Demo Owner', role: 'business-owner' },
  { email: 'admin@loyality.test', fullName: 'Loyality QA Administrator', role: 'platform-admin' },
]

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: program, error: programError } = await adminClient
  .from('programs')
  .select('id,slug')
  .eq('slug', 'loyality')
  .single()
if (programError || !program) throw new Error(`Could not load Loyality: ${programError?.message ?? 'missing program'}`)

const { data: business, error: businessError } = await adminClient
  .from('businesses')
  .select('id,slug')
  .eq('program_id', program.id)
  .eq('slug', 'loyality-demo-business')
  .single()
if (businessError || !business) {
  throw new Error(`Could not load the Loyality demo business: ${businessError?.message ?? 'missing business'}`)
}

const usersByEmail = new Map()
for (let page = 1; ; page += 1) {
  const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 })
  if (error) throw error
  for (const user of data.users) usersByEmail.set(user.email?.toLowerCase(), user)
  if (data.users.length < 100) break
}

async function ensureUser(account) {
  const email = account.email.toLowerCase()
  const businessId = account.role === 'business-owner' ? business.id : null
  const appMetadata = {
    role: account.role,
    ...(businessId ? { business_id: businessId } : {}),
  }
  const userMetadata = {
    full_name: account.fullName,
    active_program_id: program.id,
  }
  let user = usersByEmail.get(email)

  if (user) {
    const { data, error } = await adminClient.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
    if (error || !data.user) throw new Error(`Could not update ${email}: ${error?.message ?? 'missing user'}`)
    user = data.user
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
    if (error || !data.user) throw new Error(`Could not create ${email}: ${error?.message ?? 'missing user'}`)
    user = data.user
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      full_name: account.fullName,
      email,
      role: account.role,
      business_id: businessId,
      ...(account.role === 'customer' ? { verification_status: 'verified' } : {}),
    })
    .eq('id', user.id)
  if (profileError) throw profileError

  return { account, user, businessId }
}

async function ensureMembership(profileId, role, businessId = null) {
  let query = adminClient
    .from('program_memberships')
    .select('id')
    .eq('program_id', program.id)
    .eq('profile_id', profileId)
    .eq('role', role)
  query = businessId ? query.eq('business_id', businessId) : query.is('business_id', null)
  const { data: existing, error: readError } = await query.maybeSingle()
  if (readError) throw readError

  const write = existing
    ? adminClient.from('program_memberships').update({ status: 'active' }).eq('id', existing.id)
    : adminClient.from('program_memberships').insert({
        program_id: program.id,
        profile_id: profileId,
        role,
        status: 'active',
        business_id: businessId,
      })
  const { error } = await write
  if (error) throw error
}

const provisioned = []
for (const account of accounts) provisioned.push(await ensureUser(account))

const customer = provisioned.find(({ account }) => account.role === 'customer')
const owner = provisioned.find(({ account }) => account.role === 'business-owner')
const admin = provisioned.find(({ account }) => account.role === 'platform-admin')
if (!customer || !owner || !admin) throw new Error('The complete Loyality QA role set was not provisioned.')

await ensureMembership(customer.user.id, 'member')
await ensureMembership(owner.user.id, 'business-owner', business.id)

const { error: transitionalMembershipError } = await adminClient
  .from('program_memberships')
  .delete()
  .eq('program_id', program.id)
  .eq('role', 'member')
  .in('profile_id', [owner.user.id, admin.user.id])
if (transitionalMembershipError) throw transitionalMembershipError

const { error: balanceError } = await adminClient.from('reward_balances').upsert({
  program_id: program.id,
  profile_id: customer.user.id,
  points: 0,
  next_reward_points: 3,
  available_credits: 0,
}, { onConflict: 'program_id,profile_id' })
if (balanceError) throw balanceError

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

for (const { account } of provisioned) {
  const { data, error } = await authClient.auth.signInWithPassword({ email: account.email, password })
  if (error || !data.user) throw new Error(`Login verification failed for ${account.email}: ${error?.message ?? 'missing user'}`)
  if (data.user.app_metadata?.role !== account.role) {
    throw new Error(`Role verification failed for ${account.email}.`)
  }
  await authClient.auth.signOut()
}

console.log(JSON.stringify({
  program: program.slug,
  business: business.slug,
  accounts: accounts.map(({ email, role }) => ({ email, role })),
  passwordLoginVerified: true,
  roleAssignmentsVerified: true,
}, null, 2))
