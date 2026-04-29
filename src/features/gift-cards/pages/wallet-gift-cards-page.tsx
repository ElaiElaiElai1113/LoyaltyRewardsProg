import { Link } from 'react-router-dom'
import { Gift } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { GiftCard, GiftCardStatus } from '@/types/domain'
import { useMyGiftCards } from '../hooks/use-gift-cards'

function GiftCardRow({ card }: { card: GiftCard }) {
  return (
    <Link
      to={`/wallet/gift-cards/${card.id}`}
      className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex flex-col gap-4 p-5 transition-all hover:border-primary-container/35 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container">
          <Gift className="size-6" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-semibold uppercase tracking-[0.02em] text-primary-container">
            {card.catalog?.title ?? 'Gift card'}
          </h3>
          <p className="text-sm text-on-surface-variant">{card.business?.name}</p>
          <p className="mt-2 font-mono text-sm text-on-surface">{card.code}</p>
        </div>
      </div>
      <Badge variant={card.status === 'active' ? 'accent' : 'outline'}>{card.status}</Badge>
    </Link>
  )
}

export function WalletGiftCardsPage() {
  const giftCards = useMyGiftCards()
  const cards = giftCards.data ?? []

  function byStatus(status: GiftCardStatus) {
    return cards.filter((card) => card.status === status)
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Badge variant="accent">Wallet</Badge>
          <h1 className="font-serif text-5xl font-bold uppercase tracking-[0.02em] text-primary-container">
            Gift Cards
          </h1>
          <p className="text-on-surface-variant">Keep active, redeemed, and expired cards in one place.</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/gift-cards">Browse Gift Cards</Link>
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        {(['active', 'redeemed', 'expired'] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {byStatus(status).map((card) => <GiftCardRow key={card.id} card={card} />)}
            {!giftCards.isLoading && byStatus(status).length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-10 text-center text-on-surface-variant">No {status} gift cards.</div>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
