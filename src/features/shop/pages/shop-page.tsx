import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { BusinessFilter } from '@/components/business-filter'
import { ProductCard } from '@/features/shop/components/product-card'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useAddToCart, useBusinesses, useProducts } from '@/hooks/use-customer-data'

const categories = ['All', 'Coffee', 'Pastry', 'Merch', 'Equipment'] as const

export function ShopPage() {
  const requireAuth = useLoginGate()
  const businesses = useBusinesses()
  const products = useProducts()
  const addToCart = useAddToCart()

  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('All')

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
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          Shop
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          Shop
        </h1>
        <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
          Browse products from all partner businesses. Purchase with cash or card and earn points automatically.
        </p>
      </div>

      <div className="sticky top-24 z-40 -mx-6 bg-surface/80 px-6 py-4 backdrop-blur-md space-y-3">
        {(businesses.data ?? []).length > 1 && (
          <BusinessFilter
            businesses={businesses.data ?? []}
            selected={selectedBusiness}
            onChange={setSelectedBusiness}
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant/85 hover:bg-surface-low hover:text-primary'
              }`}
            >
              {cat}
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
          <p className="text-on-surface-variant/60 font-medium">No products found matching your filters.</p>
        </div>
      )}
    </div>
  )
}
