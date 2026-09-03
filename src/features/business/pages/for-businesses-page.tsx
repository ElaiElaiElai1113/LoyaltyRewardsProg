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
import { useLanguage } from '@/lib/language'
import { isRewardMeExperience } from '@/lib/rewardme-experience'

import ctaOverlay from '@/assets/business/cta-overlay.png'
import hotelPartner from '@/assets/business/hotel-partner.webp'
import localBusinessOwner from '@/assets/business/local-business-owner.webp'
import localBusinessOwnerWide from '@/assets/business/local-business-owner-wide.webp'
import localBusinessOwnerWideSmall from '@/assets/business/local-business-owner-wide-768.webp'
import salonPartner from '@/assets/business/salon-partner.webp'
import staffQrCheckout from '@/assets/business/staff-qr-checkout.webp'
import restaurantPartner from '@/assets/landing/dinner-rewards.webp'
import medellinCtaPhoto from '@/assets/medellinrewards-hero.webp'

import './for-businesses-page.css'
import { LoyalityBusinessPage } from './loyality-business-page'

type Translate = ReturnType<typeof useLanguage>['t']

const getPartnerBenefits = (t: Translate) => [
  {
    icon: ShoppingBag,
    title: t('Bring in new, loyal customers'),
    body: t('Get discovered by members who are actively excited to earn Rewards — and who keep coming back to do it.'),
  },
  {
    icon: RefreshCw,
    title: t('Increase repeat visits'),
    body: t('Members return to keep earning, and bring friends and family along with them — compounding your customer base.'),
  },
  {
    icon: HandCoins,
    title: t('No upfront cost'),
    body: t('Pay nothing to join. You only pay a 15%–25% commission, based on your industry, once a sale actually happens.'),
  },
  {
    icon: Clock3,
    title: t('Fast, easy onboarding'),
    body: t('We handle setup from end to end. Your staff just needs to scan a QR code when members make a purchase.'),
  },
] as const

const getPartnerCategories = (t: Translate) => [
  {
    slug: 'hotels',
    src: hotelPartner,
    alt: t('Hotel partner welcoming a rewards member'),
    label: t('Hotels'),
  },
  {
    slug: 'restaurants',
    src: restaurantPartner,
    alt: t('Restaurant partner serving rewards members'),
    label: t('Restaurants'),
  },
  {
    slug: 'salons',
    src: salonPartner,
    alt: t('Salon partner serving rewards members'),
    label: t('Salons'),
  },
] as const

const getProcessSteps = (t: Translate, programName: string) => [
  {
    number: '1',
    title: t('Member shows their QR code'),
    body: t('A {program} member makes a purchase at your business and shows the QR code from their app.', {
      program: programName,
    }),
  },
  {
    number: '2',
    title: t('Staff scans and enters the sale'),
    body: t('Your staff scans the QR code, then enters the bill amount and invoice number.'),
  },
  {
    number: '3',
    title: t('You pay us our commission weekly'),
    body: t('We tally everything automatically and you pay your commission on a simple weekly cycle. No surprises.'),
  },
] as const

function SectionEyebrow({ children }: { children: string }) {
  return <p className="business-landing__eyebrow">{children}</p>
}

function RewardMeBusinessPage({ brand, supportEmail, isWondertown }: { brand: string; supportEmail: string; isWondertown: boolean }) {
  const { t } = useLanguage()

  return (
    <div
      className="rewardme-ledger-business"
      data-rewardme-editorial-business
      data-wondertown-rewardme-mirror={isWondertown || undefined}
    >
      <section className="rewardme-ledger-business__hero">
        <div>
          <Link to="/">{t('← Back home')}</Link>
          <p className="rewardme-ledger-business__eyebrow">{isWondertown ? t('For businesses · fictional test environment') : t('For businesses')}</p>
          <h1>{t('Get new customers while rewarding our members.')}</h1>
          <p className="rewardme-ledger-business__highlight">{t('{program} members choose where to go based on the reward. Join, and they choose you.', { program: brand })}</p>
          <p>{isWondertown
            ? t('Test the same offer, purchase-verification, and business-account workflows used by RewardMe with fictional businesses and sandbox data.')
            : t("You're seeing this because we think your business is a great fit for RewardMe members. Join, and you're in front of real members who are actively looking for a reason to spend — you only pay when it actually brings you a customer.")}</p>
          <div className="rewardme-ledger-business__actions">
            <a className="rewardme-ledger-business__button rewardme-ledger-business__button--gold" href="#how-it-works">{t('See how it works')}</a>
            <a className="rewardme-ledger-business__button" href="#get-started">{t('Get started')}</a>
          </div>
        </div>
        <picture className="rewardme-ledger-business__hero-media">
          <source media="(max-width: 780px)" srcSet={localBusinessOwnerWideSmall} />
          <img src={localBusinessOwnerWide} alt={t('Local business owner welcoming rewards members')} decoding="async" fetchPriority="high" />
        </picture>
      </section>

      <section id="how-it-works" className="rewardme-ledger-business__section">
        <div className="rewardme-ledger-business__section-head"><p className="rewardme-ledger-business__eyebrow">{t('How it works')}</p><h2>{t('Three steps. You pay for results, not access.')}</h2><p>{t("Our members only earn rewards at businesses that are part of RewardMe. If you're not on the platform, you're not in the running — joining is what puts you in front of them.")}</p></div>
        <ol className="rewardme-ledger-business__steps">
          <li><span>01</span><div><h3>{t('Join RewardMe')}</h3><p>{t('Set your reward rate — typically 20–100% back, lower for big-ticket items — and choose whether members can just earn at your business, or earn and redeem too.')}</p></div></li>
          <li><span>02</span><div><h3>{t('Members choose you for the reward')}</h3><p>{t("RewardMe members are actively looking for the best rewards out there. Businesses without access to our members aren't in the running — being on RewardMe puts you in front of them.")}</p></div></li>
          <li><span>03</span><div><h3>{t('Choose how you pay')}</h3><p>{t('Pick whichever fits your business: pay RewardMe a commission and we pay the reward straight to the member (Commission Model), or issue the reward yourself as your own business credit — a store credit, gift card, or account balance (Credit Model). Either way, you only pay for rewards actually redeemed.')}</p></div></li>
        </ol>
      </section>

      <section id="benefits" className="rewardme-ledger-business__section">
        <div className="rewardme-ledger-business__section-head"><p className="rewardme-ledger-business__eyebrow">{t('Why it works')}</p><h2>{t("You're paying for customers, not advertising space.")}</h2></div>
        <div className="rewardme-ledger-business__why">
          <article><h3>{t('Real customers, not impressions')}</h3><p>{t('Every reward redeemed is an actual person spending money at your business — not a click or a view.')}</p></article>
          <article><h3>{t('Pay for results')}</h3><p>{t('The commission is tied to rewards actually redeemed, not a flat fee regardless of what it brings in.')}</p></article>
          <article><h3>{t('Simple to run')}</h3><p>{t('Pick your reward rate and redemption settings — we handle the member side.')}</p></article>
        </div>
        <img className="rewardme-ledger-business__service-photo" src={staffQrCheckout} alt={t('Staff member scanning a member QR code at checkout')} loading="lazy" />
      </section>

      <section className="rewardme-ledger-business__section" id="cost">
        <div className="rewardme-ledger-business__cost">
          <div><h2>{t('Simple, upfront pricing.')}</h2><p>{t("No surprise fees, nothing hidden in fine print. Here's the plain version.")}</p></div>
          <div className="rewardme-ledger-business__model-list">
            <div><strong>{t('Commission Model')}</strong><span>15–25%</span></div>
            <div><strong>{t('Credit Model')}</strong><span>15–25%</span></div>
            <div><strong>{t('Cost to join')}</strong><span>$0</span></div>
          </div>
        </div>
      </section>

      <section className="rewardme-ledger-business__section">
        <div className="rewardme-ledger-business__bridge"><div><p className="rewardme-ledger-business__eyebrow">{t("If you're already part of Synergize")}</p><h2>{t('You can pay with Synergize credit instead of cash.')}</h2><p>{t("Synergize is a separate, private network where businesses trade credit with each other. If you're already a Synergize member, you can use that credit to cover either the Commission or Credit Model above — since the network fee was already paid when you earned or bought that credit, there's no second charge.")}</p></div><a className="rewardme-ledger-business__button" href="https://synergize-business-group.vercel.app">{t('Learn about Synergize →')}</a></div>
      </section>

      <section className="rewardme-ledger-business__section" id="get-started">
        <div className="rewardme-ledger-business__cta">
          <div><h2>{t("Ready to see if it's a fit?")}</h2><p>{t("Tell us a bit about your business and we'll walk you through what joining looks like.")}</p></div>
          <div className="rewardme-ledger-business__cta-actions"><Link className="rewardme-ledger-business__button rewardme-ledger-business__button--gold" to="/business/apply/commission">{t('Apply: Commission model')}</Link><Link className="rewardme-ledger-business__button" to="/business/apply/credit">{t('Apply: Credit model')}</Link>{isWondertown ? <><Link className="rewardme-ledger-business__contact" to="/signin?portal=business">{t('Business sign in')}</Link><Link className="rewardme-ledger-business__contact" to="/guide">{t('Open the test guide')}</Link></> : <a className="rewardme-ledger-business__contact" href={`mailto:${supportEmail}`}>{t('Questions? Email the program team')}</a>}</div>
        </div>
      </section>
    </div>
  )
}

export function ForBusinessesPage() {
  const { program } = useTenant()
  const { t } = useLanguage()
  if (program.slug === 'loyality') return <LoyalityBusinessPage />
  if (isRewardMeExperience(program.slug)) {
    return <RewardMeBusinessPage brand={program.name} supportEmail={program.supportEmail} isWondertown={program.slug === 'wondertown'} />
  }
  const isDemoTenant = program.featureFlags.demoTenant === true
  const partnerBenefits = getPartnerBenefits(t)
  const partnerCategories = getPartnerCategories(t)
  const processSteps = getProcessSteps(t, program.name)
  const ctaPhoto = program.slug === 'medellin' ? medellinCtaPhoto : localBusinessOwnerWide
  return (
    <div className="business-landing">
      <section className="business-landing__hero" aria-labelledby="business-hero-title">
        <div className="business-landing__container business-landing__hero-grid">
          <div className="business-landing__hero-copy">
            <SectionEyebrow>{t('FOR LOCAL BUSINESSES')}</SectionEyebrow>
            <h1 id="business-hero-title">
              {t('Helping local')}<br />
              {t('businesses')} <em>{t('grow,')}</em><br />
              {t('while giving amazing')}<br />
              <em>{t('Rewards')}</em> {t('to our')}<br />
              {t('members.')}
            </h1>
            <p className="business-landing__hero-intro">
              {t('Join the {program} network and turn every member purchase into a new regular.', {
                program: program.name,
              })}
            </p>

            <div className="business-landing__hero-actions">
              <a className="business-landing__button" href="#get-started">
                {t('Partner With Us')} <ArrowRight aria-hidden="true" />
              </a>
              <a className="business-landing__button business-landing__button--outline" href="#how-it-works">
                {t('See how it works')}
              </a>
            </div>

            <ul className="business-landing__pills" aria-label={t('Partner benefits')}>
              <li>{t('No upfront cost')}</li>
              <li>{t('15–25% commission')}</li>
              <li>{t('Setup in days, not weeks')}</li>
            </ul>
          </div>

          <div className="business-landing__hero-art">
            <span className="business-landing__hero-ring business-landing__hero-ring--outer" aria-hidden="true" />
            <span className="business-landing__hero-ring business-landing__hero-ring--middle" aria-hidden="true" />
            <span className="business-landing__hero-ring business-landing__hero-ring--inner" aria-hidden="true" />
            <img
              src={localBusinessOwner}
              alt={t('Local business owner ready to welcome {program} members', {
                program: program.name,
              })}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="business-landing__cost-badge" aria-label={t('Zero percent upfront cost')}>
              <strong>0%</strong>
              <span>{t('UPFRONT COST')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="business-landing__benefits" id="benefits" aria-labelledby="benefits-title">
        <div className="business-landing__container">
          <SectionEyebrow>{t('WHY PARTNER WITH US')}</SectionEyebrow>
          <h2 id="benefits-title">{t('A steady stream of loyal, spending customers')}</h2>
          <p className="business-landing__section-intro">
            {t('Every member on the platform is already looking for places to earn — and businesses like yours are exactly where they want to spend.')}
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

          <aside className="business-landing__limited" aria-label={t('Limited partner space')}>
            <CircleAlert aria-hidden="true" />
            <div>
              <h3>{t('Limited space')}</h3>
              <p>{t('There is a limit of businesses per type of business.')}</p>
            </div>
          </aside>

          <div className="business-landing__category-grid">
            {partnerCategories.map((category) => (
              <figure
                className={`business-landing__category-card business-landing__category-card--${category.slug}`}
                key={category.slug}
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
          <SectionEyebrow>{t('HOW IT WORKS')}</SectionEyebrow>
          <h2 id="business-process-title">{t('Three steps. That’s it.')}</h2>

          <div className="business-landing__process-grid">
            <ol className="business-landing__steps">
              {processSteps.map((step) => (
                <li key={step.number}>
                  <span className="business-landing__step-number">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="business-landing__qr-art">
              <img
                src={staffQrCheckout}
                alt={t('Staff member scanning a customer QR code at checkout')}
                loading="lazy"
                decoding="async"
              />
              <div className="business-landing__time-badge">
                <strong>{t('~10 sec')}</strong>
                <span>{t('to scan and log a sale at checkout')}</span>
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
          <SectionEyebrow>{t('GET STARTED TODAY')}</SectionEyebrow>
          <h2 id="business-cta-title">{t('Sign the agreement. We’ll take it from there.')}</h2>
          <p>
            {t('Sign the partnership agreement and a meeting will be scheduled for a short interview to see if your business will qualify.')}
          </p>
          {isDemoTenant ? (
            <Link className="business-landing__button" to="/signin?portal=business">
              {t('Open Business Demo')} <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <a className="business-landing__button" href={`mailto:${program.supportEmail}`}>
              {t('Get Started Today')} <ArrowRight aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      <section className="business-landing__questions" aria-labelledby="business-questions-title">
        <div className="business-landing__container business-landing__questions-inner">
          <div>
            <h2 id="business-questions-title">{t('Have questions before you sign?')}</h2>
            <p>{t('Talk to our team and we’ll walk you through commission rates, onboarding, and what to expect.')}</p>
          </div>
          <div className="business-landing__question-actions">
            {program.slug === 'pinas' ? null : (
              <Link className="business-landing__button business-landing__button--outline" to="/cost-calculator">
                {t('Calculate Your Costs')} <ArrowRight aria-hidden="true" />
              </Link>
            )}
            {isDemoTenant ? (
              <Link className="business-landing__button" to="/guide">
                {t('View Demo Guide')} <ArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <a className="business-landing__button" href={`mailto:${program.supportEmail}`}>
                {t('Talk to us')} <ArrowRight aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
