import { Sparkles } from 'lucide-react'

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
  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-surface-low hover:bg-surface-highest/40 transition-all duration-300 border border-transparent hover:border-outline-variant/10 shadow-card p-8">
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-start">
          <Badge variant="accent" className="bg-tertiary/60">
            {product.category}
          </Badge>
          {product.featured && (
            <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-secondary">
              <Sparkles className="size-3" />
              Featured
            </span>
          )}
        </div>

        <div className="space-y-4 grow">
          <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
            {product.title}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
            {product.description}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Price</span>
            <p className="font-serif text-3xl tracking-tight text-primary">
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
              className="rounded-full"
            >
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
