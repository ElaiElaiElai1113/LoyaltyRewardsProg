import { Link, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/lib/language'
import { GiftCardDisplay } from '../components/gift-card-display'
import { useGiftCard } from '../hooks/use-gift-cards'

export function GiftCardDetailPage() {
  const { t } = useLanguage()
  const { id } = useParams()
  const giftCard = useGiftCard(id)
  const card = giftCard.data
  const publicUrl = card && typeof window !== 'undefined' ? `${window.location.origin}/g/${card.publicToken}` : ''

  if (giftCard.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState title={t('Loading')} description={t('Opening your gift card.')} />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!card) {
    return <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm p-10 text-on-surface-variant">{t('Gift card not found.')}</div>
  }

  return (
    <div className="space-y-8 pb-20">
      <Button asChild variant="ghost">
        <Link to="/wallet/gift-cards">{t('Back to Wallet')}</Link>
      </Button>
      <GiftCardDisplay
        giftCard={card}
        publicUrl={publicUrl}
        title={card.catalog?.title}
        businessName={card.business?.name}
      />
    </div>
  )
}
