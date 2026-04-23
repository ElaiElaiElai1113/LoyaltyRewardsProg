import { PackagePlus, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/domain'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  isAdding?: boolean
}

export function ProductCard({ product, onAddToCart, isAdding }: ProductCardProps) {
  const displayCategory = product.category === 'Coffee' ? 'Drinks' : product.category

  return (
    <div className="group glass-panel relative overflow-hidden p-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary-container/45 hover:shadow-[0_0_30px_rgba(244,168,79,0.15)]">
      <div className="hud-scanline" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(123,216,207,0.12),rgba(244,168,79,0.16),rgba(216,162,58,0.1))]" />
      <div className="relative flex h-full flex-col gap-6 rounded-md bg-[#17100d]/82 p-7">
        <div className="flex justify-between items-start">
          <Badge variant="accent">
              {displayCategory}
          </Badge>
          {product.featured && (
            <span className="flex items-center gap-1.5 rounded border border-secondary-container/60 bg-secondary-container/15 px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest text-secondary-container">
              <Sparkles className="size-3" />
              Bonus Drop
            </span>
          )}
        </div>

        <div className="flex size-16 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container shadow-[0_0_18px_rgba(244,168,79,0.14)]">
          <PackagePlus className="size-8" />
        </div>

        <div className="space-y-4 grow">
          <h3 className="font-serif text-3xl font-semibold uppercase tracking-[0.01em] text-on-surface leading-tight">
            {product.title}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
            {product.description}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="quest-kicker">Cash Price</span>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary-container">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
              {product.inventory} in stock
            </span>
            <Button
              onClick={() => onAddToCart(product)}
              disabled={product.inventory <= 0 || isAdding}
              variant="secondary"
              size="sm"
            >
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
