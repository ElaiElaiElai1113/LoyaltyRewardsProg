import { Link } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'

import './loyality-home-page.css'

export function LoyalityHomePage() {
  const { program } = useTenant()
  const demoHref = `mailto:${program.supportEmail}?subject=${encodeURIComponent('Loyality demo request')}`

  return (
    <main className="reference-loyality" id="top">
      <nav className="reference-loyality__nav" aria-label="Loyality navigation">
        <div className="reference-loyality__nav-inner">
          <a href="#top" className="reference-loyality__logo">Loyality</a>
          <div className="reference-loyality__nav-links">
            <a href="#how">Product</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="reference-loyality__nav-actions">
            <Link className="reference-loyality__sign-in" to="/signin">Sign In</Link>
            <Link className="reference-loyality__nav-cta" to="/business">See a Demo</Link>
          </div>
        </div>
      </nav>

      <section className="reference-loyality__hero">
        <div className="reference-loyality__wrap reference-loyality__hero-grid">
          <div>
            <div className="reference-loyality__eyebrow">Your Own Branded Loyalty Program</div>
            <h1>Your loyalty card,<br /><span>reimagined.</span></h1>
            <p>A white-label, QR-based loyalty platform that runs under your own brand. Customers scan, earn, and redeem — you focus on running your business.</p>
            <div className="reference-loyality__btn-row">
              <Link to="/business" className="reference-loyality__btn-primary">See a Demo</Link>
              <a href="#how" className="reference-loyality__btn-secondary">How it works</a>
            </div>
          </div>

          <div className="reference-loyality__card-demo">
            <div className="reference-loyality__demo-tag">Powered by Loyality</div>
            <div className="reference-loyality__biz-name">Harvest &amp; Vine</div>
            <div className="reference-loyality__biz-sub">Neighborhood wine bar &amp; kitchen</div>
            <div className="reference-loyality__qr-row">
              <div className="reference-loyality__qr-box" aria-label="Illustrative QR code" />
              <div className="reference-loyality__qr-copy"><p>Scan at checkout to earn points automatically — no app download required for the customer.</p></div>
            </div>
            <div className="reference-loyality__progress-card">
              <div className="reference-loyality__progress-title">3 visits to next reward</div>
              <div className="reference-loyality__progress-sub">Almost there — one more visit unlocks it</div>
              <div className="reference-loyality__progress-bar"><div className="reference-loyality__progress-fill" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="reference-loyality__section" id="how">
        <div className="reference-loyality__wrap">
          <div className="reference-loyality__section-head">
            <div className="reference-loyality__section-label">Two Core Pillars</div>
            <h2>Built to bring customers in, and keep them coming back.</h2>
          </div>
          <div className="reference-loyality__grid3">
            <article className="reference-loyality__pillar-card"><div className="reference-loyality__pillar-tag">Acquisition</div><h3>Trackable referrals</h3><p>Every promotion becomes trackable. Give a new customer an incentive via a QR code, and see exactly where each redemption came from — no guesswork on what&apos;s working.</p></article>
            <article className="reference-loyality__pillar-card"><div className="reference-loyality__pillar-tag">Retention</div><h3>Visit-based rewards</h3><p>Reward customers automatically on their 2nd or 3rd visit, or run a classic punch-card model. Retention raises both spend and repeat-visit rate.</p></article>
            <article className="reference-loyality__pillar-card"><div className="reference-loyality__pillar-tag">Simplicity</div><h3>No POS integration needed</h3><p>Staff scan a QR code and see the customer&apos;s balance. No new hardware, no complicated setup — it works alongside whatever you already use.</p></article>
          </div>
        </div>
      </section>

      <section className="reference-loyality__section reference-loyality__section--navy" id="pricing">
        <div className="reference-loyality__wrap">
          <div className="reference-loyality__section-head">
            <div className="reference-loyality__section-label">Why It Works</div>
            <h2>White-label means it&apos;s yours, not ours.</h2>
          </div>
          <div className="reference-loyality__grid2">
            <article className="reference-loyality__dark-card"><div className="reference-loyality__dark-num">For Your Customers</div><h3>Feels like your program</h3><p>Your branding, your name, your look stay front and center. Loyality appears only where account, security, or support context requires it.</p></article>
            <article className="reference-loyality__dark-card"><div className="reference-loyality__dark-num">For Your Business</div><h3>Runs itself in the background</h3><p>Once it&apos;s set up, the acquisition and retention mechanics run automatically. You focus on the business, not the software.</p></article>
          </div>
        </div>
      </section>

      <section className="reference-loyality__cta" id="demo">
        <div className="reference-loyality__wrap">
          <h2>See it running for a business like yours.</h2>
          <p>We&apos;ll walk you through a live demo built around your business type — no commitment required.</p>
          <div className="reference-loyality__cta-actions">
            <a href={demoHref} className="reference-loyality__btn-primary">Request a Demo</a>
            <Link to="/signin" className="reference-loyality__btn-primary reference-loyality__btn-primary--outline">Sign In</Link>
          </div>
        </div>
      </section>

      <footer className="reference-loyality__footer" id="contact">
        <div className="reference-loyality__wrap reference-loyality__footer-inner">
          <div><div className="reference-loyality__footer-logo">Loyality</div><div className="reference-loyality__footer-tagline">Your loyalty card, reimagined.</div></div>
          <div className="reference-loyality__footer-links"><a href="#how">Product</a><a href="#pricing">Why It Works</a><Link to="/signin">Sign In</Link><a href={`mailto:${program.supportEmail}`}>Contact</a></div>
        </div>
        <div className="reference-loyality__wrap reference-loyality__footer-bottom">© Loyality. A white-label loyalty platform for independent businesses.</div>
      </footer>
    </main>
  )
}
