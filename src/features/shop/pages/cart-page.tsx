import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CartItemRow } from '@/features/shop/components/cart-item-row'
import { useBusinesses, useCart, useProducts, useRemoveFromCart, useUpdateCartItem } from '@/hooks/use-customer-data'
import { formatCurrency } from '@/lib/utils'

export function CartPage() {
  const cart = useCart()
  const products = useProducts()
  const businesses = useBusinesses()
  const updateCartItem = useUpdateCartItem()
  const removeCartItem = useRemoveFromCart()

  const cartItems = cart.data ?? []
  const allProducts = products.data ?? []

  const resolvedItems = cartItems
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.productId)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter(Boolean) as { product: typeof allProducts[0]; quantity: number }[]

  // Cart items might come from different businesses — group totals per business
  const subtotal = resolvedItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)

  // Use first item's business tax rate for display (in a real app, split by business)
  const firstBusinessId = resolvedItems[0]?.product.businessId
  const business = businesses.data?.find((b) => b.id === firstBusinessId)
  const taxRate = business?.taxRate ?? 0.09
  const tax = +(subtotal * taxRate).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)
  const earnRate = business?.earnRate ?? 10
  const estimatedPoints = Math.floor(total * earnRate)

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          Shopping Cart
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          Your Cart
        </h1>
      </div>

      {resolvedItems.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <p className="text-on-surface-variant/60 font-medium text-lg">Your cart is empty.</p>
          <Button asChild variant="default" size="lg" className="rounded-full">
            <Link to="/shop">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {resolvedItems.map(({ product, quantity }) => (
              <CartItemRow
                key={product.id}
                product={product}
                quantity={quantity}
                onUpdateQuantity={(id, qty) => updateCartItem.mutate({ productId: id, quantity: qty })}
                onRemove={(id) => removeCartItem.mutate(id)}
              />
            ))}
          </div>

          <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6 h-fit sticky top-32">
            <h2 className="font-serif text-3xl text-primary">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-outline-variant/10 pt-3 flex justify-between font-bold text-primary text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="rounded-xl bg-tertiary/20 p-4 text-sm">
              <span className="font-bold text-primary">+{estimatedPoints} points</span>
              <span className="text-on-surface-variant/80"> earned from this order</span>
            </div>
            <Button asChild variant="default" size="lg" className="w-full rounded-full h-14">
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
