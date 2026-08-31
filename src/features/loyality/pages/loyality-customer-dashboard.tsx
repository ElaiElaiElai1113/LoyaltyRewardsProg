import { Check, Copy, Gift, LoaderCircle, QrCode, Repeat2, Sparkles, TicketCheck, UsersRound } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useAuth } from '@/hooks/use-auth'
import { useRewardBalance } from '@/hooks/use-customer-data'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency } from '@/lib/utils'
import {
  loyalityService,
  type LoyalityCustomerSnapshot,
  type LoyalityVoucher,
} from '@/features/loyality/loyality-service'

function voucherValue(voucher: LoyalityVoucher, currency: string, locale: string) {
  if (voucher.voucherKind === 'amount' && voucher.voucherValue !== null) {
    return formatCurrency(voucher.voucherValue, currency, locale)
  }
  if (voucher.voucherKind === 'discount' && voucher.voucherValue !== null) return `${voucher.voucherValue}% off`
  return 'Specific item'
}

export function LoyalityCustomerDashboard() {
  const { profile } = useAuth()
  const { program } = useTenant()
  const rewardBalance = useRewardBalance(profile?.id)
  const [snapshot, setSnapshot] = useState<LoyalityCustomerSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.id) return
    setIsLoading(true)
    setError(null)
    try {
      setSnapshot(await loyalityService.getCustomerSnapshot(profile.id))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Your Loyality wallet could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [profile?.id])

  useEffect(() => { void load() }, [load])

  const visitCount = snapshot?.visits[0]?.visitNumber ?? 0
  const activeVouchers = useMemo(() => snapshot?.vouchers.filter((voucher) => voucher.status === 'active') ?? [], [snapshot])
  const totalEntries = snapshot?.raffleEntries.reduce((sum, entry) => sum + entry.entryCount, 0) ?? 0
  const referralOffer = snapshot?.offers[0]
  const referralUrl = referralOffer && profile?.referralCode && typeof window !== 'undefined'
    ? `${window.location.origin}/offer/${referralOffer.publicToken}?ref=${encodeURIComponent(profile.referralCode)}&source=member-referral`
    : ''

  async function copyReferral() {
    if (!referralUrl) return
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success('Referral link copied.')
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function chooseVoucher(catalogId: string) {
    setBusyId(catalogId)
    try {
      await loyalityService.redeemCatalogVoucher(catalogId, crypto.randomUUID())
      toast.success('Voucher added to your wallet.')
      await Promise.all([load(), rewardBalance.refetch()])
    } catch (redeemError) {
      toast.error(redeemError instanceof Error ? redeemError.message : 'Voucher could not be created.')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <LoadingState title="Opening your Loyality wallet" description="Loading visits, offers, and vouchers." />
  if (error || !snapshot) return <EmptyState title="Wallet unavailable" description={error ?? 'Please try again.'} action={<Button onClick={() => void load()}>Try again</Button>} />

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-10">
      <section className="overflow-hidden rounded-[2rem] bg-[#1f3a2e] px-5 py-7 text-white shadow-xl sm:px-8 lg:grid lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-10 lg:py-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#d8b36a]">Your private loyalty loop</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">Welcome back, {profile?.fullName.split(' ')[0] ?? 'member'}.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Show your member QR when you visit. Your history, visit milestones, referral rewards, and raffle entries update automatically.</p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2 lg:mt-0">
          {[
            [String(visitCount), 'Visits', Repeat2],
            [String(activeVouchers.length), 'Vouchers', Gift],
            [String(totalEntries), 'Entries', TicketCheck],
          ].map(([value, label, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-white/15 bg-white/8 p-4 text-center">
              <Icon className="mx-auto size-5 text-[#b8862e]" />
              <strong className="mt-2 block text-2xl">{String(value)}</strong>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">{String(label)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <section className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b8862e]">Ready to use</p><h2 className="mt-1 text-3xl font-black tracking-[-.04em]">Your vouchers</h2></div>
            <span className="rounded-full bg-[#d8b36a]/25 px-4 py-2 text-xs font-black uppercase tracking-wider">{activeVouchers.length} active</span>
          </div>
          {activeVouchers.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {activeVouchers.map((voucher) => (
                <article key={voucher.id} className="grid gap-5 rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5 sm:grid-cols-[110px_1fr]">
                  <div className="grid aspect-square place-items-center rounded-2xl bg-white p-2">
                    <QRCodeSVG value={`${window.location.origin}/business/voucher/${voucher.publicToken}`} size={96} fgColor="#1f3a2e" level="H" />
                  </div>
                  <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8862e]">{voucher.sourceKind.replaceAll('_', ' ')}</p><h3 className="mt-1 text-xl font-black">{voucher.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{voucher.description}</p><strong className="mt-3 block text-sm">{voucherValue(voucher, program.currency, program.locale)}</strong></div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState className="mt-6" icon={<Gift className="size-7" />} title="No active vouchers yet" description="Claim an offer, reach a visit milestone, or exchange points for a specific voucher." />
          )}
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#b8862e]/12 text-[#b8862e]"><UsersRound /></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-[var(--muted-foreground)]">Referral loop</p><h2 className="text-2xl font-black">Bring a friend</h2></div></div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">Share this QR. When your friend claims and uses the welcome offer, your thank-you voucher appears here automatically.</p>
          {referralUrl ? <div className="mx-auto mt-6 grid w-fit place-items-center rounded-3xl bg-white p-5"><QRCodeSVG value={referralUrl} size={190} fgColor="#1f3a2e" level="H" /></div> : null}
          <Button className="mt-5 w-full rounded-full" variant="outline" onClick={() => void copyReferral()} disabled={!referralUrl}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy referral link'}</Button>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><Sparkles className="text-[#b8862e]" /><h2 className="text-2xl font-black">Choose a reward voucher</h2></div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Your balance is {rewardBalance.data?.points ?? 0} points. Points become one clear voucher—not an open cash balance.</p>
          <div className="mt-5 grid gap-3">
            {snapshot.catalog.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.description}</p><p className="mt-2 text-xs font-black uppercase tracking-wider text-[#b8862e]">{item.pointsCost} points</p></div>
                <Button className="shrink-0 rounded-full" onClick={() => void chooseVoucher(item.id)} disabled={busyId !== null || (rewardBalance.data?.points ?? 0) < item.pointsCost}>{busyId === item.id ? <LoaderCircle className="animate-spin" /> : <Gift />}Choose</Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><QrCode className="text-[#b8862e]" /><h2 className="text-2xl font-black">Visit progress</h2></div>
          <div className="mt-6 rounded-3xl bg-[#1f3a2e] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#d8b36a]">Current visit count</p><strong className="mt-2 block text-6xl tracking-[-.06em]">{visitCount}</strong>
            <p className="mt-3 text-sm text-white/70">Each successful staff-recorded member QR transaction counts as one visit.</p>
          </div>
          {snapshot.raffles.map((raffle) => {
            const entries = snapshot.raffleEntries.filter((entry) => entry.raffleId === raffle.id).reduce((sum, entry) => sum + entry.entryCount, 0)
            return <div key={raffle.id} className="mt-4 rounded-2xl border border-[var(--border)] p-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8862e]">Optional prize draw</p><h3 className="mt-1 font-black">{raffle.title}</h3><p className="mt-1 text-sm text-[var(--muted-foreground)]">{raffle.prizeDescription}</p><strong className="mt-3 block">{entries} {entries === 1 ? 'entry' : 'entries'}</strong></div>
          })}
        </section>
      </div>
    </div>
  )
}
