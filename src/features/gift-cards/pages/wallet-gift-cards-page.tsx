import { Link } from 'react-router'
import { Gift } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import type { GiftCard, GiftCardStatus } from '@/types/domain'
import { useMyGiftCards } from '../hooks/use-gift-cards'

function parseGiftCardValue(valueLabel?: string) {
  if (!valueLabel) return 0

  const match = valueLabel.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function GiftCardRow({ card, locale, programCurrency }: { card: GiftCard; locale: string; programCurrency: string }) {
  const originalBalance = card.initialBalance ?? parseGiftCardValue(card.catalog?.valueLabel)
  const remainingBalance = Math.max(card.remainingBalance ?? originalBalance, 0)
  const formattedBalance = formatTenantCurrency(remainingBalance, {
    currency: card.business?.currency ?? programCurrency,
    locale,
  })

  return (
    <Link
      to={`/wallet/gift-cards/${card.id}`}
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-primary-container/35 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container">
          <Gift className="size-6" />
        </div>
        <div className="min-w-0">
          <h3 className="break-words font-serif text-2xl font-semibold uppercase tracking-[0.02em] text-primary-container">
            {card.catalog?.title ?? 'Gift card'}
          </h3>
          <p className="text-sm text-on-surface-variant">{card.business?.name}</p>
          <p className="mt-2 break-all font-mono text-sm text-on-surface">{card.code}</p>
          <p className="mt-2 text-sm font-semibold text-on-surface">
            Balance: {formattedBalance}
          </p>
        </div>
      </div>
      <Badge variant={card.status === 'active' ? 'accent' : 'outline'}>{card.status}</Badge>
    </Link>
  )
}

export function WalletGiftCardsPage() {
  const { t } = useLanguage()
  const { program } = useTenant()
  const giftCards = useMyGiftCards()
  const cards = giftCards.data ?? []

  function byStatus(status: GiftCardStatus) {
    return cards.filter((card) => card.status === status)
  }

  function emptyDescription(status: GiftCardStatus) {
    if (status === 'active') return 'Gift cards you can still use will appear here.'
    if (status === 'redeemed') return 'Redeemed gift cards appear here after partner staff scan and redeem them.'
    return 'Expired gift cards will appear here after their use-by date passes.'
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Badge variant="accent">Wallet</Badge>
          <h1 className="font-serif text-4xl font-bold uppercase tracking-[0.02em] text-primary-container sm:text-5xl">
            Gift Cards
          </h1>
          <p className="text-on-surface-variant">Keep active, redeemed, and expired cards in one place.</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/gift-cards">Browse Gift Cards</Link>
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 p-1 sm:inline-flex sm:h-16 sm:w-auto sm:p-2">
          {(['active', 'redeemed', 'expired'] as const).map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="min-w-0 flex-col gap-0.5 px-1.5 py-2 text-[0.68rem] tracking-[0.1em] sm:min-w-32 sm:flex-row sm:px-8 sm:text-sm sm:tracking-widest"
            >
              <span>{status}</span>
              <span aria-label={`${byStatus(status).length} gift cards`}>({byStatus(status).length})</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {(['active', 'redeemed', 'expired'] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {giftCards.isLoading ? (
              <>
                <LoadingState
                  className="py-2"
                  title={t('Loading')}
                  description={t('Opening your gift card wallet.')}
                />
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))}
              </>
            ) : (
              byStatus(status).map((card) => (
                <GiftCardRow
                  key={card.id}
                  card={card}
                  locale={program.locale}
                  programCurrency={program.currency}
                />
              ))
            )}
            {!giftCards.isLoading && byStatus(status).length === 0 ? (
              <EmptyState
                icon={<Gift className="size-8" />}
                title={t('No gift cards here')}
                description={t(emptyDescription(status))}
                action={
                  status === 'active' ? (
                    <Button asChild variant="secondary" className="rounded-full">
                      <Link to="/gift-cards">{t('Browse Gift Cards')}</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
