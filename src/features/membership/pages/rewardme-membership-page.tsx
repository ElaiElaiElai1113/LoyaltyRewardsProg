import { ArrowRight, Check, Info } from 'lucide-react'
import { Link } from 'react-router'

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
    details: ['Earn 20%–100% back', '$10 for each qualifying referral', 'Full paid-member access'],
    featured: true,
  },
  {
    name: 'Gold',
    price: '$100/year',
    details: ['Full paid-member access', 'Regular referrals: $25 per month for three months', 'Gold referrals: $100 in Rewards'],
    featured: false,
  },
] as const

export function RewardMeMembershipPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 text-[var(--foreground)]">
      <header className="rounded-3xl border border-[#d7ccb2] bg-[#f4efdf] px-5 py-9 sm:px-9 lg:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77b1f]">RewardMe membership</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#173f32] sm:text-5xl">Choose how you want to earn.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5f655d]">
          Start with three-month free access to explore RewardMe. Rewards and referral bonuses begin only after you become a paid member.
        </p>
      </header>

      <aside className="flex items-start gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p><strong>Demo billing:</strong> No real payment is processed here. To avoid a false confirmation, plan selection is informational until live billing is connected.</p>
      </aside>

      <section className="grid overflow-hidden rounded-3xl border border-[#d7ccb2] bg-[#faf7ec] lg:grid-cols-3" aria-label="RewardMe membership plans">
        {tiers.map((tier) => (
          <article className={`p-7 sm:p-9 ${tier.featured ? 'bg-[#173f32] text-[#faf7ec]' : ''}`} key={tier.name}>
            <h2 className="font-serif text-2xl">{tier.name}</h2>
            <p className={`mt-3 text-3xl font-bold ${tier.featured ? 'text-[#e0ae4b]' : 'text-[#b77b1f]'}`}>{tier.price}</p>
            <ul className={`mt-6 space-y-3 text-sm leading-6 ${tier.featured ? 'text-[#d8dccf]' : 'text-[#5f655d]'}`}>
              {tier.details.map((detail) => <li className="flex gap-2" key={detail}><Check className="mt-1 size-4 shrink-0 text-[#b77b1f]" aria-hidden="true" />{detail}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#173f32] px-5 py-3 text-sm font-bold text-[#faf7ec]" to="/join">Start free access <ArrowRight className="size-4" /></Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#173f32] px-5 py-3 text-sm font-bold text-[#173f32]" to="/shop">Browse current offers</Link>
      </div>
    </div>
  )
}
