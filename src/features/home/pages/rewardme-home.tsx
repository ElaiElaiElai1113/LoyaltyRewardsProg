import { Link } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'

import './rewardme-home.css'

const howItWorks = [
  { number: '1', title: 'Join free', body: 'Sign up in under a minute. No subscription, no card fees — RewardMe never costs you anything to use.', tone: 'gold' },
  { number: '2', title: 'Spend like normal', body: "Show your RewardMe code at checkout at any participating local business. That's the whole step.", tone: 'ember' },
  { number: '3', title: 'Redeem rewards', body: 'Points stack up automatically. Redeem for free items, discounts, or perks at any business in the network.', tone: 'gold' },
] as const

const memberBenefits = [
  { icon: '🔥', title: 'Streak bonuses', body: 'Keep your visit streak alive and unlock bonus points the longer it runs.', tone: 'ember' },
  { icon: '★', title: 'Real local rewards', body: 'Free coffee, discounts, appetizers — rewards from the independent businesses you already visit.', tone: 'gold' },
  { icon: '◎', title: 'Growing network', body: "New cafés, boutiques, and studios join every month, so there's always somewhere new to earn.", tone: 'ember' },
] as const

export function RewardMeHomePage() {
  const { program } = useTenant()
  const brand = program.slug === 'wondertown' ? 'WONDERTOWN REWARDS' : 'REWARDME'
  const brandTitle = program.slug === 'wondertown' ? 'Wondertown Rewards' : 'RewardMe'
  const cafeName = program.slug === 'wondertown' ? 'Moonbeam Café' : 'Casa Verde Café'

  return (
    <main className="reference-rewardme" id="top">
      <nav className="reference-rewardme__nav" aria-label={`${brandTitle} navigation`}>
        <div className="reference-rewardme__nav-inner">
          <a className="reference-rewardme__logo" href="#top">{brand}</a>
          <div className="reference-rewardme__nav-links">
            <a href="#how">How It Works</a>
            <Link to="/business">For Business</Link>
            <a href="#rewards">Rewards</a>
          </div>
          <div className="reference-rewardme__nav-actions">
            <Link className="reference-rewardme__sign-in" to="/signin">Sign In</Link>
            <Link className="reference-rewardme__nav-cta" to="/join">Join Free</Link>
          </div>
        </div>
      </nav>

      <section className="reference-rewardme__hero">
        <div className="reference-rewardme__wrap reference-rewardme__hero-grid">
          <div>
            <div className="reference-rewardme__eyebrow">Free to Join</div>
            <h1>Get rewarded<br />for spending where<br /><span>you already love.</span></h1>
            <p>Earn real rewards every time you visit your favorite local cafés, boutiques, and studios. No cost to join, no catch — just points that turn into things you actually want.</p>
            <div className="reference-rewardme__btn-row">
              <Link to="/join" className="reference-rewardme__btn-primary">Join Free</Link>
              <a href="#how" className="reference-rewardme__btn-ghost">See how it works</a>
            </div>
          </div>

          <div className="reference-rewardme__phone-wrap">
            <div className="reference-rewardme__phone">
              <div className="reference-rewardme__screen">
                <div className="reference-rewardme__screen-time">9:41</div>
                <div className="reference-rewardme__greet">Good evening,</div>
                <div className="reference-rewardme__greet-name">Maria</div>
                <div className="reference-rewardme__balance-card">
                  <div className="reference-rewardme__balance-label">YOUR BALANCE</div>
                  <div className="reference-rewardme__balance-num">2,340 PTS</div>
                  <div className="reference-rewardme__balance-sub">Worth ~$23.40 in rewards</div>
                </div>
                <div className="reference-rewardme__streak-card">
                  <div className="reference-rewardme__streak-title">🔥 4-week streak</div>
                  <div className="reference-rewardme__streak-sub">Visit once more this week to keep it</div>
                </div>
                <div className="reference-rewardme__rewards-label">Nearby Rewards</div>
                {[[cafeName, '150 pts — Free coffee'], ['Luna Boutique', '300 pts — 15% off'], ['Sal y Mar', '500 pts — Free appetizer']].map(([name, detail], index) => (
                  <div className={`reference-rewardme__reward-row${index === 2 ? ' reference-rewardme__reward-row--last' : ''}`} key={name}>
                    <div className="reference-rewardme__reward-dot" />
                    <div><div className="reference-rewardme__reward-name">{name}</div><div className="reference-rewardme__reward-sub">{detail}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__section--dark" id="how">
        <div className="reference-rewardme__wrap">
          <div className="reference-rewardme__section-head">
            <div className="reference-rewardme__section-label">How It Works</div>
            <h2>Three steps. Zero cost.</h2>
          </div>
          <div className="reference-rewardme__grid3">
            {howItWorks.map((item) => (
              <article className="reference-rewardme__feat-card" key={item.number}>
                <div className={`reference-rewardme__feat-icon reference-rewardme__feat-icon--${item.tone}`}>{item.number}</div>
                <h3>{item.title}</h3>
                <p>{item.body.replaceAll('RewardMe', brandTitle)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-rewardme__section" id="rewards">
        <div className="reference-rewardme__wrap">
          <div className="reference-rewardme__section-head">
            <div className="reference-rewardme__section-label">Why Members Stay</div>
            <h2>Built to feel like a win, every visit.</h2>
          </div>
          <div className="reference-rewardme__grid3">
            {memberBenefits.map((item) => (
              <article className="reference-rewardme__feat-card" key={item.title}>
                <div className={`reference-rewardme__feat-icon reference-rewardme__feat-icon--${item.tone}`}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-rewardme__cta-band" id="join">
        <div className="reference-rewardme__wrap">
          <h2>Free to join. Easy to love.</h2>
          <p>Start earning rewards at the local spots you already visit.</p>
          <div className="reference-rewardme__cta-actions">
            <Link to="/join" className="reference-rewardme__btn-dark">Join {brandTitle} Free</Link>
            <Link to="/signin" className="reference-rewardme__btn-dark reference-rewardme__btn-dark--outline">Sign In</Link>
          </div>
        </div>
      </section>

      <footer className="reference-rewardme__footer" id="business">
        <div className="reference-rewardme__wrap reference-rewardme__footer-inner">
          <div><div className="reference-rewardme__footer-logo">{brand}</div><div className="reference-rewardme__footer-tagline">Rewards for spending where you already love.</div></div>
          <div className="reference-rewardme__footer-links">
            <a href="#how">How It Works</a>
            <Link to="/business">For Business</Link>
            <Link to="/signin">Sign In</Link>
            <a href={`mailto:${program.supportEmail}`}>Contact</a>
          </div>
        </div>
        <div className="reference-rewardme__wrap reference-rewardme__footer-bottom">© {brandTitle}. Free for members, always.</div>
      </footer>
    </main>
  )
}
