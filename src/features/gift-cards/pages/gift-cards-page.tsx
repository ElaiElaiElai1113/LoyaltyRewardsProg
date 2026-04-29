import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift } from 'lucide-react'

import { BusinessFilter } from '@/components/business-filter'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useRewardBalance } from '@/hooks/use-customer-data'
import type { GiftCardCatalogItem } from '@/types/domain'
import { GiftCardTile } from '../components/gift-card-tile'
import { IssueConfirmationDialog } from '../components/issue-confirmation-dialog'
import { useGiftCardCatalog, useIssueGiftCard } from '../hooks/use-gift-cards'

export function GiftCardsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<GiftCardCatalogItem | null>(null)
  const businesses = useBusinesses()
  const catalog = useGiftCardCatalog(selectedBusiness ?? undefined)
  const balance = useRewardBalance(profile?.id)
  const issueGiftCard = useIssueGiftCard(profile?.id)
  const balancePoints = balance.data?.points ?? 0

  async function handleIssue() {
    if (!selectedItem) return
    const giftCard = await issueGiftCard.mutateAsync(selectedItem.id)
    setSelectedItem(null)
    navigate(`/wallet/gift-cards/${giftCard.id}`)
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-8 border-b border-primary-container/15 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <Badge variant="accent">Gift Cards</Badge>
          <h1 className="font-serif text-5xl font-bold uppercase tracking-[0.02em] text-primary-container md:text-7xl">
            Gift Card Catalog
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            Spend loyalty points on single-use gift cards from partner businesses.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex items-center gap-4 px-6 py-4">
          <Gift className="size-6 text-secondary-container" />
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Available Points</p>
            <p className="font-serif text-3xl text-primary-container">{balancePoints}</p>
          </div>
        </div>
      </div>

      {(businesses.data ?? []).length > 1 ? (
        <BusinessFilter businesses={businesses.data ?? []} selected={selectedBusiness} onChange={setSelectedBusiness} />
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(catalog.data ?? []).map((item) => (
          <GiftCardTile
            key={item.id}
            item={item}
            balancePoints={balancePoints}
            businessName={item.business?.name}
            onSelect={setSelectedItem}
          />
        ))}
      </div>

      {!catalog.isLoading && (catalog.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-12 text-center text-on-surface-variant">No gift cards are available yet.</div>
      ) : null}

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
