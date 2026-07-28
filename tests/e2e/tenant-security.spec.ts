import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

function environment(name: string) {
  const direct = process.env[name]
  if (direct) return direct
  if (!existsSync('.env')) throw new Error(`${name} is required for tenant security tests.`)
  const line = readFileSync('.env', 'utf8').split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`))
  const value = line?.slice(name.length + 1).replace(/^"|"$/g, '').trim()
  if (!value) throw new Error(`${name} is required for tenant security tests.`)
  return value
}

const url = environment('VITE_SUPABASE_URL')
const anonKey = environment('VITE_SUPABASE_ANON_KEY')
const anonymous = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
})

test.describe('adversarial tenant request isolation', () => {
  test('anonymous clients cannot enumerate tenant memberships or balances', async () => {
    const [memberships, balances] = await Promise.all([
      anonymous.from('program_memberships').select('program_id, profile_id'),
      anonymous.from('reward_balances').select('program_id, profile_id'),
    ])
    expect(memberships.error === null ? memberships.data : []).toEqual([])
    expect(balances.error === null ? balances.data : []).toEqual([])
  })

  test('anonymous clients cannot forge domains, imports, or invitations', async () => {
    const fakeProgram = '00000000-0000-4000-8000-000000000000'
    const [domain, importBatch, invitation] = await Promise.all([
      anonymous.from('program_domains').insert({ program_id: fakeProgram, hostname: 'attacker.invalid' }),
      anonymous.from('tenant_import_batches').insert({ program_id: fakeProgram, source_name: 'forged' }),
      anonymous.rpc('invite_program_admin', { p_program_id: fakeProgram, p_email: 'attacker@example.invalid' }),
    ])
    expect(domain.error).not.toBeNull()
    expect(importBatch.error).not.toBeNull()
    expect(invitation.error).not.toBeNull()
  })

  test('storage paths cannot be forged for an unknown program', async () => {
    const path = `00000000-0000-4000-8000-000000000000/${crypto.randomUUID()}.txt`
    const result = await anonymous.storage.from('verification-ids').upload(path, new Blob(['forged']))
    expect(result.error).not.toBeNull()
  })

  test('unknown hostnames do not fall through to another tenant', async () => {
    const result = await anonymous.rpc('resolve_program_by_hostname', {
      p_hostname: `${crypto.randomUUID()}.example.invalid`,
    })
    expect(result.error).toBeNull()
    expect(result.data).toEqual([])
  })
})
