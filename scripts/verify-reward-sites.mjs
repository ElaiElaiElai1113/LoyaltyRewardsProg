import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.E2E_PASSWORD

const missing = [
  ['SUPABASE_URL or VITE_SUPABASE_URL', supabaseUrl],
  ['VITE_SUPABASE_ANON_KEY', anonKey],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ['E2E_PASSWORD', password],
].filter(([, value]) => !value).map(([name]) => name)

if (missing.length) {
  throw new Error(`Deep reward-site verification requires: ${missing.join(', ')}.`)
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const sites = [
  {
    name: 'RewardMe',
    slug: 'pinas',
    origin: process.env.E2E_REWARDME_URL ?? 'https://rewardme-prod.vercel.app',
    businessSlugs: ['pinas-qa-partner'],
    catalogMinimum: 1,
    accounts: [
      { email: process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test', role: 'customer', membershipRole: 'member' },
      { email: process.env.E2E_REWARDME_BUSINESS_OWNER_EMAIL ?? 'owner@rewardme.test', role: 'business-owner', membershipRole: 'business-owner' },
      { email: process.env.E2E_REWARDME_BUSINESS_STAFF_EMAIL ?? 'staff@rewardme.test', role: 'business-staff', membershipRole: 'business-staff' },
      { email: process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test', role: 'platform-admin' },
    ],
    savingsMustBeDisabled: true,
  },
  {
    name: 'Wondertown Rewards',
    slug: 'wondertown',
    origin: process.env.E2E_WONDERTOWN_URL ?? 'https://wondertown-rewards.vercel.app',
    businessSlugs: [
      'wondertown-moonbeam-cafe',
      'wondertown-dragonfly-books',
      'wondertown-stardust-salon',
      'wondertown-lantern-hotel',
      'wondertown-cloud-nine-bakery',
    ],
    catalogMinimum: 5,
    accounts: [
      { email: process.env.E2E_WONDERTOWN_CUSTOMER_EMAIL ?? 'member@wondertown.test', role: 'customer', membershipRole: 'member' },
      { email: process.env.E2E_WONDERTOWN_NEIGHBOR_EMAIL ?? 'neighbor@wondertown.test', role: 'customer', membershipRole: 'member' },
      { email: process.env.E2E_WONDERTOWN_BUSINESS_OWNER_EMAIL ?? 'owner@wondertown.test', role: 'business-owner', membershipRole: 'business-owner' },
      { email: process.env.E2E_WONDERTOWN_BUSINESS_STAFF_EMAIL ?? 'staff@wondertown.test', role: 'business-staff', membershipRole: 'business-staff' },
    ],
    requireMapSpread: true,
  },
]

const checks = []

async function check(site, name, action) {
  const started = Date.now()
  try {
    const detail = await action()
    checks.push({ site, name, passed: true, durationMs: Date.now() - started, detail })
  } catch (error) {
    checks.push({
      site,
      name,
      passed: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message)
}

async function dataOrThrow(promise, label) {
  const result = await promise
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result
}

for (const site of sites) {
  let program = null
  let businesses = []
  let profiles = []

  await check(site.name, 'public routes and health', async () => {
    const routes = ['/', '/signin', '/business/login', '/shop', '/gift-cards']
    const responses = await Promise.all(routes.map(async (route) => {
      const response = await fetch(`${site.origin}${route}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      })
      const body = await response.text()
      requireCondition(response.ok, `${route} returned ${response.status}`)
      requireCondition(body.trim().length > 200, `${route} returned an empty response`)
      requireCondition(!/application error|internal server error/i.test(body), `${route} exposed a runtime error`)
      return { route, status: response.status }
    }))

    const health = await fetch(`${site.origin}/api/health`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    const healthBody = await health.json()
    requireCondition(health.ok && healthBody?.status === 'ready', `health returned ${health.status}`)
    return { responses, health: healthBody.status }
  })

  await check(site.name, 'program configuration and safety flags', async () => {
    const result = await dataOrThrow(
      adminClient
        .from('programs')
        .select('id,name,slug,status,feature_flags,program_subscriptions(status,subscription_plans(code,entitlements))')
        .eq('slug', site.slug)
        .single(),
      'program query failed',
    )
    program = result.data
    requireCondition(program?.status === 'active', `${site.slug} is not active`)
    requireCondition(
      program?.program_subscriptions?.status === 'trialing'
        && program?.program_subscriptions?.subscription_plans?.code === 'launch',
      `${site.slug} is missing the operations-managed launch entitlement`,
    )
    if (site.savingsMustBeDisabled) {
      requireCondition(program.feature_flags?.savingsPlans === false, 'RewardMe savingsPlans must remain false')
    }
    return { slug: program.slug, status: program.status, savingsPlans: program.feature_flags?.savingsPlans ?? null }
  })

  await check(site.name, 'private QA accounts authenticate and have isolated roles', async () => {
    requireCondition(program?.id, 'program configuration check did not load an ID')
    for (const account of site.accounts) {
      const authClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data, error } = await authClient.auth.signInWithPassword({ email: account.email, password })
      if (error || !data.user) throw new Error(`${account.email} login failed: ${error?.message ?? 'missing user'}`)
      await authClient.auth.signOut()
    }

    const profileResult = await dataOrThrow(
      adminClient
        .from('profiles')
        .select('id,email,role,business_id,member_qr_token,verification_status')
        .in('email', site.accounts.map((account) => account.email)),
      'profile query failed',
    )
    profiles = profileResult.data ?? []
    requireCondition(profiles.length === site.accounts.length, `expected ${site.accounts.length} profiles, found ${profiles.length}`)

    const membershipResult = await dataOrThrow(
      adminClient
        .from('program_memberships')
        .select('profile_id,role,status,business_id')
        .eq('program_id', program.id)
        .in('profile_id', profiles.map((profile) => profile.id)),
      'program membership query failed',
    )
    const expectedMembershipCount = site.accounts.filter((account) => account.membershipRole).length
    requireCondition(
      (membershipResult.data ?? []).length === expectedMembershipCount,
      `expected ${expectedMembershipCount} isolated memberships, found ${membershipResult.data?.length ?? 0}`,
    )

    for (const account of site.accounts) {
      const profile = profiles.find((candidate) => candidate.email === account.email)
      requireCondition(profile?.role === account.role, `${account.email} has role ${profile?.role ?? 'missing'}`)
      if (account.role === 'customer') {
        requireCondition(Boolean(profile.member_qr_token), `${account.email} has no member QR token`)
      }
      if (account.membershipRole) {
        const membership = (membershipResult.data ?? []).find(
          (candidate) => candidate.profile_id === profile.id && candidate.role === account.membershipRole,
        )
        requireCondition(membership?.status === 'active', `${account.email} has no active ${account.membershipRole} membership`)
      } else {
        requireCondition(
          !(membershipResult.data ?? []).some((candidate) => candidate.profile_id === profile.id),
          `${account.email} has an unexpected tenant membership`,
        )
      }
    }
    return { authenticatedAccounts: site.accounts.length, activeMemberships: membershipResult.data?.length ?? 0 }
  })

  await check(site.name, 'businesses, maps, and catalogs are complete', async () => {
    requireCondition(program?.id, 'program configuration check did not load an ID')
    const businessResult = await dataOrThrow(
      adminClient
        .from('businesses')
        .select('id,slug,name,latitude,longitude,active')
        .eq('program_id', program.id)
        .in('slug', site.businessSlugs),
      'business query failed',
    )
    businesses = businessResult.data ?? []
    requireCondition(businesses.length === site.businessSlugs.length, `expected ${site.businessSlugs.length} businesses, found ${businesses.length}`)
    requireCondition(businesses.every((business) => business.active), 'one or more seeded businesses are inactive')
    requireCondition(businesses.every((business) => Number.isFinite(Number(business.latitude)) && Number.isFinite(Number(business.longitude))), 'one or more map locations are missing')

    if (site.requireMapSpread) {
      const latitudes = businesses.map((business) => Number(business.latitude))
      const longitudes = businesses.map((business) => Number(business.longitude))
      requireCondition(Math.max(...latitudes) - Math.min(...latitudes) >= 0.003, 'Wondertown latitude pins are too tightly clustered')
      requireCondition(Math.max(...longitudes) - Math.min(...longitudes) >= 0.003, 'Wondertown longitude pins are too tightly clustered')
    }

    const catalogCounts = {}
    for (const table of ['products', 'rewards', 'gift_card_catalog', 'promotions']) {
      const result = await dataOrThrow(
        adminClient
          .from(table)
          .select('id', { count: 'exact', head: true })
          .eq('program_id', program.id)
          .in('business_id', businesses.map((business) => business.id)),
        `${table} query failed`,
      )
      catalogCounts[table] = result.count ?? 0
      requireCondition(catalogCounts[table] >= site.catalogMinimum, `${table} has only ${catalogCounts[table]} seeded rows`)
    }
    return { businesses: businesses.length, catalogCounts }
  })

  await check(site.name, 'balances, customer links, transactions, and gift cards are persisted', async () => {
    requireCondition(program?.id && profiles.length && businesses.length, 'earlier data checks did not load required IDs')
    const memberIds = site.accounts
      .filter((account) => account.membershipRole === 'member')
      .map((account) => profiles.find((profile) => profile.email === account.email)?.id)
      .filter(Boolean)

    const [balances, links, transactions, giftCards] = await Promise.all([
      dataOrThrow(
        adminClient.from('reward_balances').select('profile_id,points').eq('program_id', program.id).in('profile_id', memberIds),
        'reward balance query failed',
      ),
      dataOrThrow(
        adminClient.from('business_customer_links').select('profile_id').eq('program_id', program.id).in('profile_id', memberIds),
        'customer link query failed',
      ),
      dataOrThrow(
        adminClient.from('member_transactions').select('id', { count: 'exact', head: true }).eq('program_id', program.id),
        'member transaction query failed',
      ),
      dataOrThrow(
        adminClient.from('gift_cards').select('id', { count: 'exact', head: true }).eq('program_id', program.id),
        'gift card query failed',
      ),
    ])

    requireCondition((balances.data ?? []).length === memberIds.length, 'one or more member balances are missing')
    requireCondition((balances.data ?? []).every((balance) => Number(balance.points) >= 0), 'a member balance is negative')
    requireCondition((links.data ?? []).length >= memberIds.length, 'one or more seeded customer links are missing')
    requireCondition((transactions.count ?? 0) >= 1, 'no persisted member transaction was found')
    requireCondition((giftCards.count ?? 0) >= 1, 'no persisted gift card was found')
    return {
      balances: balances.data?.length ?? 0,
      customerLinks: links.data?.length ?? 0,
      transactions: transactions.count ?? 0,
      giftCards: giftCards.count ?? 0,
    }
  })
}

const report = {
  checkedAtUtc: new Date().toISOString(),
  passed: checks.length > 0 && checks.every((entry) => entry.passed),
  sites: sites.map((site) => site.origin),
  checks,
}

const output = resolve(process.argv[2] ?? 'artifacts/monitoring/reward-sites-latest.json')
await mkdir(resolve(output, '..'), { recursive: true })
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
process.exit(report.passed ? 0 : 1)
