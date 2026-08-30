import { ArrowRight, Gift, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { loyalityService, type LoyalityCustomerSnapshot } from '@/features/loyality/loyality-service'
import { useAuth } from '@/hooks/use-auth'

export function LoyalityOffersListPage() {
  const { profile } = useAuth()
  const [snapshot, setSnapshot] = useState<LoyalityCustomerSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    loyalityService.getCustomerSnapshot(profile.id).then((next) => { if (active) setSnapshot(next) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [profile?.id])

  if (!profile?.id) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <EmptyState
          title="Offers are shared privately"
          description="Use the unique link or QR sent by the business. Sign in to see offers already connected to your customer account."
          action={(
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signin?redirect=%2Fpromotions"><Button>Sign in</Button></Link>
              <Link to="/join?redirect=%2Fpromotions"><Button variant="outline">Create customer account</Button></Link>
            </div>
          )}
        />
      </div>
    )
  }

  if (loading) return <LoadingState title="Loading offers" description="Checking this business’s active QR offers." />

  return <div className="mx-auto max-w-[1400px] space-y-6"><section className="rounded-[2rem] bg-[#173b3f] px-6 py-8 text-white sm:px-9"><p className="text-xs font-black uppercase tracking-[.2em] text-[#b9e769]">Customer offers</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">One QR can start your next reward.</h1><p className="mt-4 max-w-2xl text-white/70">Claim an active offer once, then show the voucher at this business. Your rewards are specific and easy to understand.</p></section>{snapshot?.offers.length ? <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{snapshot.offers.map((offer) => <article key={offer.id} className="rounded-[2rem] border border-[var(--border)] bg-card p-6 shadow-sm"><span className="grid size-12 place-items-center rounded-2xl bg-[#ff6b4a]/12 text-[#ff6b4a]"><QrCode /></span><h2 className="mt-5 text-2xl font-black">{offer.title}</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{offer.description}</p><div className="mt-5 rounded-2xl bg-[var(--muted)] p-4"><div className="flex items-center gap-2 text-sm font-black"><Gift className="size-4 text-[#ff6b4a]" />{offer.rewardTitle}</div><p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{offer.rewardDescription}</p></div><Link to={`/offer/${offer.publicToken}?source=member-offers`}><Button className="mt-5 w-full rounded-full">View and claim <ArrowRight /></Button></Link></article>)}</section> : <EmptyState title="No active offers" description="This business has not published a customer offer yet. Your visit rewards and vouchers remain available in Home." />}</div>
}
