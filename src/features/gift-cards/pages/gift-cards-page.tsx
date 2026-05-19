import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, Sparkles } from 'lucide-react'

import { BusinessFilter } from '@/components/business-filter'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LuxeCarousel } from '@/components/ui/luxe-carousel'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import { useLanguage } from '@/lib/language'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useRewardBalance } from '@/hooks/use-customer-data'
import type { GiftCardCatalogItem } from '@/types/domain'
import { GiftCardTile } from '../components/gift-card-tile'
import { IssueConfirmationDialog } from '../components/issue-confirmation-dialog'
import { useGiftCardCatalog, useIssueGiftCard } from '../hooks/use-gift-cards'

export function GiftCardsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<GiftCardCatalogItem | null>(null)
  const businesses = useBusinesses()
  const catalog = useGiftCardCatalog(selectedBusiness ?? undefined)
  const balance = useRewardBalance(profile?.id)
  const issueGiftCard = useIssueGiftCard(profile?.id)
  const balancePoints = balance.data?.points ?? 0
  const featuredCards = (catalog.data ?? []).slice(0, 5)
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  const rewardActionsLocked = verificationStatus !== 'verified'

  function handleSelect(item: GiftCardCatalogItem) {
    if (rewardActionsLocked) {
      navigate('/profile')
      return
    }
    setSelectedItem(item)
  }

  async function handleIssue() {
    if (!selectedItem) return
    const giftCard = await issueGiftCard.mutateAsync(selectedItem.id)
    setSelectedItem(null)
    navigate(`/wallet/gift-cards/${giftCard.id}`)
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="animate-soft-reveal flex flex-col gap-8 border-b border-primary-container/15 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <Badge variant="accent">Gift Cards</Badge>
          <h1 className="font-serif text-5xl font-bold uppercase tracking-[0.02em] text-primary-container md:text-7xl">
            Gift Card Catalog
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            Spend loyalty points on single-use gift cards from partner businesses.
          </p>
        </div>
        <div className="luxe-card flex items-center gap-4 rounded-[1.5rem] px-6 py-4">
          <div className="luxe-art flex size-12 items-center justify-center rounded-[1rem]">
            <Gift className="size-6" />
          </div>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Available Points</p>
            <p className="animate-soft-reveal font-serif text-4xl text-primary-container">{balancePoints}</p>
          </div>
        </div>
      </div>

      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
        compact
      />

      <div className="luxe-card relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute right-8 top-8 h-24 w-40 rotate-6 rounded-[1.5rem] border border-primary/20 bg-blush/60" />
        <div className="absolute bottom-6 right-28 h-20 w-32 -rotate-6 rounded-[1.25rem] border border-primary/20 bg-card shadow-soft" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">Giftable moments</p>
            <h2 className="mt-3 font-serif text-4xl leading-none text-primary-container md:text-5xl">
              Pretty little credits that feel easy to send.
            </h2>
          </div>
          <div className="animate-float-soft flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-9" />
          </div>
        </div>
      </div>

      {(businesses.data ?? []).length > 1 ? (
        <BusinessFilter businesses={businesses.data ?? []} selected={selectedBusiness} onChange={setSelectedBusiness} />
      ) : null}

      {featuredCards.length > 0 ? (
        <LuxeCarousel
          eyebrow="Gift card circle"
          title="Featured gift cards"
          description="A warm showcase for credits that feel personal, pretty, and quick to claim."
        >
          {featuredCards.map((item) => (
            <GiftCardTile
              key={item.id}
              item={item}
              balancePoints={balancePoints}
              businessName={item.business?.name}
              actionLocked={rewardActionsLocked}
              onSelect={handleSelect}
            />
          ))}
        </LuxeCarousel>
      ) : null}

      {catalog.isLoading ? (
        <div className="space-y-6">
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Preparing gift cards.')}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (catalog.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Gift className="size-8" />}
          title={t('No gift cards yet')}
          description={t('Gift cards from partner businesses will appear here when they are available.')}
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(catalog.data ?? []).map((item) => (
            <GiftCardTile
              key={item.id}
              item={item}
              balancePoints={balancePoints}
              businessName={item.business?.name}
              actionLocked={rewardActionsLocked}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      <IssueConfirmationDialog
        item={selectedItem}
        open={Boolean(selectedItem)}
        isSubmitting={issueGiftCard.isPending}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        onConfirm={() => void handleIssue()}
      />
    </div>
  )
}
