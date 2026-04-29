import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { BusinessFilter } from '@/components/business-filter'
import { ProductCard } from '@/features/shop/components/product-card'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useAddToCart, useBusinesses, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'

const categories = [
  { value: 'All', label: 'All' },
  { value: 'Coffee', label: 'Drinks' },
  { value: 'Pastry', label: 'Bites' },
  { value: 'Merch', label: 'Gear' },
  { value: 'Equipment', label: 'Tools' },
] as const

export function ShopPage() {
  const requireAuth = useLoginGate()
  const { t } = useLanguage()
  const businesses = useBusinesses()
  const products = useProducts()
  const addToCart = useAddToCart()

  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]['value']>('All')

  const filtered = (products.data ?? []).filter((p) => {
    if (selectedBusiness && p.businessId !== selectedBusiness) return false
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false
    return true
  })

  const handleAddToCart = (productId: string) => {
    requireAuth(() => addToCart.mutate({ productId }))
  }

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent">
          {t('Partner Businesses')}
        </Badge>
        <h1 className="font-serif text-5xl font-bold uppercase tracking-[0.02em] text-primary-container md:text-7xl leading-[1.05]">
          {t('Shop Businesses')}
        </h1>
        <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
          {t('Browse partner businesses, complete purchases, and earn points automatically.')}
        </p>
      </div>

      <div className="sticky top-20 z-40 -mx-5 space-y-3 border-y border-primary-container/15 bg-[#120d0b]/82 px-5 py-4  md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        {(businesses.data ?? []).length > 1 && (
          <BusinessFilter
            businesses={businesses.data ?? []}
            selected={selectedBusiness}
            onChange={setSelectedBusiness}
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-sm font-medium text-[var(--muted-foreground)]">{t('Item Type:')}</span>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-secondary-container text-[#2d1a06] shadow-sm'
                  : 'border border-primary-container/20 bg-primary-container/5 text-on-surface-variant/85 hover:bg-primary-container/10 hover:text-primary-container'
              }`}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(p) => handleAddToCart(p.id)}
            isAdding={addToCart.isPending}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-on-surface-variant/60 font-medium">{t('No products found matching your filters.')}</p>
        </div>
      )}
    </div>
  )
}
