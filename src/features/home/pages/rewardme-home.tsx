import { ArrowRight, Bookmark, Check, LockKeyhole, Store } from 'lucide-react'
import { Link } from 'react-router'

import coffeeMember from '@/assets/landing/coffee-member-wide.webp'
import coffeeMemberSmall from '@/assets/landing/coffee-member-wide-768.webp'
import dinnerRewards from '@/assets/landing/dinner-rewards.webp'

import './rewardme-home.css'

const steps = [
  {
    number: '01',
    title: 'Join with three-month free access',
    body: 'Create an account with your email, phone number, and password. No card is collected during signup.',
  },
  {
    number: '02',
    title: 'Request a membership',
    body: 'After the trial, request Regular or Gold access. The RewardMe team reviews and manually activates eligible memberships.',
  },
  {
    number: '03',
    title: 'Redeem, or save it',
    body: 'Use earned Rewards on available store offers. A longer-term savings feature is planned, but is not live yet.',
  },
] as const

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Earn up to 10% back. Referral bonuses are not included. Eligible retroactive bonuses may apply after an upgrade.',
    featured: false,
  },
  {
    name: 'Regular',
    price: '$25/month',
    description: 'Earn 20%–100% back, receive the full member store experience, and get $10 for each qualifying referral after manual activation.',
    featured: true,
  },
  {
    name: 'Gold',
    price: '$100/year',
    description: 'Full access plus the Gold referral schedule: three monthly rewards for Regular referrals or a $100 reward for Gold referrals.',
    featured: false,
  },
] as const

export function RewardMeHomePage() {
  return (
    <div className="rewardme-home">
      <header className="rewardme-home__header">
        <Link className="rewardme-home__brand" to="/" aria-label="RewardMe home">
          <Bookmark aria-hidden="true" />
          <span>RewardMe</span>
        </Link>
        <nav className="rewardme-home__nav" aria-label="RewardMe navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/shop">The store</Link>
          <a href="#savings">Savings plan</a>
          <Link to="/business">For businesses</Link>
        </nav>
        <div className="rewardme-home__header-actions">
          <Link className="rewardme-home__text-link" to="/signin">Sign in</Link>
          <Link className="rewardme-home__button rewardme-home__button--small" to="/join">Start free access</Link>
        </div>
      </header>

      <main>
        <section className="rewardme-home__hero" aria-labelledby="rewardme-hero-title">
          <div className="rewardme-home__hero-copy">
            <p className="rewardme-home__eyebrow">3 MONTHS FREE TO EXPLORE</p>
            <h1 id="rewardme-hero-title">Turn what you already spend into what you're saving for.</h1>
            <p className="rewardme-home__lead">
              RewardMe connects everyday spending with meaningful member rewards from participating local businesses.
            </p>
            <div className="rewardme-home__actions">
              <Link className="rewardme-home__button" to="/join">Start your free access</Link>
              <a className="rewardme-home__button rewardme-home__button--outline" href="#how-it-works">See how it works</a>
            </div>
            <p className="rewardme-home__fine-print">
              Three-month free access. No payment card is required to create an account. No rewards or referral bonuses are paid during the trial.
            </p>
          </div>

          <aside className="rewardme-home__ledger" aria-label="Illustrative RewardMe account activity">
            <div className="rewardme-home__ledger-head">
              <strong>My RewardMe Account</strong>
              <span>ILLUSTRATION</span>
            </div>
            <div className="rewardme-home__ledger-row"><span>Coffee run · 20% back</span><strong>+ $1</strong></div>
            <div className="rewardme-home__ledger-row"><span>Dinner out · 10% off-peak</span><strong>+ $6</strong></div>
            <div className="rewardme-home__ledger-row"><span>Weekend stay · 20% back</span><strong>+ $48</strong></div>
            <div className="rewardme-home__ledger-row"><span>Moved to savings plan</span><strong><LockKeyhole aria-hidden="true" /> planned</strong></div>
            <div className="rewardme-home__ledger-total"><span>AVAILABLE TO REDEEM</span><strong>$109</strong></div>
            <p>Example active-member activity only. Actual offers, rates, and availability vary by participating business.</p>
          </aside>
        </section>

        <figure className="rewardme-home__feature-image">
          <picture>
            <source media="(max-width: 720px)" srcSet={coffeeMemberSmall} />
            <img src={coffeeMember} alt="A customer checking a mobile rewards account in a local café" decoding="async" fetchPriority="high" />
          </picture>
          <figcaption>Earn where you already shop, eat, and stay.</figcaption>
        </figure>

        <section className="rewardme-home__section" id="how-it-works" aria-labelledby="rewardme-how-title">
          <p className="rewardme-home__eyebrow">HOW IT WORKS</p>
          <div className="rewardme-home__section-heading">
            <h2 id="rewardme-how-title">Three steps. That's the whole system.</h2>
            <p>The trial lets you explore the program first. Paid-member earning begins only after conversion.</p>
          </div>
          <ol className="rewardme-home__steps">
            {steps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rewardme-home__section rewardme-home__store" aria-labelledby="rewardme-store-title">
          <div>
            <p className="rewardme-home__eyebrow">THE STORE</p>
            <h2 id="rewardme-store-title">Rewards are credit you can use on available partner offers.</h2>
            <p>Browse the live catalog, then sign in to redeem eligible items. Inventory and offer terms are set by participating businesses.</p>
            <div className="rewardme-home__actions">
              <Link className="rewardme-home__button" to="/shop"><Store aria-hidden="true" /> Browse the store</Link>
              <Link className="rewardme-home__button rewardme-home__button--outline" to="/signin">Sign in</Link>
            </div>
          </div>
          <img src={dinnerRewards} alt="A table set for a local dining reward" loading="lazy" decoding="async" />
        </section>

        <section className="rewardme-home__section" aria-labelledby="rewardme-rates-title">
          <p className="rewardme-home__eyebrow">REWARD RATES</p>
          <div className="rewardme-home__section-heading">
            <h2 id="rewardme-rates-title">Most places, 20% or more back. Some days, all of it.</h2>
            <p>These are program targets from the RewardMe model. The rate shown on an active offer is the rate that applies.</p>
          </div>
          <div className="rewardme-home__rates">
            <article><span>EVERYDAY SPOTS</span><strong>20%+</strong><p>Most participating restaurants, cafés, hotels, shops, and services.</p></article>
            <article><span>SLOW-TIME SPECIALS</span><strong>100%</strong><p>Selected partners may return the full qualifying amount in Rewards during an eligible off-peak offer.</p></article>
            <article><span>BIG PURCHASES</span><strong>{'<20%'}</strong><p>Cars, real estate, and other high-ticket categories may use a smaller percentage.</p></article>
          </div>
        </section>

        <section className="rewardme-home__savings" id="savings" aria-labelledby="rewardme-savings-title">
          <div>
            <p className="rewardme-home__eyebrow">SAVINGS CONCEPT</p>
            <h2 id="rewardme-savings-title">Save it. Don't spend it. Watch it grow.</h2>
            <p>The pitch deck describes locking eligible Rewards toward a longer-term goal. This feature is planned and is not accepting deposits or locking balances yet.</p>
          </div>
          <div className="rewardme-home__planned-card">
            <span>PLANNED · NOT LIVE</span>
            <strong>12-month lock concept</strong>
            <p>Final terms, eligibility, and payout rules will be published before launch.</p>
          </div>
        </section>

        <section className="rewardme-home__section" id="membership" aria-labelledby="rewardme-membership-title">
          <p className="rewardme-home__eyebrow">MEMBERSHIP</p>
          <div className="rewardme-home__section-heading">
            <h2 id="rewardme-membership-title">Start free. Upgrade when you're ready to earn more.</h2>
            <p>Public pricing and reward terms follow the RewardMe pitch deck. RewardMe does not collect payments online; Regular and Gold access is activated manually.</p>
          </div>
          <div className="rewardme-home__plans">
            {plans.map((plan) => (
              <article className={plan.featured ? 'rewardme-home__plan--featured' : undefined} key={plan.name}>
                {plan.featured ? <span className="rewardme-home__plan-label">RECOMMENDED</span> : null}
                <h3>{plan.name}</h3>
                <strong>{plan.price}</strong>
                <p>{plan.description}</p>
                <p className="rewardme-home__plan-check"><Check aria-hidden="true" /> Offer terms and eligibility apply</p>
              </article>
            ))}
          </div>
          <div className="rewardme-home__center-action">
            <Link className="rewardme-home__button" to="/membership">Compare membership options <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="rewardme-home__business" aria-labelledby="rewardme-business-title">
          <div>
            <p className="rewardme-home__eyebrow">FOR BUSINESSES</p>
            <h2 id="rewardme-business-title">Bring RewardMe members through your door.</h2>
            <p>Partners can participate through a Commission model or a Business-credit model. RewardMe's platform share is a 25% commission on Rewards spent.</p>
            <Link className="rewardme-home__button rewardme-home__button--outline" to="/business">See how businesses join <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="rewardme-home__bridge">
            <strong>Synergize bridge</strong>
            <p>Business credits from the separate Synergize network may help fund RewardMe offers that create paying customer activity. Each product keeps its own audience and terms.</p>
          </div>
        </section>
      </main>

      <footer className="rewardme-home__footer">
        <div className="rewardme-home__brand"><Bookmark aria-hidden="true" /><span>RewardMe</span></div>
        <p>Earn where you already spend. Save toward what matters.</p>
        <nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><Link to="/shop">Store</Link><Link to="/membership">Membership</Link><Link to="/business">Businesses</Link></nav>
      </footer>
    </div>
  )
}
