import { useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GiftCardDisplay } from '../components/gift-card-display'
import { usePublicGiftCard } from '../hooks/use-gift-cards'

export function PublicGiftCardPage() {
  const { publicToken } = useParams()
  const giftCard = usePublicGiftCard(publicToken)
  const card = giftCard.data
  const publicUrl = publicToken && typeof window !== 'undefined' ? `${window.location.origin}/g/${publicToken}` : ''

  if (giftCard.isLoading) {
    return <Skeleton className="h-96 rounded-xl" />
  }

  if (!card) {
    return <div className="rounded-xl border border-[var(--border)] bg-card shadow-card p-10 text-on-surface-variant">Gift card not found.</div>
  }

  return (
    <div className="space-y-8 py-10">
      <div
        className="rounded border p-8 text-primary-foreground"
        style={{ background: `linear-gradient(135deg, ${card.businessPrimaryColor}, ${card.businessAccentColor})` }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="outline" className="border-border text-primary-foreground">{card.status}</Badge>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase tracking-[0.02em]">{card.businessName}</h1>
            <p className="mt-2 text-primary-foreground/80">{card.customerFirstName}'s gift card</p>
          </div>
          {card.businessLogoUrl ? <img src={card.businessLogoUrl} alt="" className="size-20 rounded bg-card object-contain p-2" /> : null}
        </div>
      </div>
      <GiftCardDisplay giftCard={card} publicUrl={publicUrl} title={card.title} businessName={card.businessName} />
    </div>
  )
}
