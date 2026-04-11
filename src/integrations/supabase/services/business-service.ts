import { readStore, updateStore } from '@/lib/mock-store'
import type { Business } from '@/types/domain'
import type { BusinessSettingsFormValues } from '@/types/forms'
import { delay } from './shared'

export const businessService = {
  async getBusinesses(): Promise<Business[]> {
    await delay()
    return readStore().businesses.filter((b) => b.active)
  },

  async getBusinessById(businessId: string): Promise<Business | null> {
    await delay()
    return readStore().businesses.find((b) => b.id === businessId) ?? null
  },

  async updateSettings(businessId: string, values: BusinessSettingsFormValues): Promise<Business> {
    await delay()
    let updated: Business | null = null
    updateStore((store) => {
      updated = store.businesses.find((b) => b.id === businessId) ?? null
      if (!updated) throw new Error('Business not found.')
      updated = { ...updated, ...values }
      return {
        ...store,
        businesses: store.businesses.map((b) => (b.id === businessId ? updated! : b)),
        adminLogs: [
          {
            id: crypto.randomUUID(),
            actorName: 'Velvet Brew Admin',
            action: 'Business settings updated',
            details: `Updated ${updated!.name}: earn rate ${values.earnRate} pts/$1, tax rate ${(values.taxRate * 100).toFixed(2)}%.`,
            createdAt: new Date().toISOString(),
          },
          ...store.adminLogs,
        ],
      }
    })
    return updated!
  },
}
