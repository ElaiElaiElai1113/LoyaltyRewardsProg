import { describe, expect, it } from 'vitest'

import type { GiftCardCatalogItem } from '@/types/domain'
import { distinctCustomerGiftCardOffers } from './catalog-display'

function item(overrides: Partial<GiftCardCatalogItem> = {}): GiftCardCatalogItem {
  return {
    id: 'gift-card-1',
    businessId: 'business-1',
    title: 'Cafe Gift Card',
    description: 'A useful gift card.',
    imageUrl: null,
    pointsCost: 100,
    valueLabel: 'PHP 5',
    expiryDays: 365,
    isActive: true,
    createdBy: null,
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
    ...overrides,
  }
}

describe('distinctCustomerGiftCardOffers', () => {
  it('shows equivalent timestamped workflow offers only once', () => {
    const offers = distinctCustomerGiftCardOffers([
      item({ id: 'new', title: 'Workflow Gift Card rewardme-1786966316663', description: 'Workflow automation gift card.' }),
      item({ id: 'old', title: 'Workflow Gift Card rewardme-1786795286316', description: 'Workflow automation gift card.' }),
    ])

    expect(offers.map((offer) => offer.id)).toEqual(['new'])
  })

  it('keeps genuinely different offers and hides inactive offers', () => {
    const offers = distinctCustomerGiftCardOffers([
      item({ id: 'coffee', title: 'Coffee Gift Card' }),
      item({ id: 'hotel', title: 'Hotel Gift Card' }),
      item({ id: 'inactive', title: 'Old Gift Card', isActive: false }),
    ])

    expect(offers.map((offer) => offer.id)).toEqual(['coffee', 'hotel'])
  })
})
