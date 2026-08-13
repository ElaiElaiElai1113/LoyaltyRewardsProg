import type { CSSProperties } from 'react'
import {
  ArrowRight,
  CircleAlert,
  Clock3,
  HandCoins,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { Link } from 'react-router'
import { useTenant } from '@/hooks/use-tenant'

import ctaOverlay from '@/assets/business/cta-overlay.png'
import hotelPartner from '@/assets/business/hotel-partner.png'
import localBusinessOwner from '@/assets/business/local-business-owner.png'
import localBusinessOwnerWide from '@/assets/business/local-business-owner-wide.webp'
import localBusinessOwnerWideSmall from '@/assets/business/local-business-owner-wide-768.webp'
import salonPartner from '@/assets/business/salon-partner.png'
import staffQrCheckout from '@/assets/business/staff-qr-checkout.png'
import restaurantPartner from '@/assets/landing/dinner-rewards.webp'
import ctaPhoto from '@/assets/medellinrewards-hero.webp'

import './for-businesses-page.css'

const partnerBenefits = [
  {
    icon: ShoppingBag,
    title: 'Bring in new, loyal customers',
    body: 'Get discovered by members who are actively excited to earn Rewards — and who keep coming back to do it.',
  },
  {
    icon: RefreshCw,
    title: 'Increase repeat visits',
    body: 'Members return to keep earning, and bring friends and family along with them — compounding your customer base.',
  },
  {
    icon: HandCoins,
    title: 'No upfront cost',
    body: 'Pay nothing to join. You only pay a 15%–25% commission, based on your industry, once a sale actually happens.',
  },
  {
    icon: Clock3,
    title: 'Fast, easy onboarding',
    body: 'We handle setup from end to end. Your staff just needs to scan a QR code when members make a purchase.',
  },
] as const

const partnerCategories = [
  {
    src: hotelPartner,
    alt: 'Hotel partner welcoming a rewards member',
    label: 'Hotels',
  },
  {
    src: restaurantPartner,
    alt: 'Restaurant partner serving rewards members',
    label: 'Restaurants',
  },
  {
    src: salonPartner,
    alt: 'Salon partner serving rewards members',
    label: 'Salons',
  },
] as const

const processSteps = [
  {
    number: '1',
    title: 'Member shows their QR code',
    body: 'A Medellin Rewards member makes a purchase at your business and shows the QR code from their app.',
  },
  {
    number: '2',
    title: 'Staff scans and enters the sale',
    body: 'Your staff scans the QR code, then enters the bill amount and invoice number.',
  },
  {
    number: '3',
    title: 'You pay us our commission weekly',
    body: 'We tally everything automatically and you pay your commission on a simple weekly cycle. No surprises.',
  },
] as const

function SectionEyebrow({ children }: { children: string }) {
  return <p className="business-landing__eyebrow">{children}</p>
}

const rewardMeModels = [
  {
    name: 'Commission model',
    description: 'The business funds a member reward when a qualifying sale occurs. RewardMe retains a 25% commission on Rewards spent through the platform.',
  },
  {
    name: 'Business-credit model',
    description: 'A business may issue eligible business credit to support RewardMe offers, subject to a signed agreement and published member terms.',
  },
] as const

function RewardMeBusinessPage({ supportEmail }: { supportEmail: string }) {
  return (
    <div className="rewardme-business">
      <section className="rewardme-business__hero">
        <div>
          <p className="rewardme-business__eyebrow">REWARDME FOR BUSINESSES</p>
          <h1>Turn unused capacity into loyal, paying customers.</h1>
          <p>Join the RewardMe network, publish clear member offers, and only fund rewards under the participation model in your signed agreement.</p>
          <div className="rewardme-business__actions">
            <a className="rewardme-business__button" href={`mailto:${supportEmail}?subject=RewardMe%20business%20application`}>Apply to partner <ArrowRight aria-hidden="true" /></a>
            <Link className="rewardme-business__button rewardme-business__button--outline" to="/signin?portal=business">Business sign in</Link>
          </div>
        </div>
        <picture className="rewardme-business__hero-media">
          <source media="(max-width: 780px)" srcSet={localBusinessOwnerWideSmall} />
          <img src={localBusinessOwnerWide} alt="Local business owner welcoming RewardMe members" decoding="async" fetchPriority="high" />
        </picture>
      </section>

      <section id="benefits" className="rewardme-business__section" aria-labelledby="rewardme-models-title">
        <p className="rewardme-business__eyebrow">TWO PARTICIPATION MODELS</p>
        <h2 id="rewardme-models-title">Choose the model that matches your business.</h2>
        <div className="rewardme-business__models">
          {rewardMeModels.map((model) => <article key={model.name}><h3>{model.name}</h3><p>{model.description}</p></article>)}
        </div>
        <p className="rewardme-business__note">Final rates, offer eligibility, settlement timing, and credit terms are confirmed in the business agreement before launch.</p>
      </section>

      <section id="how-it-works" className="rewardme-business__section rewardme-business__process" aria-labelledby="rewardme-business-process-title">
        <div>
          <p className="rewardme-business__eyebrow">HOW IT WORKS</p>
          <h2 id="rewardme-business-process-title">A clear path from offer to repeat visit.</h2>
        </div>
        <ol>
          <li><span>01</span><div><h3>Agree the commercial terms</h3><p>Select the Commission model or Business-credit model and document the offer, limits, and settlement rules.</p></div></li>
          <li><span>02</span><div><h3>Publish an eligible offer</h3><p>Members see the active rate, availability, and restrictions before they spend.</p></div></li>
          <li><span>03</span><div><h3>Verify the purchase</h3><p>Staff records the qualifying sale so the member receives the applicable reward and the business has an auditable entry.</p></div></li>
        </ol>
      </section>

      <section className="rewardme-business__bridge">
        <div><p className="rewardme-business__eyebrow">SYNERGIZE BRIDGE</p><h2>Connected economics. Separate products.</h2></div>
        <p>Synergize is the separate B2B credit network. Eligible Synergize business credits may help fund RewardMe offers, which convert that value into new customer activity. RewardMe members do not need a Synergize account.</p>
      </section>

      <section id="get-started" className="rewardme-business__cta">
        <h2>Ready to discuss a RewardMe offer?</h2>
        <p>Contact the program team for qualification, terms, and onboarding.</p>
        <a className="rewardme-business__button" href={`mailto:${supportEmail}?subject=RewardMe%20partner%20conversation`}>Talk to the team <ArrowRight aria-hidden="true" /></a>
      </section>
    </div>
  )
}

export function ForBusinessesPage() {
  const { program } = useTenant()
  if (program.slug === 'pinas') return <RewardMeBusinessPage supportEmail={program.supportEmail} />
  const isDemoTenant = program.featureFlags.demoTenant === true
  const tenantText = (text: string) => text.replaceAll('Medellin Rewards', program.name)
  return (
    <div className="business-landing">
      <section className="business-landing__hero" aria-labelledby="business-hero-title">
        <div className="business-landing__container business-landing__hero-grid">
          <div className="business-landing__hero-copy">
            <SectionEyebrow>FOR LOCAL BUSINESSES</SectionEyebrow>
            <h1 id="business-hero-title">
              Helping local<br />
              businesses <em>grow,</em><br />
              while giving amazing<br />
              <em>Rewards</em> to our<br />
              members.
            </h1>
            <p className="business-landing__hero-intro">
              Join the {program.name} network and turn every member purchase into a new regular.
            </p>

            <div className="business-landing__hero-actions">
              <a className="business-landing__button" href="#get-started">
                Partner With Us <ArrowRight aria-hidden="true" />
              </a>
              <a className="business-landing__button business-landing__button--outline" href="#how-it-works">
                See how it works
              </a>
            </div>

            <ul className="business-landing__pills" aria-label="Partner benefits">
              <li>No upfront cost</li>
              <li>15–25% commission</li>
              <li>Setup in days, not weeks</li>
            </ul>
          </div>

          <div className="business-landing__hero-art">
            <span className="business-landing__hero-ring business-landing__hero-ring--outer" aria-hidden="true" />
            <span className="business-landing__hero-ring business-landing__hero-ring--middle" aria-hidden="true" />
            <span className="business-landing__hero-ring business-landing__hero-ring--inner" aria-hidden="true" />
            <img
              src={localBusinessOwner}
              alt={`Local business owner ready to welcome ${program.name} members`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="business-landing__cost-badge" aria-label="Zero percent upfront cost">
              <strong>0%</strong>
              <span>UPFRONT COST</span>
            </div>
          </div>
        </div>
      </section>

      <section className="business-landing__benefits" id="benefits" aria-labelledby="benefits-title">
        <div className="business-landing__container">
          <SectionEyebrow>WHY PARTNER WITH US</SectionEyebrow>
          <h2 id="benefits-title">A steady stream of loyal, spending<br />customers</h2>
          <p className="business-landing__section-intro">
            Every member on the platform is already looking for places to earn — and<br className="business-landing__desktop-break" />
            businesses like yours are exactly where they want to spend.
          </p>

          <div className="business-landing__benefit-grid">
            {partnerBenefits.map((benefit) => {
              const Icon = benefit.icon

              return (
                <article className="business-landing__benefit" key={benefit.title}>
                  <span className="business-landing__benefit-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </article>
              )
            })}
          </div>

          <aside className="business-landing__limited" aria-label="Limited partner space">
            <CircleAlert aria-hidden="true" />
            <div>
              <h3>Limited space</h3>
              <p>There is a limit of businesses per type of business.</p>
            </div>
          </aside>

          <div className="business-landing__category-grid">
            {partnerCategories.map((category) => (
              <figure
                className={`business-landing__category-card business-landing__category-card--${category.label.toLowerCase()}`}
                key={category.label}
              >
                <img src={category.src} alt={category.alt} loading="lazy" decoding="async" />
                <figcaption>{category.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="business-landing__process" id="how-it-works" aria-labelledby="business-process-title">
        <div className="business-landing__container">
          <SectionEyebrow>HOW IT WORKS</SectionEyebrow>
          <h2 id="business-process-title">Three steps. That’s it.</h2>

          <div className="business-landing__process-grid">
            <ol className="business-landing__steps">
              {processSteps.map((step) => (
                <li key={step.number}>
                  <span className="business-landing__step-number">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{tenantText(step.body)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="business-landing__qr-art">
              <img
                src={staffQrCheckout}
                alt="Staff member scanning a customer QR code at checkout"
                loading="lazy"
                decoding="async"
              />
              <div className="business-landing__time-badge">
                <strong>~10 sec</strong>
                <span>to scan and log a sale at checkout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="business-landing__cta"
        id="get-started"
        aria-labelledby="business-cta-title"
        style={{ '--business-cta-art': `url(${ctaPhoto})` } as CSSProperties}
      >
        <span className="business-landing__compat-anchor" id="book-demo" aria-hidden="true" />
        <img
          className="business-landing__cta-overlay"
          src={ctaOverlay}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <div className="business-landing__cta-erase" aria-hidden="true" />
        <div className="business-landing__cta-content">
          <SectionEyebrow>GET STARTED TODAY</SectionEyebrow>
          <h2 id="business-cta-title">Sign the agreement. We’ll take<br />it from there.</h2>
          <p>
            Sign the partnership agreement and a meeting will be<br className="business-landing__desktop-break" />
            scheduled for a short interview to see if your<br className="business-landing__desktop-break" />
            business will qualify.
          </p>
          {isDemoTenant ? (
            <Link className="business-landing__button" to="/signin?portal=business">
              Open Business Demo <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <a className="business-landing__button" href={`mailto:${program.supportEmail}`}>
              Get Started Today <ArrowRight aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      <section className="business-landing__questions" aria-labelledby="business-questions-title">
        <div className="business-landing__container business-landing__questions-inner">
          <div>
            <h2 id="business-questions-title">Have questions before you sign?</h2>
            <p>Talk to our team and we’ll walk you through commission rates,<br className="business-landing__desktop-break" /> onboarding, and what to expect.</p>
          </div>
          <div className="business-landing__question-actions">
            {program.slug === 'pinas' ? null : (
              <Link className="business-landing__button business-landing__button--outline" to="/cost-calculator">
                Calculate Your Costs <ArrowRight aria-hidden="true" />
              </Link>
            )}
            {isDemoTenant ? (
              <Link className="business-landing__button" to="/guide">
                View Demo Guide <ArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <a className="business-landing__button" href={`mailto:${program.supportEmail}`}>
                Talk to us <ArrowRight aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
