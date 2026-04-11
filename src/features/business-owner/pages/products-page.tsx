import { Package } from 'lucide-react'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { formatCurrency } from '@/lib/utils'

import { Button } from '@/components/ui/button'

export function ProductsPage() {
  const { business, products } = useBusinessOwnerData()

  const businessColors =
    business?.slug === 'velvet-brew'
      ? { primary: 'from-[#8B4513] to-[#654321]', light: 'from-[#8B4513]/10 to-[#654321]/10' }
      : { primary: 'from-[#D4A574] to-[#C19A6B]', light: 'from-[#D4A574]/10 to-[#C19A6B]/10' }

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Products</h1>
          <p className="text-lg text-on-surface-variant/85">
            Manage your product catalog, inventory, and pricing.
          </p>
        </div>
        <Button className="rounded-full h-14 px-8 font-semibold">
          <Package className="size-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <div className="rounded-3xl bg-white border border-outline-variant/5 p-16 text-center">
            <Package className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-primary mb-2">No products yet</h3>
            <p className="text-on-surface-variant/70 mb-8">Add your first product to get started</p>
            <Button className="rounded-full h-12 px-8">
              <Package className="size-5 mr-2" />
              Add First Product
            </Button>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="group flex items-center justify-between rounded-3xl bg-white hover:bg-surface-low p-6 border border-outline-variant/5 hover:border-primary/10 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`size-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold ${businessColors.primary}`}
                >
                  {product.title.charAt(0)}
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-xl text-primary">{product.title}</p>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant/70">
                    <span>{product.category}</span>
                    <span className="size-1 rounded-full bg-outline-variant/30"></span>
                    <span>{product.inventory} in stock</span>
                    {product.featured && (
                      <>
                        <span className="size-1 rounded-full bg-outline-variant/30"></span>
                        <span className="text-secondary font-medium">Featured</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                {product.highlight && (
                  <p className="text-xs text-on-surface-variant/60 mt-1">{product.highlight}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
