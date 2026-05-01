import { CreditCard, RefreshCw, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatCurrency, formatDate } from '@/lib/utils'

export function MembershipPage() {
  const { t } = useLanguage()
  const { membership, isActive, isLoading, subscribe, renew, cancel } = useMembership()
  const hasMembership = Boolean(membership)
  const isFrozen = hasMembership && !isActive

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      <div className="space-y-4 border-b border-border pb-8">
        <Badge>{t('Mock Membership')}</Badge>
        <h1 className="font-display text-5xl font-semibold tracking-[-0.03em] text-foreground">{t('Monthly Membership')}</h1>
        <div className="h-px w-24 bg-[var(--accent-gold)]" aria-hidden="true" />
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {t('Portfolio demo billing: buttons call Supabase RPCs directly and never process a real payment.')}
        </p>
      </div>

      <section className="rounded-2xl border border-border border-t-2 border-t-[var(--accent-gold)] bg-card p-6 shadow-card">
        <div className="grid gap-8 md:grid-cols-[1fr_260px] md:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
                <ShieldCheck className="size-5 text-[var(--accent-gold)]" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-semibold italic text-foreground">{t('$10/mo flat')}</h2>
                <p className="text-sm text-muted-foreground">{t('Get $10 credit instantly + earn rewards.')}</p>
              </div>
            </div>

            {isActive && membership ? (
              <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">{t('Active.')}</strong>{' '}
                {t('Your current renewal date is')} {formatDate(membership.currentPeriodEnd)}.
              </div>
            ) : isFrozen ? (
              <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">{t('Frozen')}</strong>{' '}
                {t('your balance is safe. Resubscribe to start earning again.')}
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">
                {t('Subscribe in demo mode to unlock earning and redemption actions.')}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('Monthly price')}</p>
                <p className="font-display mt-2 text-3xl font-semibold tabular-nums">{formatCurrency((membership?.priceCents ?? 1000) / 100)}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('Instant credit')}</p>
                <p className="font-display mt-2 text-3xl font-semibold tabular-nums">{formatCurrency(10)}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('Provider')}</p>
                <p className="font-display mt-2 text-3xl font-semibold italic">{membership?.provider ?? 'mock'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted p-5">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold text-foreground tabular-nums">$10</span>
              <span className="text-sm font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t('Demo mode — no real charge.')}
            </p>

            <div className="mt-6 grid gap-3">
              {isActive ? (
                <>
                  <Button type="button" disabled={renew.isPending || isLoading} onClick={() => renew.mutate()}>
                    <RefreshCw className="size-4" />
                    {renew.isPending ? t('Renewing...') : t('Renew now — Demo')}
                  </Button>
                  <Button type="button" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
                    {cancel.isPending ? t('Canceling...') : t('Cancel')}
                  </Button>
                </>
              ) : (
                <Button type="button" disabled={subscribe.isPending || isLoading} onClick={() => subscribe.mutate()}>
                  <CreditCard className="size-4" />
                  {subscribe.isPending
                    ? t('Subscribing...')
                    : isFrozen
                      ? t('Resubscribe — Demo')
                      : t('Subscribe — Demo')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
