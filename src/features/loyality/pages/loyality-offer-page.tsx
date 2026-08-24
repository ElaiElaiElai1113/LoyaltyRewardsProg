import { ArrowRight, CheckCircle2, Gift, LoaderCircle, ScanLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useAuth } from '@/hooks/use-auth'
import { loyalityService, type LoyalityOffer, type LoyalityVoucher } from '@/features/loyality/loyality-service'

export function LoyalityOfferPage() {
  const { publicToken = '' } = useParams()
  const [search] = useSearchParams()
  const { profile } = useAuth()
  const [offer, setOffer] = useState<LoyalityOffer | null>(null)
  const [voucher, setVoucher] = useState<LoyalityVoucher | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    let active = true
    loyalityService.getPublicOffer(publicToken)
      .then((next) => { if (active) setOffer(next) })
      .catch(() => { if (active) setOffer(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [publicToken])

  const returnPath = `/offer/${encodeURIComponent(publicToken)}?${search.toString()}`

  async function claim() {
    setClaiming(true)
    try {
      const nextVoucher = await loyalityService.claimOffer(publicToken, search.get('ref'), search.get('source'))
      setVoucher(nextVoucher)
      toast.success('Offer claimed. Your voucher is ready.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The offer could not be claimed.')
    } finally { setClaiming(false) }
  }

  if (loading) return <LoadingState title="Opening offer" description="Checking this Loyality QR." />
  if (!offer) return <EmptyState title="Offer unavailable" description="This QR may be inactive or expired. Ask the business for its current offer." action={<Link to="/"><Button>Go to Loyality</Button></Link>} />

  return (
    <main className="min-h-screen bg-[#fff8ee] px-4 py-8 text-[#173b3f] sm:py-14">
      <div className="mx-auto max-w-3xl">
        <BrandLogo markClassName="h-11" textClassName="text-xl" />
        <section className="mt-8 overflow-hidden rounded-[2.25rem] border border-[#173b3f]/12 bg-white shadow-2xl">
          <div className="bg-[#173b3f] p-7 text-white sm:p-11"><p className="text-xs font-black uppercase tracking-[.22em] text-[#b9e769]">QR offer</p><h1 className="mt-4 text-5xl font-black tracking-[-.055em] sm:text-7xl">{offer.title}</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/72">{offer.description}</p></div>
          <div className="p-6 sm:p-10">
            <div className="flex gap-4 rounded-3xl bg-[#ff6b4a]/10 p-5"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ff6b4a] text-white"><Gift /></span><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#b8422b]">You receive</p><h2 className="mt-1 text-2xl font-black">{offer.rewardTitle}</h2><p className="mt-2 text-sm leading-6 text-[#173b3f]/68">{offer.rewardDescription}</p></div></div>
            {voucher ? (
              <div className="mt-6 rounded-3xl border border-[#69a23a]/25 bg-[#b9e769]/20 p-6 text-center"><CheckCircle2 className="mx-auto size-10 text-[#4c8222]" /><h2 className="mt-3 text-2xl font-black">Voucher added</h2><p className="mt-2 text-sm">Open your wallet and show the voucher QR at the business.</p><Link to="/dashboard"><Button className="mt-5 rounded-full bg-[#173b3f] text-white">Open my wallet <ArrowRight /></Button></Link></div>
            ) : profile?.role === 'customer' ? (
              <Button className="mt-6 h-14 w-full rounded-full bg-[#ff6b4a] text-base font-black text-white hover:bg-[#d94f32]" onClick={() => void claim()} disabled={claiming}>{claiming ? <LoaderCircle className="animate-spin" /> : <ScanLine />}Claim this offer</Button>
            ) : profile ? (
              <div className="mt-6 rounded-3xl border border-[#173b3f]/12 p-5 text-center"><p className="text-sm">This offer is for customer accounts. Sign out, then sign in as a customer.</p></div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link to={`/signin?redirect=${encodeURIComponent(returnPath)}`}><Button className="h-14 w-full rounded-full bg-[#173b3f] text-white">Sign in to claim</Button></Link><Link to={`/join?redirect=${encodeURIComponent(returnPath)}`}><Button variant="outline" className="h-14 w-full rounded-full">Create customer account</Button></Link></div>
            )}
            <p className="mt-6 text-center text-xs text-[#173b3f]/55">No app or physical card needed. This reward becomes one clear voucher for this business.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
