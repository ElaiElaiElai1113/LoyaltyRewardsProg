import { Gift, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function PromoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const referrerId = searchParams.get('ref')
  const businessId = searchParams.get('business')
  const hasReferral = Boolean(referrerId)

  useEffect(() => {
    if (!referrerId) return

    sessionStorage.setItem('referralCode', referrerId)
    if (businessId) {
      sessionStorage.setItem('referralBusinessId', businessId)
    }
  }, [businessId, referrerId])

  return (
    <main className="min-h-screen bg-surface px-4 py-8 md:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[2.5rem] bg-primary px-8 py-12 text-white shadow-card md:px-14 md:py-16">
        <div className="flex items-center justify-between gap-4">
          <div />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-6" />
          </div>
        </div>

        <div className="grid gap-12 py-16 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-secondary-container">
              <Gift className="size-4" />
              {hasReferral ? 'Referral invitation' : 'Loyalty invitation'}
            </div>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight md:text-8xl">
              {hasReferral ? 'Your friend saved you a reward credit.' : 'Join our loyalty program.'}
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/85 md:text-xl">
              {hasReferral
                ? 'Create your rewards account and, after the referral is approved, both you and your friend get a reward credit.'
                : 'Create your rewards account to earn points, track credits, and redeem rewards.'}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6">
            <p className="font-serif text-3xl leading-tight">
              {hasReferral ? 'Two reward credits, one invitation.' : 'Rewards start here.'}
            </p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white/75">
              {hasReferral
                ? 'Your credit appears after your signup is reviewed.'
                : 'Sign up once and keep every visit connected to your rewards balance.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-white/70">
            {hasReferral ? 'Ready to claim the invitation?' : 'Ready to start earning?'}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="rounded-full"
            onClick={() => {
              if (!referrerId) {
                navigate('/promo/register')
                return
              }

              const params = new URLSearchParams({ ref: referrerId })
              if (businessId) {
                params.set('business', businessId)
              }
              navigate(`/promo/register?${params.toString()}`)
            }}
          >
            {hasReferral ? 'Claim your reward - Create Account' : 'Create Account'}
          </Button>
        </div>
      </section>
    </main>
  )
}
