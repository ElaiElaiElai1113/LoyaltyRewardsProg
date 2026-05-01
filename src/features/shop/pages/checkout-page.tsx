import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeCheckoutItems } from '@/features/critical-flows/critical-flow'
import { EarnRedeemGate } from '@/features/membership/components/earn-redeem-gate'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useCart, usePlaceOrder, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { CheckoutFormValues } from '@/types/forms'
import { checkoutSchema } from '@/types/forms'

export function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useCart()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const products = useProducts()
  const businesses = useBusinesses()
  const placeOrder = usePlaceOrder(profile?.id)

  const [error, setError] = useState<string | null>(null)
  const [partnerCode, setPartnerCode] = useState(() => sessionStorage.getItem('partnerReferrerCode') ?? '')

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

  if (resolvedItems.length === 0) {
    return <Navigate to="/cart" replace />
  }

  let businessId = ''
  let validationError: string | null = null

  try {
    businessId = normalizeCheckoutItems(
      resolvedItems.map(({ product, quantity }) => ({
        productId: product.id,
        businessId: product.businessId,
        quantity,
      })),
    ).businessId
  } catch (validationIssue) {
    validationError = validationIssue instanceof Error ? validationIssue.message : t('Your cart is invalid.')
  }

  const subtotal = resolvedItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const business = businesses.data?.find((row) => row.id === businessId)
  const taxRate = business?.taxRate ?? 0.09
  const tax = +(subtotal * taxRate).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)
  const estimatedPoints = Math.floor(total * (business?.earnRate ?? 10))

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          {t('Demo Checkout')}
        </Badge>
        <h1 className="font-display text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Demo Checkout')}
        </h1>
        <p className="text-base font-medium leading-relaxed text-on-surface-variant/80">
          {t('No real payment will be processed. This checkout creates a demo order for rewards testing.')}
        </p>
      </div>

      <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-primary">{t('Simulated Payment Method')}</h2>
              <p className="text-sm font-medium text-on-surface-variant/75">
                {t('Use the preset demo payment options below. They do not charge a real card.')}
              </p>
            </div>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                if (validationError) {
                  setError(validationError)
                  return
                }

                try {
                  setError(null)
                  const order = await placeOrder.mutateAsync({
                    businessId,
                    paymentMethod: values.paymentMethod,
                    partnerCode,
                  })
                  if (partnerCode.trim()) {
                    sessionStorage.removeItem('partnerReferrerCode')
                    sessionStorage.removeItem('partnerBusinessId')
                  }
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
                      className={`cursor-pointer rounded-2xl border p-4 text-sm font-medium transition-colors ${
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

              <div className="grid gap-3">
                <Label htmlFor="partner-code">Partner Code</Label>
                <Input
                  id="partner-code"
                  value={partnerCode}
                  placeholder="Optional front-desk or receptionist code"
                  className="uppercase"
                  onChange={(event) => setPartnerCode(event.target.value.toUpperCase())}
                />
                <p className="text-xs text-on-surface-variant/75">
                  Add a receptionist or front-desk code if someone from a hotel, hostel, or partner business referred you.
                </p>
              </div>

              {(validationError || error) && (
                <p className="text-center text-sm font-bold text-error">{validationError ?? error}</p>
              )}

              <EarnRedeemGate action="earn">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full h-16 text-lg font-bold shadow-card"
                  disabled={placeOrder.isPending || Boolean(validationError)}
                >
                  {placeOrder.isPending ? t('Placing Order...') : `${t('Place order')} ${formatCurrency(total)}`}
                </Button>
              </EarnRedeemGate>
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6 h-fit sticky top-32">
          <h2 className="font-display text-2xl text-primary">{t('Order Summary')}</h2>
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
            <span className="font-bold text-primary">+{estimatedPoints} {t('points')}</span>
            <span className="text-on-surface-variant/80"> {t('will be earned')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
