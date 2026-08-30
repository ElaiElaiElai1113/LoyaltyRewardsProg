import { beforeEach, describe, expect, it, vi } from 'vitest'

type Row = Record<string, unknown>
type Filter = { column: string; kind: 'eq' | 'in'; value: unknown }

const queryLog = vi.hoisted(() => [] as Array<{ table: string; filters: Filter[] }>)
const tableRows = vi.hoisted(() => ({
  program_memberships: [
    { program_id: 'wondertown-program', profile_id: 'wondertown-member' },
    { program_id: 'medellin-program', profile_id: 'medellin-member' },
  ],
  profiles: [
    {
      id: 'wondertown-member',
      full_name: 'Wondertown Member',
      email: 'member@wondertown.test',
      role: 'customer',
      verification_document_path: null,
    },
    {
      id: 'medellin-member',
      full_name: 'Medellin Member',
      email: 'member@medellin.test',
      role: 'customer',
      verification_document_path: null,
    },
  ],
  reward_balances: [
    {
      program_id: 'wondertown-program',
      profile_id: 'wondertown-member',
      points: 25,
      next_reward_points: 100,
      available_credits: 5,
    },
    {
      program_id: 'medellin-program',
      profile_id: 'medellin-member',
      points: 75,
      next_reward_points: 100,
      available_credits: 15,
    },
  ],
}))

function createQuery(table: keyof typeof tableRows) {
  const filters: Filter[] = []
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      filters.push({ column, kind: 'eq', value })
      return query
    }),
    in: vi.fn((column: string, value: unknown[]) => {
      filters.push({ column, kind: 'in', value })
      return query
    }),
    then: (
      onFulfilled: (value: { data: Row[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => new Promise<{ data: Row[]; error: null }>((resolve) => {
      setTimeout(() => {
        const data = tableRows[table].filter((row) => filters.every((filter) => {
          const rowValue = row[filter.column as keyof typeof row]
          return filter.kind === 'eq'
            ? rowValue === filter.value
            : (filter.value as unknown[]).includes(rowValue)
        }))
        queryLog.push({ table, filters: [...filters] })
        resolve({ data, error: null })
      }, 10)
    }).then(onFulfilled, onRejected),
  }

  return query
}

vi.mock('./shared', () => ({
  camelCaseRow: (row: Row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ]),
  ),
  friendlySupabaseError: (error: { message?: string } | null | undefined, fallback: string) => error?.message ?? fallback,
  requireSupabase: () => ({
    from: (table: keyof typeof tableRows) => createQuery(table),
    storage: { from: vi.fn() },
  }),
  snakeCaseObj: (value: Row) => value,
  toNullableNumber: (value: unknown) => value,
}))

import { adminService } from './admin-service'

describe('branded admin program data scope', () => {
  beforeEach(() => {
    queryLog.length = 0
  })

  it('waits for program membership data before returning only the active program users', async () => {
    let settled = false
    const usersPromise = adminService.getUsers('wondertown-program').finally(() => {
      settled = true
    })

    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(settled).toBe(false)

    const users = await usersPromise
    expect(users.map(({ profile }) => profile.email)).toEqual(['member@wondertown.test'])
    expect(users[0]?.balance?.availableCredits).toBe(5)
    expect(queryLog).toContainEqual({
      table: 'program_memberships',
      filters: [{ column: 'program_id', kind: 'eq', value: 'wondertown-program' }],
    })
    expect(queryLog.find((entry) => entry.table === 'reward_balances')?.filters).toEqual([
      { column: 'program_id', kind: 'eq', value: 'wondertown-program' },
      { column: 'profile_id', kind: 'in', value: ['wondertown-member'] },
    ])
  })

  it('preserves the unscoped global platform-admin result when no program is supplied', async () => {
    const users = await adminService.getUsers()
    expect(users.map(({ profile }) => profile.email)).toEqual([
      'member@wondertown.test',
      'member@medellin.test',
    ])
    expect(queryLog.some((entry) => entry.table === 'program_memberships')).toBe(false)
  })
})
