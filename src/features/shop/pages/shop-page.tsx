import { type CSSProperties, useState } from 'react'
import { Coffee, Cookie, PackageSearch, Shirt, Sparkles, Wrench } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { BusinessFilter } from '@/components/business-filter'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { LuxeCarousel } from '@/components/ui/luxe-carousel'
import { LoadingState } from '@/components/ui/loading-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { MembershipBanner } from '@/features/membership/components/membership-banner'
import { ProductCard } from '@/features/shop/components/product-card'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useAddToCart, useBusinesses, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/domain'

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const filtered = (products.data ?? []).filter((p) => {
    if (selectedBusiness && p.businessId !== selectedBusiness) return false
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false
    return true
  })
  const featuredProducts = filtered.filter((product) => product.featured).slice(0, 5)

  const handleAddToCart = (product: Product) => {
    requireAuth(() => {
      setSelectedProduct(product)
      setSelectedQuantity(1)
    })
  }

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="space-y-12 sm:space-y-16">
      <div className="relative z-10 animate-soft-reveal grid gap-8 xl:grid-cols-[0.88fr_1.12fr] xl:items-end">
        <span className="botanical-corner -left-24 top-6 hidden lg:block" />
        <div className="max-w-3xl space-y-4">
        <Badge variant="accent">
          {t('Partner Businesses')}
        </Badge>
        <h1 className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-bold uppercase tracking-[0.02em] text-primary-container leading-[0.98]">
          {t('Curated Social Catalog')}
        </h1>
        <p className="max-w-2xl text-base font-medium leading-relaxed text-on-surface-variant/85 sm:text-lg">
          {t('Discover curated experiences, pretty little perks, and rewards worth sharing with friends.')}
        </p>
        </div>

        <div className="ornate-frame relative min-h-56 rounded-[2rem] p-4 sm:min-h-72 sm:p-5">
          <div className="grid h-full grid-cols-3 gap-3">
            <div className="social-photo-panel rounded-[1.35rem]" />
            <div className="social-photo-panel-alt rounded-[1.35rem]" />
            <div className="social-photo-panel rounded-[1.35rem]" />
          </div>
          <div className="absolute bottom-8 left-8 rounded-full border border-primary/20 bg-card/88 px-5 py-3 text-sm font-bold text-primary-container shadow-soft backdrop-blur">
            {t('Coffee dates, market finds, golden points')}
          </div>
          <div className="animate-float-soft absolute right-8 top-8 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-7" />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <MembershipBanner />
      </div>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Drinks', icon: Coffee },
          { label: 'Bites', icon: Cookie },
          { label: 'Gear', icon: Shirt },
          { label: 'Tools', icon: Wrench },
        ].map((category, index) => (
          <div
            key={category.label}
            className="ornate-frame animate-card-stagger flex items-center gap-4 rounded-[1.5rem] p-5"
            style={{ '--stagger': index } as CSSProperties}
          >
            <div className="luxe-art flex size-12 items-center justify-center rounded-[1rem]">
              <category.icon className="size-6" />
            </div>
            <div>
              <p className="font-serif text-2xl leading-none text-primary-container">{t(category.label)}</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">{t('Browse')}</p>
            </div>
          </div>
        ))}
      </div>

      {featuredProducts.length > 0 ? (
        <LuxeCarousel
          className="relative z-10"
          eyebrow={t('Featured drops')}
          title={t('This week feels extra golden')}
          description={t('A softer showcase for the items most likely to pull shoppers deeper into the catalog.')}
        >
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              isAdding={addToCart.isPending}
            />
          ))}
        </LuxeCarousel>
      ) : null}

      <div className="sticky top-16 z-40 -mx-4 space-y-3 border-y border-primary/15 bg-card/92 px-4 py-4 shadow-soft backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {(businesses.data ?? []).length > 1 && (
          <BusinessFilter
            businesses={businesses.data ?? []}
            selected={selectedBusiness}
            onChange={setSelectedBusiness}
          />
        )}
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">{t('Item Type:')}</span>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                selectedCategory === cat.value
                  ? 'luxe-chip-active px-6'
                  : 'luxe-chip-muted border hover:border-primary/60 hover:bg-[var(--espresso-soft)] hover:text-[var(--cream)]'
              }`}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      {products.isLoading ? (
        <div className="relative z-10 space-y-6">
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Preparing your catalog.')}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-8" />}
          title={t('No products yet')}
          description={t('Products from partner businesses will appear here when they are available.')}
        />
      ) : (
        <div className="relative z-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 min-[2400px]:grid-cols-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              isAdding={addToCart.isPending}
            />
          ))}
        </div>
      )}
      </div>

      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null)
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle>Confirm Quantity</DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? `Choose how many ${selectedProduct.title} you want to add to your cart.`
                : 'Choose how many items you want to add to your cart.'}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      {selectedProduct.category}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      {selectedProduct.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {selectedProduct.inventory} in stock
                    </p>
                  </div>
                  <p className="font-serif text-2xl text-primary-container">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <label htmlFor="cart-quantity" className="text-sm font-semibold text-[var(--foreground)]">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setSelectedQuantity((value) => Math.max(1, value - 1))}
                    disabled={selectedQuantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="cart-quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.inventory}
                    value={selectedQuantity}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      if (!Number.isFinite(nextValue)) return
                      setSelectedQuantity(Math.min(selectedProduct.inventory, Math.max(1, Math.floor(nextValue))))
                    }}
                    className="h-12 text-center text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setSelectedQuantity((value) => Math.min(selectedProduct.inventory, value + 1))}
                    disabled={selectedQuantity >= selectedProduct.inventory}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={addToCart.isPending}
              disabled={!selectedProduct || selectedQuantity < 1}
              onClick={() => {
                if (!selectedProduct) return
                addToCart.mutate(
                  { productId: selectedProduct.id, quantity: selectedQuantity },
                  {
                    onSuccess: () => {
                      setSelectedProduct(null)
                      setSelectedQuantity(1)
                    },
                  },
                )
              }}
            >
              Add {selectedQuantity} to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
