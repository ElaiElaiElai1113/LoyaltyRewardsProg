import { useState } from 'react'
import { Gift } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminAllBusinesses } from '@/hooks/use-admin-data'
import { useBusinessMembers } from '@/hooks/use-business-owner-data'
import { useTenant } from '@/hooks/use-tenant'
import { usePagination } from '@/hooks/use-pagination'
import { useLanguage } from '@/lib/language'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import type { GiftCard } from '@/types/domain'
import { useGiftCardCatalog, useBusinessGiftCards, useIssueGiftCardToCustomer } from '../hooks/use-gift-cards'

export function AdminGiftCardsPage() {
  const { language, t } = useLanguage()
  const { program } = useTenant()
  const businesses = useAdminAllBusinesses()
  const [businessId, setBusinessId] = useState<string | undefined>(undefined)
  const [issueCatalogId, setIssueCatalogId] = useState('')
  const [issueCustomerId, setIssueCustomerId] = useState('')
  const catalog = useGiftCardCatalog(businessId)
  const giftCards = useBusinessGiftCards(businessId)
  const members = useBusinessMembers(businessId)
  const issueGiftCard = useIssueGiftCardToCustomer(issueCustomerId, businessId)
  const selectedBusiness = businesses.data?.find((business) => business.id === businessId)
  const catalogItems = catalog.data ?? []
  const issuedCards = giftCards.data ?? []
  const catalogPagination = usePagination(catalogItems, 8, businessId ?? 'all')
  const issuedPagination = usePagination(issuedCards, 8, businessId ?? 'all')

  function formatCardBalance(card: GiftCard) {
    const value = card.remainingBalance ?? card.initialBalance ?? 0
    const currency = card.business?.currency ?? selectedBusiness?.currency

    return currency
      ? formatTenantCurrency(value, { currency, locale: language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale })
      : value.toLocaleString(language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale, { maximumFractionDigits: 2 })
  }

  function changeBusiness(value: string) {
    setBusinessId(value === 'all' ? undefined : value)
    setIssueCatalogId('')
    setIssueCustomerId('')
  }

  async function issueToCustomer() {
    if (!issueCatalogId || !issueCustomerId) return
    try {
      await issueGiftCard.mutateAsync(issueCatalogId)
      setIssueCatalogId('')
      setIssueCustomerId('')
    } catch {
      // The mutation hook already presents the actionable error toast.
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Gift Cards')}</h1>
          <p className="text-lg text-on-surface-variant/85">{t('Review catalog items and issued cards across the platform.')}</p>
        </div>
        <div className="w-full sm:w-80">
          <Select value={businessId ?? 'all'} onValueChange={changeBusiness}>
            <SelectTrigger>
              <SelectValue placeholder={t('All businesses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All businesses')}</SelectItem>
              {(businesses.data ?? []).map((business) => (
                <SelectItem key={business.id} value={business.id}>{business.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
          <p className="text-sm text-on-surface-variant">{t('Catalog Items')}</p>
          <p className="mt-2 font-serif text-4xl text-primary-container">{catalog.data?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
          <p className="text-sm text-on-surface-variant">{t('Issued Cards')}</p>
          <p className="mt-2 font-serif text-4xl text-primary-container">{giftCards.data?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
          <p className="text-sm text-on-surface-variant">{t('Active Cards')}</p>
          <p className="mt-2 font-serif text-4xl text-primary-container">
            {giftCards.data?.filter((card) => card.status === 'active').length ?? 0}
          </p>
        </div>
      </section>

      {businessId ? (
        <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline">{t('Admin issue')}</Badge>
              <h2 className="mt-3 font-serif text-3xl text-primary-container">{t('Issue a Gift Card')}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {t('Admin-issued cards use the catalog value and do not deduct customer points.')}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-full px-6"
              disabled={!issueCatalogId || !issueCustomerId || issueGiftCard.isPending}
              onClick={() => void issueToCustomer()}
            >
              <Gift className="size-4" />
              {issueGiftCard.isPending ? t('Issuing...') : t('Issue Card')}
            </Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t('Gift card')}</Label>
              <Select value={issueCatalogId} onValueChange={setIssueCatalogId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Choose a catalog item')} />
                </SelectTrigger>
                <SelectContent>
                  {catalogItems.filter((item) => item.isActive).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.title} - {item.valueLabel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('Customer')}</Label>
              <Select value={issueCustomerId} onValueChange={setIssueCustomerId} disabled={members.isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={members.isLoading ? t('Loading customers...') : t('Choose a customer')} />
                </SelectTrigger>
                <SelectContent>
                  {(members.data ?? []).map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName} - {member.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-serif text-3xl text-primary-container">{t('Catalog')}</h2>
        <div className="grid gap-4">
          {catalogPagination.pageItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex items-center justify-between gap-4 p-5">
              <div>
                <h3 className="font-serif text-2xl text-primary-container">{item.title}</h3>
                <p className="text-sm text-on-surface-variant">{item.business?.name} · {t('{points} points', { points: item.pointsCost })} · {item.valueLabel}</p>
              </div>
              <Badge variant={item.isActive ? 'accent' : 'outline'}>{item.isActive ? t('Active') : t('Inactive')}</Badge>
            </div>
          ))}
        </div>
        <PaginationControls ariaLabel={t('Admin gift card catalog pagination')} {...catalogPagination} onPageChange={catalogPagination.setPage} />
      </section>

      {businessId ? (
        <section className="space-y-4">
          <h2 className="font-serif text-3xl text-primary-container">{t('Issued')}</h2>
          <div className="grid gap-4">
            {issuedPagination.pageItems.map((card) => (
              <div key={card.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl text-primary-container">{card.catalog?.title ?? card.code}</h3>
                  <p className="font-mono text-sm text-on-surface-variant">{card.code}</p>
                  <p className="mt-1 break-all text-sm text-on-surface-variant">
                    {card.customerFirstName ? t('Customer: {name}', { name: card.customerFirstName }) : t('Customer ID: {id}', { id: card.customerId })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                    {t('Balance: {balance}', { balance: formatCardBalance(card) })}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <Badge className="capitalize" variant={card.status === 'active' ? 'accent' : 'outline'}>{t(card.status)}</Badge>
                  <p className="mt-2 text-xs text-on-surface-variant">{t('Expires {date}', { date: new Date(card.expiresAt).toLocaleDateString(language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale) })}</p>
                  {card.catalog?.valueLabel ? <p className="mt-1 text-sm font-semibold text-on-surface">{card.catalog.valueLabel}</p> : null}
                </div>
              </div>
            ))}
          </div>
          <PaginationControls ariaLabel={t('Issued gift cards pagination')} {...issuedPagination} onPageChange={issuedPagination.setPage} />
        </section>
      ) : null}
    </div>
  )
}
