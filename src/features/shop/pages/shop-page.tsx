import { useState } from 'react'
import { PackageSearch } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { BusinessFilter } from '@/components/business-filter'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
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

      <div className="sticky top-20 z-40 -mx-5 space-y-3 border-y border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
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
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="mt-6 h-8 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <Skeleton className="mt-6 h-11 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-8" />}
          title={t('No products yet')}
          description={t('Products from partner businesses will appear here when they are available.')}
        />
      ) : (
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
      )}
    </div>
  )
}
