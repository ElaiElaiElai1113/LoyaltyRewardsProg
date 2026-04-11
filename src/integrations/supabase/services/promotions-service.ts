import { readStore, updateStore } from '@/lib/mock-store'
import type { Promotion } from '@/types/domain'
import type { PromotionDraftFormValues } from '@/types/forms'
import { delay } from './shared'

export const promotionsService = {
  async getPromotions(businessId?: string): Promise<Promotion[]> {
    await delay()
    const promotions = readStore().promotions
    const filtered = businessId ? promotions.filter((p) => p.businessId === businessId) : promotions
    return filtered.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
  },

  async createPromotion(values: PromotionDraftFormValues & { businessId: string }): Promise<Promotion> {
    await delay()

    const promotion: Promotion = {
      id: crypto.randomUUID(),
      ...values,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    }

    updateStore((store) => ({
      ...store,
      promotions: [promotion, ...store.promotions],
      adminLogs: [
        {
          id: crypto.randomUUID(),
          actorName: 'Velvet Brew Admin',
          action: 'Promotion created',
          details: `Created ${promotion.title}.`,
          createdAt: new Date().toISOString(),
        },
        ...store.adminLogs,
      ],
    }))

    return promotion
  },
}
