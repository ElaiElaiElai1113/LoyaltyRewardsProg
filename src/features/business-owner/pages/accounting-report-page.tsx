import { useQuery } from '@tanstack/react-query'
import { Calculator, CircleDollarSign, Download, Landmark, ReceiptText, Scale, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { COMPACT_LIST_PAGE_SIZE, usePagination } from '@/hooks/use-pagination'
import { useTenant } from '@/hooks/use-tenant'
import { useBusinessGiftCards } from '@/features/gift-cards/hooks/use-gift-cards'
import { businessAccountingService, type BusinessAccountingRow } from '@/integrations/supabase/services/business-accounting-service'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import { useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'
import { escapeAccountingCsvCell, summarizeBusinessAccounting } from '../business-accounting-report'

function downloadCsv(filename: string, rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csv = [
    headers.map(escapeAccountingCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeAccountingCsvCell(row[header])).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

function fundingLabel(row: BusinessAccountingRow) {
  switch (row.fundingSource) {
    case 'program_points': return 'Claimed with member points'
    case 'program_grant': return 'Issued by the platform'
    case 'business_issued': return 'Issued by this business'
    default: return 'Funding review required'
  }
}

function reimbursementLabel(row: BusinessAccountingRow) {
  switch (row.reimbursementStatus) {
    case 'estimated': return 'Review required'
    case 'not_applicable': return 'No Synergize Credit transfer'
    default: return 'Review funding source'
  }
}

export function AccountingReportPage() {
  const { business } = useBusinessOwnerData()
  const { program } = useTenant()
  const { language, t } = useLanguage()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate)
  const cards = useBusinessGiftCards(business?.id)
  const report = useQuery({
    queryKey: ['business-accounting-report', business?.id, fromDate, toDate],
    queryFn: () => businessAccountingService.getReport(business!.id, {
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    enabled: Boolean(business?.id) && !rangeInvalid,
    retry: false,
  })
  const rows = useMemo(() => report.data ?? [], [report.data])
  const pagination = usePagination(rows, COMPACT_LIST_PAGE_SIZE, `${fromDate}:${toDate}`)
  const summary = useMemo(
    () => summarizeBusinessAccounting(rows, cards.data ?? []),
    [cards.data, rows],
  )
  const locale = language === 'es' ? 'es-ES' : language === 'tl' ? 'fil-PH' : program.locale
  const currency = business?.currency ?? program.currency
  const money = (value: number) => formatTenantCurrency(value, { currency, locale })
  const dateTime = (value: string) => new Date(value).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  function exportReport() {
    if (!business) return
    const safeBusinessName = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business'
    const suffix = fromDate || toDate ? `${fromDate || 'start'}-to-${toDate || 'today'}` : 'all-time'

    downloadCsv(`${safeBusinessName}-accounting-${suffix}.csv`, rows.map((row) => ({
      [t('Date')]: dateTime(row.redeemedAt),
      [t('Receipt')]: row.receiptNumber,
      [t('Customer')]: row.customerName,
      [t('Gift Card')]: row.giftCardCode,
      [t('Full sale')]: row.saleTotal.toFixed(2),
      [t('Credit applied')]: row.giftCardApplied.toFixed(2),
      [t('Other payment due')]: row.otherPaymentDue.toFixed(2),
      [t('Card balance before')]: row.balanceBefore.toFixed(2),
      [t('Card balance after')]: row.balanceAfter.toFixed(2),
      [t('Funding source')]: t(fundingLabel(row)),
      [t('Synergize Credits received')]: row.reimbursementEstimate.toFixed(2),
      [t('Credit transfer status')]: t(reimbursementLabel(row)),
      [t('Commission tracked')]: row.commissionAmount.toFixed(2),
      [t('Transaction ID')]: row.transactionId,
      [t('Event ID')]: row.eventId,
    })))
  }

  const metrics = [
    { label: 'Full sales recorded', value: money(summary.grossSales), detail: t('{count} credit transactions', { count: rows.length }), icon: ReceiptText },
    { label: 'Gift-card credit applied', value: money(summary.giftCardApplied), detail: t('{count} full-credit · {split} split-payment', { count: summary.fullCreditSales, split: summary.splitPaymentSales }), icon: WalletCards },
    { label: 'Other payment due', value: money(summary.otherPaymentsDue), detail: t('Paid separately by cash, card, or the business POS.'), icon: Calculator },
    { label: 'Synergize Credits received', value: money(summary.estimatedReimbursement), detail: t('Gift-card use does not transfer Synergize Credits into the business account.'), icon: Landmark },
    { label: 'Outstanding card balance', value: money(summary.outstandingCardBalance), detail: t('Active cards that can still be used on future visits.'), icon: CircleDollarSign },
    { label: 'Commission tracked', value: money(summary.commissionTracked), detail: t('Tracked separately and not automatically deducted from reimbursement.'), icon: Scale },
  ] as const

  return (
    <div className="min-w-0 space-y-8" data-testid="business-accounting-report">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="accent" className="w-fit">{t('Accounting')}</Badge>
          <h1 className="mt-3 break-words font-serif text-4xl tracking-tight text-primary sm:text-5xl">{t('Sales and gift-card report')}</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            {t('Track the full bill, gift-card payment, customer balance due, and remaining card balance.')}
          </p>
        </div>
        <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={rows.length === 0} onClick={exportReport}>
          <Download className="size-4" />
          {t('Export CSV')}
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('Report period')}</CardTitle>
          <CardDescription>{t('Leave both dates blank to see all recorded credit transactions.')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <div className="grid gap-2">
            <Label htmlFor="accounting-from-date">{t('From date')}</Label>
            <Input id="accounting-from-date" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accounting-to-date">{t('To date')}</Label>
            <Input id="accounting-to-date" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} />
          </div>
          {rangeInvalid ? (
            <p className="text-sm font-semibold text-error sm:col-span-2" role="alert">{t('The start date must be before the end date.')}</p>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={t('Accounting summary')}>
        {metrics.map((metric) => (
          <Card key={metric.label} className="min-w-0">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/65">{t(metric.label)}</p>
                  <p className="mt-3 break-words font-serif text-3xl text-primary">{metric.value}</p>
                </div>
                <span className="rounded-xl bg-primary/10 p-2 text-primary"><metric.icon className="size-5" /></span>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant/75">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-warning/25 bg-warning/5">
        <CardContent className="p-5 text-sm text-on-surface-variant">
          <strong className="text-primary">{t('Important:')}</strong>{' '}
          {t('Gift cards are store credit issued and honored by the listed business. Using one does not transfer Synergize Credits. Cash commission is tracked separately.')}
          {summary.reviewRequired > 0 ? ` ${t('{count} transactions need a funding review.', { count: summary.reviewRequired })}` : ''}
        </CardContent>
      </Card>

      <section className="space-y-4" data-pagination-scope>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="w-fit">{t('Ledger')}</Badge>
            <h2 className="mt-3 font-serif text-3xl text-primary">{t('Credit transactions')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant/75">{t('Each row keeps the original sale separate from the credit used to pay it.')}</p>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant/70">{t('{count} transactions', { count: rows.length })}</p>
        </div>

        {report.isLoading || cards.isLoading ? (
          <Card><CardContent className="p-6 text-sm text-on-surface-variant">{t('Loading accounting report...')}</CardContent></Card>
        ) : report.isError ? (
          <EmptyState
            icon={<Calculator className="size-8" />}
            title={t('Accounting report could not be loaded')}
            description={t('Refresh the page. If the problem continues, contact the platform administrator.')}
            action={<Button type="button" variant="outline" onClick={() => void report.refetch()}>{t('Try again')}</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="size-8" />}
            title={t('No credit transactions in this period')}
            description={t('Gift-card payments will appear here after a business completes a sale.')}
          />
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="divide-y divide-outline-variant/15 p-0">
              {pagination.pageItems.map((row) => (
                <article key={row.eventId} className="grid min-w-0 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(7.5rem,0.8fr))_minmax(0,1.15fr)] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{row.receiptNumber ?? t('No receipt')}</Badge>
                      <Badge variant={row.reimbursementStatus === 'estimated' ? 'accent' : row.reimbursementStatus === 'review_required' ? 'secondary' : 'outline'}>
                        {t(reimbursementLabel(row))}
                      </Badge>
                    </div>
                    <p className="mt-3 truncate font-semibold text-primary" title={row.customerName}>{row.customerName}</p>
                    <p className="mt-1 break-all font-mono text-xs text-on-surface-variant/70">{row.giftCardCode}</p>
                    <p className="mt-1 text-xs text-on-surface-variant/70">{dateTime(row.redeemedAt)}</p>
                  </div>

                  {[
                    ['Full sale', money(row.saleTotal)],
                    ['Credit applied', money(row.giftCardApplied)],
                    ['Other payment due', money(row.otherPaymentDue)],
                    ['Card balance after', money(row.balanceAfter)],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-xl bg-surface-low p-3 xl:bg-transparent xl:p-0">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/60">{t(label)}</p>
                      <p className="mt-1 break-words font-semibold text-on-surface">{value}</p>
                    </div>
                  ))}

                  <div className="min-w-0 rounded-xl border border-outline-variant/15 bg-surface-low p-3">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/60">{t('Issuance and credit treatment')}</p>
                    <p className="mt-1 font-semibold text-on-surface">{t(fundingLabel(row))}</p>
                    <p className={cn('mt-1 text-sm font-semibold', row.reimbursementStatus === 'review_required' ? 'text-warning' : 'text-primary')}>
                      {money(row.reimbursementEstimate)}
                    </p>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        )}

        <PaginationControls
          ariaLabel={t('Accounting transactions pagination')}
          {...pagination}
          onPageChange={pagination.setPage}
        />
      </section>
    </div>
  )
}
