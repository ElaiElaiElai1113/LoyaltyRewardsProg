import { Copy, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import type { GiftCard, PublicGiftCard } from '@/types/domain'

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
}

function parseGiftCardValue(valueLabel?: string) {
  if (!valueLabel) return 0

  const match = valueLabel.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

interface GiftCardDisplayProps {
  giftCard: GiftCard | PublicGiftCard
  publicUrl: string
  title?: string
  businessName?: string
}

export function GiftCardDisplay({ giftCard, publicUrl, title, businessName }: GiftCardDisplayProps) {
  const { program } = useTenant()
  const { language, t } = useLanguage()
  const displayTitle = title ?? giftCard.catalog?.title ?? t('Gift card')
  const displayValue = 'valueLabel' in giftCard ? giftCard.valueLabel : giftCard.catalog?.valueLabel
  const displayBusiness = businessName ?? ('businessName' in giftCard ? giftCard.businessName : giftCard.business?.name)
  const initialBalance = giftCard.initialBalance ?? parseGiftCardValue(displayValue)
  const remainingBalance = Math.max(giftCard.remainingBalance ?? initialBalance, 0)
  const currencyContext = {
    currency: giftCard.business?.currency ?? program.currency,
    locale: language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale,
  }
  const languageLocale = language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale
  const formatBalance = (value: number) => formatTenantCurrency(value, currencyContext)
  const isActive = giftCard.status === 'active' && new Date(giftCard.expiresAt) > new Date()

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl)
    toast.success(t('Gift card link copied'))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-card p-6 text-card-foreground shadow-sm md:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start">
        <div className="mx-auto flex w-full max-w-64 justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 text-[var(--foreground)] lg:mx-0">
          <QRCodeSVG value={publicUrl} size={224} className="block size-56 max-h-[56vw] max-w-[56vw] shrink-0" />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant={isActive ? 'default' : 'outline'}>{t(giftCard.status)}</Badge>
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">
                {displayTitle}
              </h1>
              {displayBusiness ? <p className="text-[var(--muted-foreground)]">{displayBusiness}</p> : null}
            </div>
            {displayValue ? (
              <div className="rounded-lg bg-[var(--muted)] px-5 py-3 text-[var(--foreground)]">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Available Balance')}</span>
                <p className="text-2xl font-semibold">{formatBalance(remainingBalance)}</p>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Original value: {value}', { value: displayValue })}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Code')}</p>
              <p className="mt-1 break-all font-mono text-lg font-semibold text-[var(--foreground)]">{giftCard.code}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Expires')}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{formatDate(giftCard.expiresAt, languageLocale)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Remaining')}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{t('{remaining} of {initial}', { remaining: formatBalance(remainingBalance), initial: formatBalance(initialBalance) })}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={copyLink}>
              <Copy className="size-4" />
              {t('Copy Link')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.share?.({ title: displayTitle, url: publicUrl })
              }}
            >
              <Share2 className="size-4" />
              {t('Share')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
