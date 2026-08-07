import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

type Program = {
  id: string
  slug: string
}

function readDotEnv() {
  if (!existsSync('.env')) return new Map<string, string>()

  return new Map(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [name, ...valueParts] = line.split('=')
        return [name, valueParts.join('=').replace(/^"|"$/g, '').trim()]
      }),
  )
}

const dotEnv = readDotEnv()

function environment(name: string) {
  const value = process.env[name] ?? dotEnv.get(name)
  return !value || /replace[_-]|your-project/i.test(value) ? '' : value
}

const configuredSupabaseUrl = environment('VITE_SUPABASE_URL')
const configuredAnonKey = environment('VITE_SUPABASE_ANON_KEY')
const configuredServiceRoleKey = environment('SUPABASE_SERVICE_ROLE_KEY')
const hostedSafeReady = Boolean(configuredSupabaseUrl && configuredAnonKey && configuredServiceRoleKey)
const supabaseUrl = configuredSupabaseUrl || 'http://127.0.0.1:54321'
const anonKey = configuredAnonKey || 'hosted-safe-not-configured'
const serviceRoleKey = configuredServiceRoleKey || 'hosted-safe-not-configured'
const runId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
const password = `HostedSafe-${crypto.randomUUID()}!`

function createSessionClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

test.describe('hosted-safe tenant isolation', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hostedSafeReady, 'Hosted-safe tests require Supabase browser and service-role credentials.')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
  const createdUsers: User[] = []
  let medellin: Program
  let guatemala: Program
  let medellinClient: SupabaseClient
  let guatemalaClient: SupabaseClient

  test.beforeAll(async () => {
    const { data: programs, error: programsError } = await admin
      .from('programs')
      .select('id, slug')
      .in('slug', ['medellin', 'guatemala'])

    if (programsError) throw programsError
    medellin = (programs as Program[]).find((program) => program.slug === 'medellin')!
    guatemala = (programs as Program[]).find((program) => program.slug === 'guatemala')!
    if (!medellin || !guatemala) throw new Error('Required tenant programs are missing.')

    for (const program of [medellin, guatemala]) {
      const email = `e2e-hosted-${program.slug}-${runId}@example.invalid`
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          active_program_id: program.id,
          full_name: `E2E Hosted ${program.slug}`,
          role: 'customer',
        },
      })

      if (error) throw error
      createdUsers.push(data.user)
    }

    medellinClient = createSessionClient()
    guatemalaClient = createSessionClient()
    const signIns = await Promise.all([
      medellinClient.auth.signInWithPassword({ email: createdUsers[0].email!, password }),
      guatemalaClient.auth.signInWithPassword({ email: createdUsers[1].email!, password }),
    ])
    for (const signIn of signIns) {
      if (signIn.error) throw signIn.error
    }
  })

  test.afterAll(async () => {
    await Promise.allSettled([
      medellinClient?.auth.signOut(),
      guatemalaClient?.auth.signOut(),
    ])
    for (const user of createdUsers.reverse()) {
      const { error } = await admin.auth.admin.deleteUser(user.id)
      if (error) console.error(`Failed to clean up hosted-safe user ${user.id}: ${error.message}`)
    }
  })

  test('each temporary user receives only its intended membership', async () => {
    const [medellinResult, guatemalaResult] = await Promise.all([
      medellinClient.from('program_memberships').select('program_id, role, status'),
      guatemalaClient.from('program_memberships').select('program_id, role, status'),
    ])

    expect(medellinResult.error).toBeNull()
    expect(guatemalaResult.error).toBeNull()
    expect(medellinResult.data).toEqual([
      expect.objectContaining({ program_id: medellin.id, role: 'member', status: 'active' }),
    ])
    expect(guatemalaResult.data).toEqual([
      expect.objectContaining({ program_id: guatemala.id, role: 'member', status: 'active' }),
    ])
  })

  test('program settings reads are isolated between tenants', async () => {
    const [ownSettings, foreignSettings] = await Promise.all([
      medellinClient.from('program_settings').select('program_id').eq('program_id', medellin.id),
      medellinClient.from('program_settings').select('program_id').eq('program_id', guatemala.id),
    ])

    expect(ownSettings.error).toBeNull()
    expect(ownSettings.data).toEqual([{ program_id: medellin.id }])
    expect(foreignSettings.error).toBeNull()
    expect(foreignSettings.data).toEqual([])
  })

  test('cross-tenant program settings writes affect no rows', async () => {
    const { data, error } = await medellinClient
      .from('program_settings')
      .update({ email_from_name: `Blocked ${runId}` })
      .eq('program_id', guatemala.id)
      .select('program_id')

    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: current, error: currentError } = await guatemalaClient
      .from('program_settings')
      .select('email_from_name')
      .eq('program_id', guatemala.id)
      .single()

    expect(currentError).toBeNull()
    expect(current?.email_from_name).not.toBe(`Blocked ${runId}`)
  })

  test('reward balances remain isolated by program and profile', async () => {
    const [adminBalances, medellinForeignBalance, guatemalaForeignBalance] = await Promise.all([
      admin
        .from('reward_balances')
        .select('profile_id, program_id')
        .in('profile_id', createdUsers.map((user) => user.id))
        .order('profile_id'),
      medellinClient
        .from('reward_balances')
        .select('profile_id, program_id')
        .eq('profile_id', createdUsers[1].id),
      guatemalaClient
        .from('reward_balances')
        .select('profile_id, program_id')
        .eq('profile_id', createdUsers[0].id),
    ])

    expect(adminBalances.error).toBeNull()
    expect(adminBalances.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ profile_id: createdUsers[0].id, program_id: medellin.id }),
        expect.objectContaining({ profile_id: createdUsers[1].id, program_id: guatemala.id }),
      ]),
    )
    expect(medellinForeignBalance.error).toBeNull()
    expect(medellinForeignBalance.data).toEqual([])
    expect(guatemalaForeignBalance.error).toBeNull()
    expect(guatemalaForeignBalance.data).toEqual([])
  })
})
