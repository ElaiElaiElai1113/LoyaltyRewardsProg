import { Copy, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GiftCard, PublicGiftCard } from '@/types/domain'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

interface GiftCardDisplayProps {
  giftCard: GiftCard | PublicGiftCard
  publicUrl: string
  title?: string
  businessName?: string
}

export function GiftCardDisplay({ giftCard, publicUrl, title, businessName }: GiftCardDisplayProps) {
  const displayTitle = title ?? giftCard.catalog?.title ?? 'Gift card'
  const displayValue = 'valueLabel' in giftCard ? giftCard.valueLabel : giftCard.catalog?.valueLabel
  const displayBusiness = businessName ?? ('businessName' in giftCard ? giftCard.businessName : giftCard.business?.name)
  const isActive = giftCard.status === 'active' && new Date(giftCard.expiresAt) > new Date()

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl)
    toast.success('Gift card link copied')
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden p-1">
      <div className="grid gap-8 rounded-md bg-[#17100d]/90 p-6 md:grid-cols-[280px,1fr] md:p-8">
        <div className="rounded border border-primary-container/20 bg-[#fff8ef] p-4 text-primary">
          <QRCodeSVG value={publicUrl} size={248} className="h-auto w-full" />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant={isActive ? 'accent' : 'outline'}>{giftCard.status}</Badge>
              <h1 className="font-serif text-4xl font-bold uppercase tracking-[0.02em] text-primary-container">
                {displayTitle}
              </h1>
              {displayBusiness ? <p className="text-on-surface-variant">{displayBusiness}</p> : null}
            </div>
            {displayValue ? (
              <div className="rounded border border-secondary-container/35 bg-secondary-container/10 px-5 py-3 text-secondary-container">
                <span className="text-xs font-black uppercase tracking-widest">Value</span>
                <p className="font-serif text-2xl font-bold">{displayValue}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Code</p>
              <p className="mt-1 font-mono text-lg font-bold text-on-surface">{giftCard.code}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Expires</p>
              <p className="mt-1 text-sm font-bold text-on-surface">{formatDate(giftCard.expiresAt)}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Points Spent</p>
              <p className="mt-1 text-sm font-bold text-on-surface">{giftCard.pointsSpent}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={copyLink}>
              <Copy className="size-4" />
              Copy Link
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.share?.({ title: displayTitle, url: publicUrl })
              }}
            >
              <Share2 className="size-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
