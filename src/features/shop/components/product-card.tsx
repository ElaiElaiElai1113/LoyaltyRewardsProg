import { PackagePlus, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/domain'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  isAdding?: boolean
}

export function ProductCard({ product, onAddToCart, isAdding }: ProductCardProps) {
  const { t } = useLanguage()
  const displayCategory = product.category === 'Coffee' ? 'Drinks' : product.category

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-white shadow-sm relative overflow-hidden p-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary-container/45 hover:shadow-sm">
      <div className="hidden" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(123,216,207,0.12),rgba(244,168,79,0.16),rgba(216,162,58,0.1))]" />
      <div className="relative flex h-full flex-col gap-6 rounded-md bg-[#17100d]/82 p-7">
        <div className="flex justify-between items-start">
          <Badge variant="accent">
              {t(displayCategory)}
          </Badge>
          {product.featured && (
            <span className="flex items-center gap-1.5 rounded border border-secondary-container/60 bg-secondary-container/15 px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest text-secondary-container">
              <Sparkles className="size-3" />
              {t('Bonus Drop')}
            </span>
          )}
        </div>

        <div className="flex size-16 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container shadow-sm">
          <PackagePlus className="size-8" />
        </div>

        <div className="space-y-4 grow">
          <h3 className="font-serif text-3xl font-semibold uppercase tracking-[0.01em] text-on-surface leading-tight">
            {t(product.title)}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
            {t(product.description)}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('Cash Price')}</span>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary-container">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
              {product.inventory} {t('in stock')}
            </span>
            <Button
              onClick={() => onAddToCart(product)}
              disabled={product.inventory <= 0 || isAdding}
              variant="secondary"
              size="sm"
            >
              {isAdding ? t('Adding...') : t('Add to Cart')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
