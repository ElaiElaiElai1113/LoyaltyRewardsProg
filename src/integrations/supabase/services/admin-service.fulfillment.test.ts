import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.hoisted(() => vi.fn())

vi.mock('./shared', () => ({
  camelCaseRow: (row: Record<string, unknown>) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ]),
  ),
  friendlySupabaseError: (
    error: { message?: string } | null | undefined,
    fallback: string,
  ) => error?.message ?? fallback,
  requireSupabase: () => ({ rpc }),
  snakeCaseObj: (value: Record<string, unknown>) => value,
  toNullableNumber: (value: unknown) => value,
}))

import { adminService } from './admin-service'

describe('atomic reward fulfillment service', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('uses the single atomic RPC and maps its persisted redemption', async () => {
    rpc.mockResolvedValue({
      data: {
        redemption: {
          id: 'redemption-1',
          profile_id: 'member-1',
          reward_id: 'reward-1',
          reward_title: 'QA Welcome Reward',
          points_cost: 10,
          notes: null,
          redeemed_at: '2026-08-17T00:00:00.000Z',
          status: 'fulfilled',
        },
        program_id: 'program-1',
        business_id: 'business-1',
        admin_log_id: 'log-1',
        already_fulfilled: false,
      },
      error: null,
    })

    await expect(adminService.fulfillRedemption('redemption-1')).resolves.toMatchObject({
      id: 'redemption-1',
      profileId: 'member-1',
      rewardId: 'reward-1',
      rewardTitle: 'QA Welcome Reward',
      pointsCost: 10,
      status: 'fulfilled',
    })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('fulfill_redemption', {
      p_redemption_id: 'redemption-1',
    })
  })

  it('surfaces an RPC failure without attempting a second client-side write', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Permission denied' },
    })

    await expect(adminService.fulfillRedemption('redemption-2')).rejects.toThrow(
      'Permission denied',
    )
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('rejects a successful response that does not include the committed row', async () => {
    rpc.mockResolvedValue({ data: { admin_log_id: 'log-2' }, error: null })

    await expect(adminService.fulfillRedemption('redemption-3')).rejects.toThrow(
      'Failed to fulfill redemption.',
    )
  })

  it('requires a fresh fulfillment response to include its committed audit ID', async () => {
    rpc.mockResolvedValue({
      data: {
        redemption: { id: 'redemption-4', status: 'fulfilled' },
        program_id: 'program-1',
        business_id: 'business-1',
        admin_log_id: null,
        already_fulfilled: false,
      },
      error: null,
    })

    await expect(adminService.fulfillRedemption('redemption-4')).rejects.toThrow(
      'Failed to fulfill redemption.',
    )
  })

  it('rejects an RPC response for a different or unfulfilled redemption', async () => {
    rpc.mockResolvedValue({
      data: {
        redemption: { id: 'redemption-other', status: 'ready' },
        program_id: 'program-1',
        business_id: 'business-1',
        admin_log_id: 'log-3',
        already_fulfilled: false,
      },
      error: null,
    })

    await expect(adminService.fulfillRedemption('redemption-5')).rejects.toThrow(
      'Failed to fulfill redemption.',
    )
  })
})
