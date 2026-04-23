import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBusinesses, useCart, usePlaceOrder, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { CheckoutFormValues } from '@/types/forms'
import { checkoutSchema } from '@/types/forms'

export function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useCart()
  const { t } = useLanguage()
  const products = useProducts()
  const businesses = useBusinesses()
  const placeOrder = usePlaceOrder()

  const [error, setError] = useState<string | null>(null)

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'visa' },
  })
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: 'paymentMethod',
  })

  const cartItems = cart.data ?? []
  const allProducts = products.data ?? []

  const resolvedItems = cartItems
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.productId)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter(Boolean) as { product: typeof allProducts[0]; quantity: number }[]

  const subtotal = resolvedItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const businessId = resolvedItems[0]?.product.businessId ?? ''
  const business = businesses.data?.find((b) => b.id === businessId)
  const taxRate = business?.taxRate ?? 0.09
  const tax = +(subtotal * taxRate).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)
  const estimatedPoints = Math.floor(total * (business?.earnRate ?? 10))

  if (resolvedItems.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          {t('Checkout')}
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Checkout')}
        </h1>
      </div>

      <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6">
            <h2 className="font-serif text-3xl text-primary">{t('Payment Method')}</h2>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setError(null)
                  const order = await placeOrder.mutateAsync({
                    businessId,
                    paymentMethod: values.paymentMethod,
                  })
                  navigate('/order-confirmation', { state: { orderId: order.id } })
                } catch (err) {
                  setError(err instanceof Error ? err.message : t('Order failed.'))
                }
              })}
            >
              <div className="grid gap-3">
                <Label>{t('Card Type')}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'visa', label: 'Visa •••• 4242' },
                    { value: 'mastercard', label: 'Mastercard •••• 8888' },
                    { value: 'applepay', label: 'Apple Pay' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue('paymentMethod', option.value as 'visa' | 'mastercard' | 'applepay')}
                      className={`rounded-2xl border p-4 text-sm font-medium transition-all ${
                        selectedPaymentMethod === option.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="card-number">{t('Card Number')}</Label>
                <Input id="card-number" value="4242 4242 4242 4242" disabled />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label>{t('Expiry')}</Label>
                  <Input value="12/28" disabled />
                </div>
                <div className="grid gap-3">
                  <Label>{t('CVC')}</Label>
                  <Input value="•••" disabled />
                </div>
              </div>

              {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full h-16 text-lg font-bold shadow-card"
                disabled={placeOrder.isPending}
              >
                {placeOrder.isPending ? t('Placing Order...') : `${t('Pay')} ${formatCurrency(total)}`}
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6 h-fit sticky top-32">
          <h2 className="font-serif text-2xl text-primary">{t('Order Summary')}</h2>
          <div className="space-y-3">
            {resolvedItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t(product.title)} x{quantity}</span>
                <span className="text-primary font-medium">{formatCurrency(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-outline-variant/10 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('Subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('Tax')}</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary text-lg pt-2 border-t border-outline-variant/10">
              <span>{t('Total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="rounded-xl bg-tertiary/20 p-4 text-sm">
            <span className="font-bold text-primary">+{estimatedPoints} XP</span>
            <span className="text-on-surface-variant/80"> {t('will be earned')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
