import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import type { GiftCard } from '@/types/domain'
import { QrScanner } from '../components/qr-scanner'
import { RedemptionConfirmationDialog } from '../components/redemption-confirmation-dialog'
import { useBusinessGiftCards, useRedeemGiftCard } from '../hooks/use-gift-cards'

type ValidationStatus = 'idle' | 'active' | 'redeemed' | 'expired' | 'wrong_business' | 'invalid'

function extractTokenOrCode(input: string) {
  const value = input.trim()
  if (!value) return ''

  try {
    const url = new URL(value)
    const token = url.pathname.split('/').filter(Boolean).at(-1)
    return token ?? value
  } catch {
    return value
  }
}

export function RedemptionsPage() {
  const { business } = useBusinessOwnerData()
  const [manualInput, setManualInput] = useState('')
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const giftCards = useBusinessGiftCards(business?.id)
  const redeemGiftCard = useRedeemGiftCard(business?.id)

  const cards = useMemo(() => giftCards.data ?? [], [giftCards.data])

  function validate(input: string) {
    const needle = extractTokenOrCode(input)
    const card = cards.find((item) => item.publicToken === needle || item.code.toLowerCase() === needle.toLowerCase())

    setManualInput(input)
    setSelectedCard(card ?? null)

    if (!card) {
      setValidationStatus('invalid')
      return
    }

    if (card.businessId !== business?.id) {
      setValidationStatus('wrong_business')
      return
    }

    if (card.status === 'redeemed') {
      setValidationStatus('redeemed')
      return
    }

    if (card.status !== 'active' || new Date(card.expiresAt) <= new Date()) {
      setValidationStatus('expired')
      return
    }

    setValidationStatus('active')
  }

  async function redeem() {
    if (!selectedCard) return
    await redeemGiftCard.mutateAsync(selectedCard.id)
    setConfirmOpen(false)
    setValidationStatus('redeemed')
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-5xl tracking-tight text-primary">Gift Card Redemptions</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            Scan, upload, or enter a code to validate a single-use gift card for {business?.name ?? 'this business'}.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit">Scanner</Badge>
            <CardTitle>Camera or Upload</CardTitle>
            <CardDescription>Use the counter device camera when available, upload a QR screenshot, or paste the code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <QrScanner onDetected={validate} />
            <div className="grid gap-3">
              <Label htmlFor="gift-card-code">Paste QR link, token, or code</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="gift-card-code"
                  value={manualInput}
                  onChange={(event) => setManualInput(event.target.value)}
                  placeholder="GC-260429-A1B2C3 or https://.../g/token"
                />
                <Button type="button" onClick={() => validate(manualInput)}>
                  <ShieldCheck className="size-4" />
                  Validate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant={validationStatus === 'active' ? 'accent' : validationStatus === 'idle' ? 'outline' : 'secondary'}>
              {validationStatus === 'idle' ? 'Awaiting scan' : validationStatus.replace('_', ' ')}
            </Badge>
            <CardTitle>Validation Result</CardTitle>
            <CardDescription>Only active cards for this business can be redeemed.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCard ? (
              <div className="space-y-5">
                <div className="rounded border border-primary-container/20 bg-surface-low p-5">
                  <h3 className="font-serif text-3xl text-primary-container">{selectedCard.catalog?.title ?? 'Gift card'}</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-on-surface-variant">Customer</p>
                      <p className="font-semibold">{selectedCard.customerFirstName ?? selectedCard.customerId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-on-surface-variant">Code</p>
                      <p className="font-mono font-semibold">{selectedCard.code}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-on-surface-variant">Value</p>
                      <p className="font-semibold">{selectedCard.catalog?.valueLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-on-surface-variant">Status</p>
                      <p className="font-semibold">{selectedCard.status === 'active' ? 'Active' : selectedCard.status === 'expired' ? 'Expired' : 'Redeemed'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-surface-low p-4">
                  {validationStatus === 'active' ? (
                    <div className="flex gap-3 text-sm">
                      <CheckCircle2 className="size-5 text-primary-container" />
                      <p>Ready to redeem at {business?.name}.</p>
                    </div>
                  ) : (
                    <div className="flex gap-3 text-sm">
                      <AlertTriangle className="size-5 text-error" />
                      <p>
                        {validationStatus === 'redeemed'
                          ? 'This gift card has already been redeemed.'
                          : validationStatus === 'wrong_business'
                            ? 'This gift card belongs to a different business.'
                            : 'This gift card cannot be redeemed.'}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={validationStatus !== 'active'}
                  onClick={() => setConfirmOpen(true)}
                >
                  Redeem Gift Card
                </Button>
              </div>
            ) : (
              <div className="rounded bg-surface-low p-5 text-sm text-on-surface-variant">
                {validationStatus === 'invalid' ? 'No matching gift card was found.' : 'Scan or enter a gift card to validate it.'}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <RedemptionConfirmationDialog
        giftCard={selectedCard}
        open={confirmOpen}
        isSubmitting={redeemGiftCard.isPending}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void redeem()}
      />
    </div>
  )
}
