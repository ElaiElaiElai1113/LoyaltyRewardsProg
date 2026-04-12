import type { Product } from '@/types/domain'
import type { ProductDraftFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

export const productsService = {
  async getProducts(businessId?: string): Promise<Product[]> {
    const sb = requireSupabase()

    let query = sb.from('products').select('*')
    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load products.')

    return (data as Record<string, unknown>[])
      .map((row) => camelCaseRow(row) as unknown as Product)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
  },

  async getProductById(productId: string): Promise<Product | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Product
  },

  async createProduct(values: ProductDraftFormValues): Promise<Product> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('products')
      .insert({ ...snakeValues, featured: false })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to create product.')
    }

    const product = camelCaseRow(data) as unknown as Product

    await sb.from('admin_logs').insert({
      actor_name: 'Business Owner',
      action: 'Product created',
      details: `Added ${product.title} to the shop.`,
    })

    return product
  },
}
