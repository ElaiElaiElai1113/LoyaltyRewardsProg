import { ArrowRight, Check, Clock3, History, Info, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useManualMembership } from '@/hooks/use-manual-membership'
import { useMembership } from '@/hooks/use-membership'
import type { ManualMembershipEventType, ManualMembershipTier } from '@/types/domain'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    details: ['Earn up to 10% back', 'No referral bonuses', 'Eligible retroactive bonuses may apply after upgrading'],
    featured: false,
  },
  {
    name: 'Regular',
    price: '$25/month',
    details: ['Earn 20%–100% back', '$10 for each qualifying referral', 'Full member access after manual activation'],
    featured: true,
  },
  {
    name: 'Gold',
    price: '$100/year',
    details: ['Full member access after manual activation', 'Regular referrals: $25 per month for three months', 'Gold referrals: $100 in Rewards'],
    featured: false,
  },
] as const

const eventLabels: Record<ManualMembershipEventType, string> = {
  requested: 'Request submitted',
  request_canceled: 'Request canceled',
  approved: 'Request approved',
  rejected: 'Request declined',
  membership_renewed: 'Membership renewed',
  membership_canceled: 'Membership canceled',
}

function readableDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export function RewardMeMembershipPage() {
  const { profile } = useAuth()
  const { membership, isActive, isLoading: membershipLoading } = useMembership()
  const manual = useManualMembership()
  const [tier, setTier] = useState<ManualMembershipTier>('regular')
  const [note, setNote] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const pendingRequest = manual.requests.data?.find((request) => request.status === 'pending')
  const hasLoadError = manual.requests.isError || manual.events.isError
  const isLoading = Boolean(profile) && (membershipLoading || manual.requests.isLoading || manual.events.isLoading)

  async function submitMembershipRequest() {
    try {
      await manual.requestMembership.mutateAsync({ tier, note })
      setNote('')
    } catch {
      // The mutation hook presents the actionable error.
    }
  }

  async function submitCancellationRequest() {
    if (cancellationReason.trim().length < 3) return
    try {
      await manual.requestCancellation.mutateAsync(cancellationReason)
      setCancellationReason('')
    } catch {
      // The mutation hook presents the actionable error.
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 text-[var(--foreground)]">
      <header className="rounded-3xl border border-[#d7ccb2] bg-[#f4efdf] px-5 py-9 sm:px-9 lg:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77b1f]">RewardMe membership</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#173f32] sm:text-5xl">Choose how you want to earn.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5f655d]">
          Start with three-month free access to explore RewardMe. Rewards and referral bonuses begin only after the RewardMe team activates an eligible Regular or Gold membership.
        </p>
      </header>

      <aside className="flex items-start gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p><strong>Manual enrollment:</strong> RewardMe does not collect online payments or card details. Regular and Gold prices are reference terms from the pitch; access requests are reviewed and activated by the RewardMe team.</p>
      </aside>

      <section className="grid overflow-hidden rounded-3xl border border-[#d7ccb2] bg-[#faf7ec] lg:grid-cols-3" aria-label="RewardMe membership plans">
        {tiers.map((item) => (
          <article className={`p-7 sm:p-9 ${item.featured ? 'bg-[#173f32] text-[#faf7ec]' : ''}`} key={item.name}>
            <h2 className="font-serif text-2xl">{item.name}</h2>
            <p className={`mt-3 text-3xl font-bold ${item.featured ? 'text-[#e0ae4b]' : 'text-[#b77b1f]'}`}>{item.price}</p>
            {item.name !== 'Free' ? <p className={`mt-1 text-xs font-bold uppercase tracking-[0.12em] ${item.featured ? 'text-[#d8dccf]' : 'text-[#5f655d]'}`}>Reference price · manual activation</p> : null}
            <ul className={`mt-6 space-y-3 text-sm leading-6 ${item.featured ? 'text-[#d8dccf]' : 'text-[#5f655d]'}`}>
              {item.details.map((detail) => <li className="flex gap-2" key={detail}><Check className="mt-1 size-4 shrink-0 text-[#b77b1f]" aria-hidden="true" />{detail}</li>)}
            </ul>
          </article>
        ))}
      </section>

      {!profile ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#173f32] px-5 py-3 text-sm font-bold text-[#faf7ec]" to="/join">Start free access <ArrowRight className="size-4" /></Link>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#173f32] px-5 py-3 text-sm font-bold text-[#173f32]" to="/invitation?interest=membership">Request Regular or Gold access</Link>
        </div>
      ) : (
        <section className="rounded-3xl border border-[#d7ccb2] bg-card p-5 shadow-soft sm:p-8" aria-labelledby="membership-account-title" data-membership-request-panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b77b1f]">Your account</p>
              <h2 id="membership-account-title" className="mt-2 font-serif text-3xl text-[#173f32]">Membership status</h2>
            </div>
            <Badge variant="outline" className="w-fit capitalize">{isActive ? `${membership?.tier ?? 'regular'} active` : pendingRequest ? 'Review pending' : 'Free access'}</Badge>
          </div>

          {isLoading ? (
            <div className="mt-6 flex min-h-32 items-center justify-center gap-2 text-sm text-on-surface-variant"><Loader2 className="size-5 animate-spin" />Loading membership details…</div>
          ) : hasLoadError ? (
            <div className="mt-6 rounded-2xl border border-error/25 bg-error/5 p-4">
              <p className="font-semibold">Membership details could not be loaded.</p>
              <p className="mt-1 text-sm text-on-surface-variant">Your account is unchanged. Retry the secure connection.</p>
              <Button className="mt-4" variant="outline" onClick={() => { void manual.requests.refetch(); void manual.events.refetch() }}>Retry</Button>
            </div>
          ) : pendingRequest ? (
            <div className="mt-6 grid gap-5 rounded-2xl border border-amber-600/25 bg-amber-50 p-5 text-amber-950 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2 font-bold"><Clock3 className="size-5" />Review pending</div>
                <p className="mt-2 text-sm leading-6">Your {pendingRequest.requestedTier} {pendingRequest.requestKind} request was received on {readableDate(pendingRequest.requestedAt)}. Operations will review it; no card details are needed.</p>
                {pendingRequest.memberNote ? <p className="mt-2 text-sm"><strong>Your note:</strong> {pendingRequest.memberNote}</p> : null}
              </div>
              <Button
                variant="outline"
                className="w-full border-amber-900/30 bg-transparent md:w-auto"
                disabled={manual.cancelPendingRequest.isPending}
                onClick={() => void manual.cancelPendingRequest.mutateAsync({ requestId: pendingRequest.id, reason: 'Canceled by member' }).catch(() => undefined)}
              >
                {manual.cancelPendingRequest.isPending ? 'Canceling…' : 'Cancel pending request'}
              </Button>
            </div>
          ) : isActive ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#173f32] p-5 text-[#faf7ec]">
                <div className="flex items-center gap-2 font-bold"><ShieldCheck className="size-5 text-[#e0ae4b]" />Active {membership?.tier ?? 'regular'} membership</div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-[#d8dccf]">Activated</dt><dd className="mt-1 font-semibold">{readableDate(membership?.currentPeriodStart)}</dd></div>
                  <div><dt className="text-[#d8dccf]">Current term ends</dt><dd className="mt-1 font-semibold">{readableDate(membership?.currentPeriodEnd)}</dd></div>
                </dl>
              </div>
              <div>
                <label className="text-sm font-bold text-[#173f32]" htmlFor="membership-cancellation-reason">Request cancellation</label>
                <Textarea id="membership-cancellation-reason" className="mt-2" maxLength={1000} placeholder="Tell the team why you want to cancel" value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} />
                <Button className="mt-3 w-full sm:w-auto" variant="outline" disabled={cancellationReason.trim().length < 3 || manual.requestCancellation.isPending} onClick={() => void submitCancellationRequest()}>{manual.requestCancellation.isPending ? 'Sending…' : 'Send cancellation request'}</Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
              <div>
                <p className="text-sm font-bold text-[#173f32]">Choose the plan to request</p>
                <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Requested membership tier">
                  {(['regular', 'gold'] as const).map((value) => (
                    <button key={value} type="button" role="radio" aria-checked={tier === value} className={`min-h-20 rounded-2xl border p-4 text-left capitalize transition ${tier === value ? 'border-[#173f32] bg-[#173f32] text-white' : 'border-[#d7ccb2] bg-[#faf7ec] text-[#173f32]'}`} onClick={() => setTier(value)}>
                      <span className="font-serif text-xl">{value}</span><span className="mt-1 block text-xs">{value === 'gold' ? '$100/year reference' : '$25/month reference'}</span>
                    </button>
                  ))}
                </div>
                <label className="mt-5 block text-sm font-bold text-[#173f32]" htmlFor="membership-request-note">Optional note</label>
                <Textarea id="membership-request-note" className="mt-2" maxLength={1000} placeholder="Questions or details for the RewardMe team" value={note} onChange={(event) => setNote(event.target.value)} />
                <Button className="mt-4 w-full bg-[#173f32] text-white sm:w-auto" disabled={manual.requestMembership.isPending} onClick={() => void submitMembershipRequest()}>{manual.requestMembership.isPending ? 'Sending request…' : `Request ${tier} access`}</Button>
              </div>
              <aside className="rounded-2xl border border-[#d7ccb2] bg-[#faf7ec] p-5 text-sm leading-6 text-[#5f655d]">
                <p className="font-bold text-[#173f32]">Before you send</p>
                <p className="mt-2">Your profile needs a full name, email, and WhatsApp or phone. The RewardMe team reviews the request and confirms terms separately.</p>
                <Link className="mt-4 inline-flex font-bold text-[#173f32] underline underline-offset-4" to="/profile">Review profile details</Link>
              </aside>
            </div>
          )}

          {!isLoading && !hasLoadError && (manual.events.data?.length ?? 0) > 0 ? (
            <div className="mt-8 border-t border-[#d7ccb2] pt-6">
              <h3 className="flex items-center gap-2 font-serif text-2xl text-[#173f32]"><History className="size-5" />Status history</h3>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {manual.events.data?.slice(0, 6).map((event) => (
                  <li className="rounded-xl border border-[#d7ccb2] bg-[#faf7ec] p-4 text-sm" key={event.id}>
                    <div className="flex items-start justify-between gap-3"><span className="font-bold text-[#173f32]">{eventLabels[event.eventType]}</span><span className="shrink-0 text-xs text-[#5f655d]">{readableDate(event.createdAt)}</span></div>
                    <p className="mt-1 capitalize text-[#5f655d]">{event.tier} · {event.toStatus}</p>
                    {event.reason ? <p className="mt-2 text-[#5f655d]">{event.reason}</p> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}
