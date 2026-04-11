import { readStore, updateStore } from '@/lib/mock-store'
import type { Product } from '@/types/domain'
import type { ProductDraftFormValues } from '@/types/forms'
import { delay } from './shared'

export const productsService = {
  async getProducts(businessId?: string): Promise<Product[]> {
    await delay()
    const products = readStore().products
    const filtered = businessId ? products.filter((p) => p.businessId === businessId) : products
    return filtered.sort((a, b) => Number(b.featured) - Number(a.featured))
  },

  async getProductById(productId: string): Promise<Product | null> {
    await delay()
    return readStore().products.find((p) => p.id === productId) ?? null
  },

  async createProduct(values: ProductDraftFormValues): Promise<Product> {
    await delay()
    const product: Product = {
      id: crypto.randomUUID(),
      ...values,
      featured: false,
    }
    updateStore((store) => ({
      ...store,
      products: [product, ...store.products],
      adminLogs: [
        {
          id: crypto.randomUUID(),
          actorName: 'Velvet Brew Admin',
          action: 'Product created',
          details: `Added ${product.title} to the shop.`,
          createdAt: new Date().toISOString(),
        },
        ...store.adminLogs,
      ],
    }))
    return product
  },
}
