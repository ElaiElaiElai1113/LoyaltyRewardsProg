import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CheckCircle2, CreditCard, Gift, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'

interface EarnRedeemGateProps {
  children: ReactNode
  action: 'earn' | 'redeem'
}

export function EarnRedeemGate({ children, action }: EarnRedeemGateProps) {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { isActive, subscribe } = useMembership()
  const [open, setOpen] = useState(false)
  const isGuest = !profile

  if (isActive) return <>{children}</>

  return (
    <>
      <div
        onClickCapture={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[34rem]">
          <div className="border-b border-[var(--border)] warm-hero px-8 py-7">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-4">
                <Badge className="bg-white/12 text-white">
                  {t('Demo mode - no real charge')}
                </Badge>
                <DialogHeader className="mb-0 gap-3">
                  <DialogTitle className="text-3xl font-semibold leading-tight text-white">
                    {action === 'earn' ? t('Unlock points on this order') : t('Unlock reward redemption')}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-white/75">
                    {isGuest
                      ? t('Create an account or sign in first, then subscribe in demo mode to unlock this action.')
                      : t('Subscribe in demo mode to start earning and redeeming while keeping the catalog open to browse.')}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="hidden size-14 shrink-0 items-center justify-center rounded-xl bg-white/12 sm:flex">
                <Sparkles className="size-7" />
              </div>
            </div>
          </div>

          <div className="space-y-6 px-8 py-7">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-card p-4 text-card-foreground shadow-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Monthly')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(10)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-card p-4 text-card-foreground shadow-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Instant credit')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(10)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-card p-4 text-card-foreground shadow-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Payment')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{t('Mock')}</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-[var(--foreground)]" />
                <span>{t('Get $10 reward credit immediately after subscribing.')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Gift className="size-5 text-[var(--foreground)]" />
                <span>{t('Earn points at checkout and redeem rewards while active.')}</span>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-[var(--foreground)]" />
                <span>{t('Portfolio demo only: no card, processor, or real charge.')}</span>
              </div>
            </div>

            {isGuest ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                <strong className="text-[var(--foreground)]">{t('Account required.')}</strong>{' '}
                {t('Memberships are tied to your rewards balance, so guests must sign in or register before subscribing.')}
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-0 border-t border-[var(--border)] bg-[var(--muted)] px-8 py-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('Not now')}
            </Button>
            <Button
              type="button"
              className="px-6"
              disabled={!isGuest && subscribe.isPending}
              onClick={() => {
                if (isGuest) {
                  navigate('/signin')
                  return
                }

                void subscribe.mutateAsync().then(() => setOpen(false))
              }}
            >
              {isGuest
                ? t('Sign in or register')
                : subscribe.isPending
                  ? t('Subscribing...')
                  : t('Subscribe - Demo')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
