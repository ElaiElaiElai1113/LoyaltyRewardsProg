import { Link } from 'react-router'

import businessOwner from '@/assets/business/local-business-owner-wide.webp'
import hotelReward from '@/assets/business/hotel-partner.webp'
import checkoutMoment from '@/assets/landing/coffee-member-wide.webp'
import dinnerReward from '@/assets/landing/dinner-rewards.webp'
import salonReward from '@/assets/landing/salon-rewards.webp'
import { useTenant } from '@/hooks/use-tenant'

import './rewardme-home.css'

const memberSteps = [
  ['01', 'Join with no card required', 'Create your account with your name, email, and phone. Your first three months are free access while you explore the program.'],
  ['02', 'Spend with participating businesses', 'Show your member QR when you visit. Each active offer states its reward rate, availability, and restrictions before you spend.'],
  ['03', 'Use rewards or plan ahead', 'Redeem available rewards in the store, or keep building toward something larger when an approved savings option is available.'],
] as const

const rates = [
  ['Up to 10%', 'Free membership', 'Access to participating offers without a paid membership.'],
  ['20%+', 'Most partners', 'The expected starting point for many Regular and Gold member offers.'],
  ['Up to 100%', 'Selected off-peak offers', 'Limited offers with published eligibility, timing, and caps.'],
] as const

const plans = [
  ['Free', '$0', 'Explore the program and earn up to 10% back on eligible offers.'],
  ['Regular', '$25/month', 'Reference price. Manual activation unlocks eligible rates and referral benefits.'],
  ['Gold', '$100/year', 'Reference price. Full access is activated manually after review.'],
] as const

function LedgerMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 4h14a3 3 0 0 1 3 3v13a1 1 0 0 1-1.4.9L12 18l-6.6 2.9A1 1 0 0 1 4 20V4Z" />
      <path d="M8 8h8M8 11.5h8" />
    </svg>
  )
}

export function RewardMeHomePage() {
  const { program } = useTenant()
  const brand = program.name

  return (
    <main className="reference-rewardme" id="top" data-rewardme-editorial-home>
      <header className="reference-rewardme__header">
        <nav className="reference-rewardme__nav" aria-label={`${brand} navigation`}>
          <a className="reference-rewardme__logo" href="#top"><LedgerMark />{brand}</a>
          <div className="reference-rewardme__nav-links">
            <a href="#how">How it works</a>
            <a href="#store">The store</a>
            <a href="#membership">Membership</a>
            <Link to="/business">For businesses</Link>
          </div>
          <div className="reference-rewardme__nav-actions">
            <Link className="reference-rewardme__text-link" to="/signin">Sign in</Link>
            <Link className="reference-rewardme__button" to="/join">Start free access</Link>
          </div>
        </nav>
      </header>

      <section className="reference-rewardme__hero reference-rewardme__wrap">
        <div className="reference-rewardme__hero-copy">
          <p className="reference-rewardme__eyebrow">Three months free to join</p>
          <h1>Earn amazing rewards while supporting local businesses.</h1>
          <p className="reference-rewardme__hero-highlight">Discover eligible offers with <strong>20% to 100% back</strong> in rewards for activated Regular and Gold members.</p>
          <p className="reference-rewardme__lead">Earn rewards when you spend with participating local businesses, then use them for something great or keep building toward something bigger.</p>
          <ul className="reference-rewardme__hero-list">
            <li>Treat yourself to a night out</li>
            <li>Plan for a future trip or special purchase</li>
            <li>Support independent businesses in your community</li>
          </ul>
          <div className="reference-rewardme__actions">
            <Link className="reference-rewardme__button reference-rewardme__button--gold" to="/join">Start your free access</Link>
            <a className="reference-rewardme__button reference-rewardme__button--outline" href="#how">See how it works</a>
          </div>
          <p className="reference-rewardme__fine">Join with your name, email, and phone. No payment card is collected online.</p>
        </div>

        <div className="reference-rewardme__passbook" aria-label={`Example ${brand} account activity`}>
          <span className="reference-rewardme__stamp">Member account</span>
          <div className="reference-rewardme__passbook-title"><strong>My {brand} Account</strong><span>NO. 00482</span></div>
          <div className="reference-rewardme__entry"><span>Coffee run · eligible offer</span><strong>+ 20%</strong></div>
          <div className="reference-rewardme__entry"><span>Dinner out · off-peak offer</span><strong>+ 100%</strong></div>
          <div className="reference-rewardme__entry"><span>Weekend stay · eligible offer</span><strong>+ 20%</strong></div>
          <div className="reference-rewardme__entry"><span>Offer terms</span><strong>Published</strong></div>
          <div className="reference-rewardme__balance"><span>Example available rewards</span><strong>109</strong></div>
        </div>

        <figure className="reference-rewardme__wide-photo">
          <img src={checkoutMoment} alt="Member using a phone while paying at a local café" fetchPriority="high" />
        </figure>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="how">
        <div className="reference-rewardme__section-head">
          <p className="reference-rewardme__eyebrow">How it works</p>
          <h2>One account. Clear offers. Local rewards.</h2>
          <p>Every reward starts with a published partner offer and a verified purchase.</p>
        </div>
        <ol className="reference-rewardme__ledger-list">
          {memberSteps.map(([number, title, body]) => (
            <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="reference-rewardme__section reference-rewardme__section--deep" id="store">
        <div className="reference-rewardme__wrap reference-rewardme__split">
          <div>
            <p className="reference-rewardme__eyebrow">The reward store</p>
            <h2>Use rewards for experiences you’ll remember.</h2>
            <p>Browse active rewards from participating restaurants, hotels, salons, and local shops. Availability and redemption terms are shown before you choose.</p>
            <Link className="reference-rewardme__button reference-rewardme__button--outline" to="/shop">Explore participating businesses</Link>
          </div>
          <div className="reference-rewardme__photo-grid">
            <img src={dinnerReward} alt="Dinner reward from a participating restaurant" loading="lazy" />
            <img src={hotelReward} alt="Hotel reward from a participating property" loading="lazy" />
            <img src={salonReward} alt="Salon reward from a participating business" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="rewards">
        <div className="reference-rewardme__section-head">
          <p className="reference-rewardme__eyebrow">Reward rates</p>
          <h2>The offer tells you exactly what you can earn.</h2>
          <p>Rates vary by membership, partner, category, timing, and the active offer’s published limits.</p>
        </div>
        <div className="reference-rewardme__rate-grid">
          {rates.map(([value, label, body]) => <article key={label}><p>{label}</p><strong>{value}</strong><span>{body}</span></article>)}
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="savings">
        <div className="reference-rewardme__savings">
          <div><p className="reference-rewardme__eyebrow">Planned savings options</p><h2>Build toward something bigger.</h2><p>The savings concept remains gated until payout, custody, tax, and legal rules are approved. Current rewards stay subject to their published program terms.</p></div>
          <div className="reference-rewardme__planned"><span>Approval required</span><strong>Rewards → future goal</strong><p>No savings or double-payout promise is active today.</p></div>
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="membership">
        <div className="reference-rewardme__section-head"><p className="reference-rewardme__eyebrow">Membership</p><h2>Choose how you want to earn.</h2><p>Regular and Gold use reference pricing and are activated manually after review.</p></div>
        <div className="reference-rewardme__tiers">
          {plans.map(([name, price, body], index) => <article className={index === 1 ? 'is-featured' : ''} key={name}><span>{index === 1 ? 'Most popular' : 'Membership'}</span><h3>{name}</h3><strong>{price}</strong><p>{body}</p></article>)}
        </div>
        <Link className="reference-rewardme__button reference-rewardme__button--gold" to="/membership">Compare membership terms</Link>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="business">
        <div className="reference-rewardme__business-card">
          <div><p className="reference-rewardme__eyebrow">For local businesses</p><h2>Turn a clear reward offer into a reason to visit.</h2><p>Choose a participation model, publish the offer members will receive, and pay according to the signed commercial terms.</p><Link className="reference-rewardme__button reference-rewardme__button--gold" to="/business">See how partnership works</Link></div>
          <img src={businessOwner} alt="Local business owner ready to welcome rewards members" loading="lazy" />
        </div>
      </section>

      <footer className="reference-rewardme__footer">
        <div className="reference-rewardme__wrap reference-rewardme__footer-inner">
          <div><a className="reference-rewardme__logo" href="#top"><LedgerMark />{brand}</a><p>Earn where you already spend. Support local businesses.</p></div>
          <nav aria-label="Footer navigation"><a href="#how">How it works</a><Link to="/business">For businesses</Link><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><a href={`mailto:${program.supportEmail}`}>Contact</a></nav>
        </div>
      </footer>
    </main>
  )
}
