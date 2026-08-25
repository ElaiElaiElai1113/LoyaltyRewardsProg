import {
  ArrowRight,
  BadgeCheck,
  Gift,
  QrCode,
  Repeat2,
  ScanLine,
  Sparkles,
  TicketCheck,
  UsersRound,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router'

import localBusinessOwner from '@/assets/business/local-business-owner-wide.webp'
import returningCustomer from '@/assets/landing/coffee-rewards.webp'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTenant } from '@/hooks/use-tenant'

import './loyality-home-page.css'

const features = [
  {
    icon: UsersRound,
    number: '01',
    title: 'Bring in the right customers',
    body: 'Share a trackable QR offer through ads, social posts, or a customer referral. Loyality records exactly where each claim came from.',
  },
  {
    icon: Repeat2,
    number: '02',
    title: 'Give them a reason to return',
    body: 'Reward visit two, visit three, every seventh visit, or any schedule your business chooses. Each recorded QR visit advances the customer automatically.',
  },
  {
    icon: TicketCheck,
    number: '03',
    title: 'Redeem one clear voucher',
    body: 'Rewards become a specific item, discount, or amount voucher. Staff scan it once—without mixing rewards into the POS or doing checkout math.',
  },
]

const workflow = [
  ['Share', 'Create one offer and share its QR anywhere.'],
  ['Claim', 'The customer opens the offer and keeps it in their wallet.'],
  ['Scan', 'Staff scan the member or voucher QR at the business.'],
  ['Return', 'Visit rules and referral thank-yous happen automatically.'],
]

export function LoyalityHomePage() {
  const { program } = useTenant()
  const heroVideoUrl = import.meta.env.VITE_LOYALITY_HERO_VIDEO_URL?.trim()
  const offerUrl = typeof window === 'undefined'
    ? '/offer/loyality-welcome'
    : `${window.location.origin}/offer/loyality-welcome?source=homepage`

  return (
    <main className="loyality-site" id="top">
      <header className="loyality-site__header">
        <a href="#top" className="loyality-site__brand" aria-label="Loyality home">
          <img src="/loyality-logo.svg" alt="Loyality" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#business">For business</a>
          <a href="#rewards">Rewards</a>
          <Link to="/business">Business page</Link>
        </nav>
        <div className="loyality-site__header-actions">
          <ThemeToggle />
          <Link to="/signin" className="loyality-site__text-link">Sign in</Link>
          <Link to="/join" className="loyality-site__button loyality-site__button--small">Join free</Link>
        </div>
      </header>

      <section className="loyality-site__hero" aria-labelledby="loyality-hero-title">
        <div className="loyality-site__hero-copy">
          <p className="loyality-site__eyebrow"><Sparkles size={15} /> One business. One clear loyalty loop.</p>
          <h1 id="loyality-hero-title">Turn every visit into <em>the next one.</em></h1>
          <p className="loyality-site__lede">
            {program.name} gives a business its own QR-powered customer acquisition and retention program—fully standalone, independently branded, and simple enough for any staff member to use.
          </p>
          <div className="loyality-site__hero-actions">
            <Link to="/join" className="loyality-site__button">Join as a customer <ArrowRight size={18} /></Link>
            <Link to="/signin" className="loyality-site__button loyality-site__button--outline">Business sign in</Link>
          </div>
          <ul className="loyality-site__proof" aria-label="Product highlights">
            <li><BadgeCheck size={17} /> No hardware</li>
            <li><BadgeCheck size={17} /> No app install</li>
            <li><BadgeCheck size={17} /> No POS integration</li>
          </ul>
        </div>

        <div className="loyality-site__hero-visual" aria-label="A local business using Loyality">
          <figure className="loyality-site__hero-photo">
            {heroVideoUrl ? (
              <video autoPlay loop muted playsInline poster={localBusinessOwner}>
                <source src={heroVideoUrl} type="video/mp4" />
              </video>
            ) : (
              <img src={localBusinessOwner} alt="A local business owner welcoming loyal customers" fetchPriority="high" />
            )}
            <figcaption>Built around the business your customers already know.</figcaption>
          </figure>
          <div className="loyality-site__scan-card">
            <div className="loyality-site__scan-top"><span>TRACKABLE OFFER</span><ScanLine size={22} /></div>
            <div className="loyality-site__qr-wrap">
              <QRCodeSVG value={offerUrl} size={132} bgColor="transparent" fgColor="#1b2a41" level="H" />
              <span className="loyality-site__scan-line" />
            </div>
            <div><strong>Welcome treat</strong><small>Scan to claim your first-visit offer</small></div>
          </div>
          <div className="loyality-site__loop-card loyality-site__loop-card--one"><UsersRound /><span>New customer</span></div>
          <div className="loyality-site__loop-card loyality-site__loop-card--two"><Gift /><span>Referrer rewarded</span></div>
        </div>
      </section>

      <section className="loyality-site__signal" aria-label="Loyality system summary">
        <span>ACQUIRE</span><i /><span>RETAIN</span><i /><span>REWARD</span><i /><span>REPEAT</span>
      </section>

      <section className="loyality-site__photo-story" aria-labelledby="loyality-story-title">
        <figure>
          <img src={returningCustomer} alt="A returning customer enjoying a visit at a local café" loading="lazy" decoding="async" />
          <figcaption>Recognition that feels personal, without slowing down service.</figcaption>
        </figure>
        <div>
          <p className="loyality-site__eyebrow">Made for real visits</p>
          <h2 id="loyality-story-title">A familiar experience for customers. One clear action for staff.</h2>
          <p>Customers keep one personal QR and see what they have earned. Staff scan, confirm, and return to serving—no special checkout system required.</p>
          <ul>
            <li><BadgeCheck /> Branded for the business</li>
            <li><BadgeCheck /> Easy on any phone</li>
            <li><BadgeCheck /> Every visit stays recorded</li>
          </ul>
        </div>
      </section>

      <section className="loyality-site__features" id="how-it-works" aria-labelledby="loyality-features-title">
        <div className="loyality-site__section-heading">
          <div><p className="loyality-site__eyebrow">The core system</p><h2 id="loyality-features-title">A loyalty program that follows real behavior.</h2></div>
          <p>Instead of asking staff to manage complicated balances, Loyality records who arrived, who referred them, and which visit reward comes next.</p>
        </div>
        <div className="loyality-site__feature-grid">
          {features.map((feature) => (
            <article key={feature.number}>
              <div><span>{feature.number}</span><feature.icon size={28} /></div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="loyality-site__workflow" id="business" aria-labelledby="loyality-workflow-title">
        <div className="loyality-site__workflow-intro">
          <p className="loyality-site__eyebrow">Built for non-technical teams</p>
          <h2 id="loyality-workflow-title">Four steps. No checkout gymnastics.</h2>
          <p>The business keeps using its normal checkout. Loyality only records the visit and presents a clear voucher when a reward is ready.</p>
          <Link to="/signin" className="loyality-site__button loyality-site__button--light">Open the business workspace <ArrowRight size={18} /></Link>
        </div>
        <ol>
          {workflow.map(([title, body], index) => (
            <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="loyality-site__voucher" id="rewards" aria-labelledby="loyality-voucher-title">
        <div className="loyality-site__voucher-card">
          <div className="loyality-site__voucher-mark"><QrCode size={30} /></div>
          <p>AVAILABLE VOUCHER</p>
          <h3>Second-visit bonus</h3>
          <span>One complimentary item</span>
          <small>Single-use • Scan at the business</small>
        </div>
        <div>
          <p className="loyality-site__eyebrow">Reward clarity</p>
          <h2 id="loyality-voucher-title">A specific promise—not a confusing cash balance.</h2>
          <p>Customers can see exactly what they earned. Staff see exactly what to provide. Each voucher has its own QR, status, source, and redemption record.</p>
          <ul>
            <li><BadgeCheck /> Specific item, discount, or amount</li>
            <li><BadgeCheck /> One-tap staff confirmation</li>
            <li><BadgeCheck /> Complete visit and referral history</li>
          </ul>
        </div>
      </section>

      <section className="loyality-site__secondary">
        <div><p className="loyality-site__eyebrow">Optional extra</p><h2>Turn purchases into prize entries.</h2></div>
        <p>Businesses can run a simple raffle alongside their core offer and visit programs. Eligible recorded purchases receive entries automatically.</p>
        <TicketCheck size={42} />
      </section>

      <section className="loyality-site__cta">
        <div><p className="loyality-site__eyebrow">Ready when your customer is</p><h2>Scan. Reward. Welcome them back.</h2></div>
        <div><Link to="/join" className="loyality-site__button">Create customer account</Link><Link to="/signin" className="loyality-site__text-link">Sign in</Link></div>
      </section>

      <footer className="loyality-site__footer">
        <img src="/loyality-logo.svg" alt="Loyality" />
        <p>Private loyalty software for one business at a time.</p>
        <nav aria-label="Footer"><Link to="/signin">Sign in</Link><Link to="/join">Create account</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/business">For business</Link></nav>
      </footer>
    </main>
  )
}
