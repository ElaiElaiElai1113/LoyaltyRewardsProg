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
    <div className="group flex h-full flex-col gap-5 rounded-xl border border-[var(--border)] bg-card p-4 shadow-card transition-colors hover:bg-[var(--muted)]/40">
        <div className="flex justify-between items-start">
          <Badge>
              {t(displayCategory)}
          </Badge>
          {product.featured && (
            <span className="flex items-center gap-1.5 rounded-md bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
              <Sparkles className="size-3" />
              {t('Bonus Drop')}
            </span>
          )}
        </div>

        <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
          <PackagePlus className="size-5" />
        </div>

        <div className="grow space-y-3">
          <h3 className="text-xl font-semibold leading-tight text-[var(--foreground)]">
            {t(product.title)}
          </h3>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {t(product.description)}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('Cash Price')}</span>
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
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
  )
}
