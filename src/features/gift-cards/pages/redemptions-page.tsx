import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, History, Search, ShieldCheck, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientRequestId } from '@/features/critical-flows/critical-flow'
import {
  calculateMemberTransaction,
  calculateRewardablePurchaseAmount,
} from '@/features/critical-flows/member-transaction'
import {
  useBusinessOwnerData,
  useBusinessMembers,
  useRecordMemberTransaction,
  useScannedMember,
} from '@/hooks/use-business-owner-data'
import { useTenant } from '@/hooks/use-tenant'
import { giftCardsService } from '@/integrations/supabase/services/gift-cards-service'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import { formatPoints } from '@/lib/utils'
import type { GiftCard } from '@/types/domain'
import { QrScanner } from '../components/qr-scanner'
import { RedemptionConfirmationDialog } from '../components/redemption-confirmation-dialog'
import { useBusinessGiftCards, useRedeemGiftCard } from '../hooks/use-gift-cards'
import {
  extractGiftCardCode,
  extractMoneyFromGiftCardNote,
} from '../gift-card-transaction-note'

type ValidationStatus = 'idle' | 'active' | 'redeemed' | 'expired' | 'wrong_business' | 'invalid'
type TransactionHistoryItem =
  | {
      kind: 'member_transaction'
      id: string
      createdAt: string
      receiptNumber: string | null
      customer: string
      totalAmountLabel: string
      discountLabel: string
      finalPriceLabel: string
      pointsLabel: string
      giftCardCode: string | null
      statusLabel: 'Gift card used' | 'Standard sale'
    }
  | {
      kind: 'gift_card_redemption'
      id: string
      createdAt: string
      receiptNumber: string | null
      customer: string
      totalAmountLabel: string
      discountLabel: string
      finalPriceLabel: string
      pointsLabel: string
      giftCardCode: string
      statusLabel: 'Gift card redeemed'
    }

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

function isGiftCardQrValue(input: string) {
  const value = input.trim()
  if (!value) return false

  if (/^GC-/i.test(value)) return true

  try {
    const url = new URL(value)
    return url.pathname.split('/').filter(Boolean).at(0)?.toLowerCase() === 'g'
  } catch {
    return false
  }
}

function parseGiftCardValue(valueLabel?: string) {
  if (!valueLabel) return 0

  const match = valueLabel.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function getGiftCardInitialBalance(card?: GiftCard | null) {
  if (!card) return 0
  return card.initialBalance ?? parseGiftCardValue(card.catalog?.valueLabel)
}

function getGiftCardAvailableBalance(card?: GiftCard | null) {
  if (!card) return 0
  return Math.max(card.remainingBalance ?? getGiftCardInitialBalance(card), 0)
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not recorded'

  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function RedemptionsPage() {
  const queryClient = useQueryClient()
  const { program } = useTenant()
  const { business, memberTransactions } = useBusinessOwnerData()
  const formatCurrency = (value: number) => formatTenantCurrency(value, {
    currency: business?.currency ?? program.currency,
    locale: program.locale,
  })
  const [manualInput, setManualInput] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [memberToken, setMemberToken] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [transactionComplete, setTransactionComplete] = useState(false)
  const [originalBill, setOriginalBill] = useState<number>(0)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const giftCards = useBusinessGiftCards(business?.id)
  const redeemGiftCard = useRedeemGiftCard(business?.id)
  const businessCustomers = useBusinessMembers(business?.id)
  const scannedMember = useScannedMember(memberToken)
  const recordTransaction = useRecordMemberTransaction(business?.id, scannedMember.data?.id)

  const cards = useMemo(() => giftCards.data ?? [], [giftCards.data])
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    const customers = businessCustomers.data ?? []
    if (!query) return customers.slice(0, 8)

    return customers
      .filter((customer) => `${customer.fullName} ${customer.email}`.toLowerCase().includes(query))
      .slice(0, 12)
  }, [businessCustomers.data, customerSearch])
  const transactionRows = useMemo<TransactionHistoryItem[]>(() => {
    const usedGiftCardCodes = new Set(
      memberTransactions
        .map((transaction) => extractGiftCardCode(transaction.note))
        .filter((code): code is string => Boolean(code)),
    )

    const saleRows: TransactionHistoryItem[] = memberTransactions.map((transaction) => {
      const giftCardCode = extractGiftCardCode(transaction.note)
      const currency = transaction.business?.currency ?? business?.currency ?? program.currency
      const currencyContext = { currency, locale: program.locale }
      const giftCardValue = extractMoneyFromGiftCardNote(transaction.note, 'Gift card value') ?? 0
      const originalTotal = extractMoneyFromGiftCardNote(transaction.note, 'Original receipt total') ?? transaction.purchaseAmount + giftCardValue
      const finalPrice = extractMoneyFromGiftCardNote(transaction.note, 'Final bill after gift card') ?? Math.max(originalTotal - giftCardValue, 0)

      return {
        kind: 'member_transaction',
        id: transaction.id,
        createdAt: transaction.createdAt,
        receiptNumber: transaction.receiptNumber,
        customer: transaction.member?.fullName ?? transaction.profileId,
        totalAmountLabel: formatTenantCurrency(originalTotal, currencyContext),
        discountLabel: giftCardValue > 0
          ? `-${formatTenantCurrency(giftCardValue, currencyContext)}`
          : formatTenantCurrency(0, currencyContext),
        finalPriceLabel: formatTenantCurrency(finalPrice, currencyContext),
        pointsLabel: transaction.pointsAwarded.toLocaleString(),
        giftCardCode,
        statusLabel: giftCardCode ? 'Gift card used' : 'Standard sale',
      }
    })

    const standaloneGiftCardRows: TransactionHistoryItem[] = cards
      .filter((card) => (card.redemptionGiftCardAmount ?? 0) > 0 && !usedGiftCardCodes.has(card.code))
      .map((card) => {
        const currencyContext = {
          currency: business?.currency ?? program.currency,
          locale: program.locale,
        }
        const giftCardValue = card.redemptionGiftCardAmount ?? 0
        const originalTotal = card.redemptionOriginalBill ?? giftCardValue
        const fallbackBreakdown = business
          ? calculateRewardablePurchaseAmount({
              receiptTotal: originalTotal,
              taxRate: business.taxRate,
              taxIncludedInBill: business.taxIncludedInBill,
              serviceChargeRate: business.serviceChargeRate,
              serviceChargeEnabled: business.serviceChargeEnabled,
              giftCardAmount: giftCardValue,
            })
          : null
        const fallbackPreview = business && fallbackBreakdown && fallbackBreakdown.rewardableAmount > 0
          ? calculateMemberTransaction({
              purchaseAmount: fallbackBreakdown.rewardableAmount,
              rewardRatePercent: business.rewardRatePercent,
              commissionRatePercent: business.commissionRatePercent,
            })
          : null
        const finalPrice = fallbackBreakdown?.finalPriceAmount ?? Math.max(originalTotal - giftCardValue, 0)

        return {
          kind: 'gift_card_redemption',
          id: card.id,
          createdAt: card.redeemedAt ?? card.updatedAt,
          receiptNumber: card.redemptionReceiptNumber ?? null,
          customer: card.customerFirstName ?? card.customerId,
          totalAmountLabel: formatTenantCurrency(originalTotal, currencyContext),
          discountLabel: giftCardValue > 0
            ? `-${formatTenantCurrency(giftCardValue, currencyContext)}`
            : formatTenantCurrency(0, currencyContext),
          finalPriceLabel: formatTenantCurrency(finalPrice, currencyContext),
          pointsLabel: fallbackPreview ? formatPoints(fallbackPreview.pointsAwarded) : 'Not recorded',
          giftCardCode: card.code,
          statusLabel: 'Gift card redeemed',
        }
      })

    return [...saleRows, ...standaloneGiftCardRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [business, cards, memberTransactions, program.currency, program.locale])
  const selectedGiftCardAvailableBalance = getGiftCardAvailableBalance(selectedCard)
  const baseBreakdown = useMemo(() => {
    if (!business || !Number.isFinite(originalBill) || originalBill <= 0) return null

    return calculateRewardablePurchaseAmount({
      receiptTotal: originalBill,
      taxRate: business.taxRate,
      taxIncludedInBill: business.taxIncludedInBill,
      serviceChargeRate: business.serviceChargeRate,
      serviceChargeEnabled: business.serviceChargeEnabled,
      giftCardAmount: 0,
    })
  }, [business, originalBill])
  const selectedGiftCardValue = Math.min(selectedGiftCardAvailableBalance, baseBreakdown?.finalPriceAmount ?? Math.max(Number.isFinite(originalBill) ? originalBill : 0, 0))
  const canRedeemSelectedCard = validationStatus === 'active' && selectedGiftCardAvailableBalance > 0 && originalBill > 0 && receiptNumber.trim().length >= 3
  const rewardableBreakdown = useMemo(() => {
    if (!business || !Number.isFinite(originalBill) || originalBill <= 0) return null

    return calculateRewardablePurchaseAmount({
      receiptTotal: originalBill,
      taxRate: business.taxRate,
      taxIncludedInBill: business.taxIncludedInBill,
      serviceChargeRate: business.serviceChargeRate,
      serviceChargeEnabled: business.serviceChargeEnabled,
      giftCardAmount: selectedGiftCardValue,
    })
  }, [business, originalBill, selectedGiftCardValue])
  const hasGiftCardEntry = manualInput.trim().length > 0
  const preview = useMemo(() => {
    if (!business || !rewardableBreakdown || rewardableBreakdown.rewardableAmount <= 0) return null

    return calculateMemberTransaction({
      purchaseAmount: rewardableBreakdown.rewardableAmount,
      rewardRatePercent: business.rewardRatePercent,
      commissionRatePercent: business.commissionRatePercent,
    })
  }, [business, rewardableBreakdown])
  const canProcessWithGiftCard = hasGiftCardEntry && Boolean(selectedCard) && canRedeemSelectedCard && !redeemGiftCard.isPending
  const canProcessWithoutGiftCard =
    !hasGiftCardEntry &&
    Boolean(scannedMember.data) &&
    Boolean(preview) &&
    receiptNumber.trim().length >= 3 &&
    !recordTransaction.isPending

  async function refreshTransactionHistory() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['member-transactions', business?.id] }),
      queryClient.invalidateQueries({ queryKey: ['gift-cards', 'business', business?.id ?? 'missing'] }),
      queryClient.invalidateQueries({ queryKey: ['metrics', business?.id] }),
    ])
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['member-transactions', business?.id], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['gift-cards', 'business', business?.id ?? 'missing'], type: 'active' }),
    ])
  }

  async function validate(input: string) {
    const needle = extractTokenOrCode(input)
    const preloadedCard = cards.find((item) => item.publicToken === needle || item.code.toLowerCase() === needle.toLowerCase())

    setManualInput(input)

    if (!needle) {
      setSelectedCard(null)
      setValidationStatus('idle')
      return
    }

    setIsValidating(true)

    try {
      const card = preloadedCard ?? await giftCardsService.findGiftCardByTokenOrCode(needle)
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

      if (getGiftCardAvailableBalance(card) <= 0) {
        setValidationStatus('redeemed')
        return
      }

      if (card.status !== 'active' || new Date(card.expiresAt) <= new Date()) {
        setValidationStatus('expired')
        return
      }

      setValidationStatus('active')
    } catch {
      setSelectedCard(null)
      setValidationStatus('invalid')
    } finally {
      setIsValidating(false)
    }
  }

  async function redeem() {
    if (!selectedCard) return
    let updatedCard: GiftCard
    try {
      updatedCard = await redeemGiftCard.mutateAsync({
        giftCardId: selectedCard.id,
        originalBill,
        receiptNumber: receiptNumber.trim(),
        giftCardAmount: selectedGiftCardValue,
        clientRequestId: createClientRequestId(),
      })
    } catch {
      // Mutation failures are already reported by the owning hook.
      return
    }
    try {
      await refreshTransactionHistory()
    } catch {
      // Mutation invalidation still refreshes the data after a transient explicit refetch failure.
    }
    setConfirmOpen(false)
    setSelectedCard(updatedCard)
    setValidationStatus(updatedCard.status === 'active' && getGiftCardAvailableBalance(updatedCard) > 0 ? 'active' : 'redeemed')
    setTransactionComplete(true)
  }

  async function recordStandardTransaction() {
    if (!business || !scannedMember.data || !rewardableBreakdown || !preview) return

    try {
      await recordTransaction.mutateAsync({
        token: memberToken,
        purchaseAmount: rewardableBreakdown.rewardableAmount,
        receiptNumber: receiptNumber.trim(),
        note: [
          `Original receipt total: ${originalBill.toFixed(2)}.`,
          `Gift card value: 0.00.`,
          `Final bill after gift card: ${rewardableBreakdown.finalPriceAmount.toFixed(2)}.`,
          `Tax added: ${rewardableBreakdown.taxableChargeAmount.toFixed(2)}.`,
          `Service charge added: ${rewardableBreakdown.serviceChargeAmount.toFixed(2)}.`,
        ].join(' '),
        clientRequestId: createClientRequestId(),
      })
    } catch {
      // Mutation failures are already reported by the owning hook.
      return
    }
    try {
      await refreshTransactionHistory()
    } catch {
      // Mutation invalidation still refreshes the data after a transient explicit refetch failure.
    }
    setTransactionComplete(true)
  }

  function startNewTransaction() {
    setManualInput('')
    setMemberInput('')
    setMemberToken('')
    setCustomerSearch('')
    setValidationStatus('idle')
    setSelectedCard(null)
    setConfirmOpen(false)
    setTransactionComplete(false)
    setOriginalBill(0)
    setReceiptNumber('')
  }

  function scanMember(value: string) {
    const token = extractTokenOrCode(value)
    setMemberInput(value)
    setMemberToken(token)
  }

  function selectCustomer(memberQrToken: string | null, fullName: string) {
    if (!memberQrToken) return
    setCustomerSearch(fullName)
    scanMember(memberQrToken)
  }

  function updateGiftCardInput(value: string) {
    setManualInput(value)

    if (!value.trim()) {
      setSelectedCard(null)
      setValidationStatus('idle')
      return
    }

    if (selectedCard && extractTokenOrCode(value) !== selectedCard.publicToken && extractTokenOrCode(value).toLowerCase() !== selectedCard.code.toLowerCase()) {
      setSelectedCard(null)
      setValidationStatus('idle')
    }
  }

  function scanTransactionQr(value: string) {
    if (isGiftCardQrValue(value)) {
      setManualInput(value)
      void validate(value)
      return
    }

    scanMember(value)
  }

  return (
    <div className="space-y-8">
      <section>
        <div>
          <Badge variant="accent" className="w-fit">Business Transactions</Badge>
          <h1 className="mt-3 font-serif text-5xl tracking-tight text-primary">Transactions</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            Choose the customer, enter the bill, and complete the sale. The website calculates rewards automatically.
          </p>
        </div>
      </section>

      {transactionComplete ? (
        <Card className="border-success/20 bg-success/10">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 size-5 text-success" />
              <div>
                <p className="font-serif text-2xl text-primary">Transaction complete</p>
                <p className="text-sm text-on-surface-variant/75">
                  {selectedCard
                    ? `Gift card charged ${formatCurrency(rewardableBreakdown?.giftCardAmount ?? selectedGiftCardValue)}. Remaining balance: ${formatCurrency(getGiftCardAvailableBalance(selectedCard))}.`
                    : preview
                      ? `Rewards issued from ${formatCurrency(rewardableBreakdown?.rewardableAmount ?? 0)} rewardable bill.`
                      : 'Gift card covered the full bill, so no points were awarded.'}
                </p>
              </div>
            </div>
            <Button type="button" variant="secondary" className="rounded-full" onClick={startNewTransaction}>
              New Transaction
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit">Step 1</Badge>
            <CardTitle>Choose the Customer</CardTitle>
            <CardDescription>Pick a saved customer, scan with the camera, or choose a screenshot. You only need one method.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-low p-4" data-customer-picker>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Pick a saved customer</p>
                  <p className="text-sm text-on-surface-variant/75">Search by name or email, then tap the customer.</p>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/60" />
                <Input
                  aria-label="Search customers"
                  className="pl-10"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search customer name or email"
                />
              </div>

              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto" role="list" aria-label="Saved customers">
                {businessCustomers.isLoading ? (
                  <p className="p-3 text-sm text-on-surface-variant/70">Loading customers...</p>
                ) : businessCustomers.isError ? (
                  <p className="rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning">Customer list could not be loaded. Scan their QR instead.</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="p-3 text-sm text-on-surface-variant/70">No saved customer matches that search. Scan their member QR for the first sale.</p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-outline-variant/15 bg-card px-4 py-3 text-left transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={!customer.memberQrToken}
                      aria-label={`Select ${customer.fullName}`}
                      onClick={() => selectCustomer(customer.memberQrToken, customer.fullName)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-primary">{customer.fullName}</span>
                        <span className="block truncate text-xs text-on-surface-variant/70">{customer.email}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-on-surface-variant/70">
                        {customer.memberQrToken ? 'Choose' : 'QR required'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/55">
              <span className="h-px flex-1 bg-outline-variant/20" />
              Or scan
              <span className="h-px flex-1 bg-outline-variant/20" />
            </div>

            <QrScanner
              idleMessage="Scan a member QR or gift card QR. Full phone screenshots work too."
              detectedMessage="QR detected. The transaction form was updated."
              onDetected={scanTransactionQr}
            />

            <details className="rounded-lg border border-outline-variant/15 bg-surface-low px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-primary">Enter a QR link or code manually</summary>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Input
                  id="member-qr-token"
                  aria-label="Member QR link or token"
                  value={memberInput}
                  onChange={(event) => setMemberInput(event.target.value)}
                  placeholder="Paste the member QR link or token"
                />
                <Button type="button" variant="secondary" onClick={() => scanMember(memberInput)}>
                  <ShieldCheck className="size-4" />
                  Load Customer
                </Button>
              </div>
            </details>

            {scannedMember.isLoading ? (
              <p className="rounded-lg bg-surface-low p-3 text-sm font-semibold text-on-surface-variant/70">Loading customer...</p>
            ) : scannedMember.data ? (
              <p className="rounded-lg bg-success/10 p-3 text-sm font-semibold text-success" role="status">
                Customer selected: {scannedMember.data.fullName}
              </p>
            ) : memberToken ? (
              <p className="rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning">
                Customer not found. Ask them to open their current member QR and scan again.
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="original-bill">Step 2 — Bill before tax/service</Label>
                <Input
                  id="original-bill"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalBill || ''}
                  onChange={(event) => setOriginalBill(Number(event.target.value))}
                  placeholder="2300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gift-card-receipt-number">Step 3 — Receipt / bill number</Label>
                <Input
                  id="gift-card-receipt-number"
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  placeholder="Receipt #, factura #, POS bill #"
                />
              </div>
            </div>

            <div className="rounded border border-primary-container/20 bg-surface-low p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Optional gift card</p>
                  <p className="text-sm text-on-surface-variant/75">Use only when the customer is paying with a gift card.</p>
                </div>
                <Badge variant={validationStatus === 'active' ? 'accent' : validationStatus === 'idle' ? 'outline' : 'secondary'}>
                  {validationStatus === 'idle' ? 'No gift card' : validationStatus.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="gift-card-code"
                  value={manualInput}
                  onChange={(event) => updateGiftCardInput(event.target.value)}
                  placeholder="GC-260429-A1B2C3 or gift card QR link"
                />
                <Button type="button" disabled={isValidating} onClick={() => void validate(manualInput)}>
                  <ShieldCheck className="size-4" />
                  {isValidating ? 'Validating...' : 'Validate Gift Card'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="accent">Step 4</Badge>
            <CardTitle>Check and Complete</CardTitle>
            <CardDescription>Confirm these three details, then tap the single button below.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-surface-low p-4">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Customer</span>
                <strong className="mt-1 block text-lg text-primary">
                  {scannedMember.data?.fullName ?? selectedCard?.customerFirstName ?? 'Choose or scan a customer'}
                </strong>
              </div>
              <div className="rounded-xl bg-surface-low p-4">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Customer pays</span>
                <strong className="mt-1 block text-2xl text-primary">
                  {formatCurrency(rewardableBreakdown?.finalPriceAmount ?? 0)}
                </strong>
                {selectedGiftCardValue > 0 ? (
                  <span className="mt-1 block text-xs text-on-surface-variant/70">
                    Gift card covers {formatCurrency(selectedGiftCardValue)}.
                  </span>
                ) : null}
              </div>
              <div className="rounded-xl bg-surface-low p-4">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Customer earns</span>
                <strong className="mt-1 block text-2xl text-primary">{formatPoints(preview?.pointsAwarded ?? 0)} points</strong>
              </div>

              {selectedCard ? (
                <div className="rounded-xl border border-primary-container/20 bg-primary/5 p-4">
                  <p className="font-semibold text-primary-container">{selectedCard.catalog?.title ?? 'Gift card'}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Balance after this sale: {formatCurrency(Math.max(selectedGiftCardAvailableBalance - selectedGiftCardValue, 0))}
                  </p>
                </div>
              ) : null}

              {validationStatus !== 'idle' && validationStatus !== 'active' ? (
                <div className="flex gap-3 rounded bg-surface-low p-3 text-sm">
                  <AlertTriangle className="size-5 text-error" />
                  <p>
                    {validationStatus === 'redeemed'
                      ? 'This gift card has already been redeemed.'
                      : validationStatus === 'wrong_business'
                        ? 'This gift card belongs to a different business.'
                        : 'This gift card cannot be redeemed.'}
                  </p>
                </div>
              ) : null}

              <div className="pt-2">
                {hasGiftCardEntry ? (
                  <Button
                    type="button"
                    className="min-h-12 w-full"
                    disabled={!canProcessWithGiftCard}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {redeemGiftCard.isPending ? 'Completing Sale...' : 'Redeem Gift Card and Complete Sale'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="min-h-12 w-full"
                    disabled={!canProcessWithoutGiftCard}
                    onClick={() => void recordStandardTransaction()}
                  >
                    {recordTransaction.isPending ? 'Completing Sale...' : 'Complete Sale'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="w-fit">History</Badge>
            <h2 className="mt-3 font-serif text-3xl text-primary">Transaction History</h2>
            <p className="mt-1 text-sm text-on-surface-variant/75">
              Recorded customer purchases for {business?.name ?? 'this business'} appear here, including normal member QR sales and gift card transactions.
            </p>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant/70">
            {transactionRows.length} transactions
          </p>
        </div>

        {giftCards.isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm font-medium text-on-surface-variant">
              Loading transaction history...
            </CardContent>
          </Card>
        ) : transactionRows.length === 0 ? (
          <EmptyState
            className="rounded-[1.5rem] py-10"
            icon={<History className="size-8" />}
            title="No transactions yet"
            description="After staff redeem a gift card or scan a member QR and record a purchase, the receipt, rewardable bill, points, commission, and optional gift card code will appear here."
          />
        ) : (
          <Card>
            <CardContent className="divide-y divide-outline-variant/10 p-0">
              {transactionRows.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,2fr)_minmax(0,1.25fr)] lg:items-start"
                  data-transaction-receipt={transaction.receiptNumber ?? undefined}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={transaction.giftCardCode ? 'secondary' : 'outline'} className="w-fit">
                        {transaction.statusLabel}
                      </Badge>
                    </div>
                    <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Receipt</p>
                    <p className="mt-1 break-words font-serif text-xl text-primary-container">
                      {transaction.receiptNumber ?? (transaction.kind === 'gift_card_redemption' ? 'Gift card only' : 'No receipt')}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-on-surface-variant">{formatDateTime(transaction.createdAt)}</p>
                    <p className="mt-4 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Customer</p>
                    <p className="mt-1 font-semibold text-on-surface">{transaction.customer}</p>
                  </div>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-low p-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Total</p>
                      <p className="mt-2 font-semibold text-on-surface" data-testid="transaction-total">
                        {transaction.totalAmountLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-low p-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Gift Card Discount</p>
                      <p className="mt-2 font-semibold text-on-surface" data-testid="transaction-gift-card-discount">
                        {transaction.discountLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-low p-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Final Price</p>
                      <p className="mt-2 font-semibold text-on-surface" data-testid="transaction-final-price">
                        {transaction.finalPriceLabel}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Points</p>
                      <p className="mt-2 text-lg font-semibold text-on-surface">{transaction.pointsLabel}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-low p-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Gift Card</p>
                      <p className="mt-2 break-all font-mono text-xs font-semibold text-on-surface">{transaction.giftCardCode ?? 'None'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
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
