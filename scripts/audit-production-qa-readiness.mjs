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
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const slugs = ['pinas', 'guatemala']
const expectedEmails = [
  process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test',
  process.env.E2E_REWARDME_BUSINESS_OWNER_EMAIL ?? 'owner@rewardme.test',
  process.env.E2E_REWARDME_BUSINESS_STAFF_EMAIL ?? 'staff@rewardme.test',
  process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test',
  process.env.E2E_GUATEMALA_CUSTOMER_EMAIL ?? 'customer@guatemala.test',
  process.env.E2E_GUATEMALA_BUSINESS_OWNER_EMAIL ?? 'owner@guatemala.test',
].map((email) => email.toLowerCase())

const { data: programs, error: programError } = await client
  .from('programs')
  .select('id,name,slug,status,currency,program_domains(hostname,is_primary,verification_status),businesses!businesses_program_id_fkey(id,name,slug,active,currency),program_subscriptions(status,subscription_plans(code,name,entitlements))')
  .in('slug', slugs)
  .order('slug')
if (programError) throw programError

const usersByEmail = new Set()
for (let page = 1; ; page += 1) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 })
  if (error) throw error
  for (const user of data.users) {
    if (user.email) usersByEmail.add(user.email.toLowerCase())
  }
  if (data.users.length < 100) break
}

const report = {
  checkedAt: new Date().toISOString(),
  programs: await Promise.all((programs ?? []).map(async (program) => {
    const { count, error } = await client
      .from('program_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)
    if (error) throw error
    return {
      slug: program.slug,
      name: program.name,
      status: program.status,
      currency: program.currency,
      domains: program.program_domains,
      businesses: program.businesses,
      subscriptions: program.program_subscriptions,
      membershipCount: count ?? 0,
    }
  })),
  qaAccounts: expectedEmails.map((email) => ({ email, exists: usersByEmail.has(email) })),
}

console.log(JSON.stringify(report, null, 2))
