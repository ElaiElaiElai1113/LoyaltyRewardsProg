import { describe, expect, it } from 'vitest'

import type { Business } from '@/types/domain'

import { getBusinessMapPositions } from './business-map-layout'

function business(id: string, latitude: number | null, longitude: number | null): Business {
  return {
    id,
    name: id,
    slug: id,
    description: '',
    address: '',
    latitude,
    longitude,
    earnRate: 10,
    rewardRatePercent: 10,
    commissionRatePercent: 10,
    taxRate: 0,
    taxIncludedInBill: false,
    serviceChargeEnabled: false,
    serviceChargeRate: 0,
    currency: 'USD',
    active: true,
  }
}

function numericPosition(position: { left: string; top: string }) {
  return {
    left: Number.parseFloat(position.left),
    top: Number.parseFloat(position.top),
  }
}

describe('business map layout', () => {
  it('expands close Wondertown coordinates into distinct readable positions', () => {
    const wondertownBusinesses = [
      business('moonbeam', 39.8301, -98.5795),
      business('dragonfly', 39.8311, -98.5778),
      business('stardust', 39.8286, -98.5769),
      business('lantern', 39.8269, -98.5815),
      business('cloud-nine', 39.8277, -98.5831),
    ]
    const positions = getBusinessMapPositions(wondertownBusinesses)
    const numeric = Object.values(positions).map(numericPosition)

    expect(numeric).toHaveLength(5)
    for (const position of numeric) {
      expect(position.left).toBeGreaterThanOrEqual(16)
      expect(position.left).toBeLessThanOrEqual(84)
      expect(position.top).toBeGreaterThanOrEqual(20)
      expect(position.top).toBeLessThanOrEqual(80)
    }
    for (let firstIndex = 0; firstIndex < numeric.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < numeric.length; secondIndex += 1) {
        const first = numeric[firstIndex]
        const second = numeric[secondIndex]
        expect(
          Math.abs(first.left - second.left) >= 18 || Math.abs(first.top - second.top) >= 14,
        ).toBe(true)
      }
    }
  })

  it('uses separate fallback positions when coordinates are missing or identical', () => {
    const positions = getBusinessMapPositions([
      business('first', 39.8, -98.5),
      business('second', 39.8, -98.5),
      business('preview', null, null),
    ])

    expect(new Set(Object.values(positions).map(({ left, top }) => `${left}:${top}`)).size).toBe(3)
  })
})
