import { Fragment } from 'react'
import { Link } from 'react-router'

import businessOwner from '@/assets/business/local-business-owner-wide.webp'
import hotelReward from '@/assets/business/hotel-partner.webp'
import checkoutMoment from '@/assets/landing/coffee-member-wide.webp'
import dinnerReward from '@/assets/landing/dinner-rewards.webp'
import salonReward from '@/assets/landing/salon-rewards.webp'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { RewardMeLedgerMark, RewardMePublicHeader } from '@/features/home/components/rewardme-public-header'

import './rewardme-home.css'

const memberSteps = [
 ['01','Join free','Create your account in your browser. No membership payment is required.'],
 ['02','Earn as you spend','Check the offer at each participating business before you spend. Eligible purchases earn the published rewards.'],
 ['03','Choose a reward','Use your available points for eligible rewards in the catalog. Availability and partner conditions apply.'],
] as const

const rates = [
 ['Offers','Participating businesses','Each business publishes its own eligible reward offer.'],
 ['Catalog','Available rewards','Review the points required and availability before redeeming.'],
 ['History','Your activity','See recorded purchases and reward activity in your account.'],
] as const

const plans = [
 ['Free','Available now','Free','Free membership for everyone. Earn and redeem eligible rewards.'],
 ['Regular','Additional tier','Planned','Benefits and pricing await approval. Register interest without payment.'],
 ['Gold','Additional tier','Planned','Benefits and pricing await approval. Register interest without payment.'],
] as const

export function RewardMeHomePage() {
  const { program } = useTenant()
  const { t } = useLanguage()
  const brand = program.name
  const isWondertown = program.slug === 'wondertown'

  return (
    <Fragment>
      <RewardMePublicHeader />
      <main
        className="reference-rewardme"
        id="top"
        data-rewardme-editorial-home
        data-wondertown-rewardme-mirror={isWondertown || undefined}
      >
      <section className="reference-rewardme__hero reference-rewardme__wrap">
        <div className="reference-rewardme__hero-copy">
          <p className="reference-rewardme__eyebrow">{t(isWondertown ? 'RewardMe test environment · fictional data' : 'Free membership for everyone')}</p>
          <h1>{t('Earn amazing rewards while supporting local businesses.')}</h1>
          <p className="reference-rewardme__hero-highlight">{t("Join local businesses and discover")} <strong>{t('eligible rewards')}</strong> {t('in rewards.')}</p>
          <p className="reference-rewardme__lead">{t('Earn eligible rewards with participating local businesses and explore the available catalog.')}</p>
          <p className="reference-rewardme__lead">{t('Your rewards can be used for so many things:')}</p>
          <ul className="reference-rewardme__hero-list">
            <li>{t('Treat yourself to a night out on the town')}</li>
            <li>{t('Explore participating partners')}</li>
            <li>{t('Check each offer before spending')}</li>
          </ul>
          <div className="reference-rewardme__actions">
            <Link className="reference-rewardme__button reference-rewardme__button--gold" to="/join">{t('Join free')}</Link>
            <a className="reference-rewardme__button reference-rewardme__button--outline" href="#how">{t('See how it works')}</a>
          </div>
          <p className="reference-rewardme__fine">{t(isWondertown ? 'Wondertown mirrors the RewardMe experience with fictional businesses and safe test data. No real payment card is collected.' : 'Create an account with your name, email, phone and password. Membership is free.')}</p>
        </div>

        <div className="reference-rewardme__passbook" aria-label={t('Example {brand} account activity', { brand })}>
          <span className="reference-rewardme__stamp">{t(isWondertown ? 'Sandbox account' : 'Illustrative account preview')}</span>
          <div className="reference-rewardme__passbook-title"><strong>{t('My {brand} Account', { brand })}</strong><span>NO. 00482</span></div>
          <div className="reference-rewardme__entry"><span>{t('Example purchase recorded')}</span><strong>Recorded</strong></div>
          <div className="reference-rewardme__entry"><span>{t('Example reward earned')}</span><strong>Recorded</strong></div>
          <div className="reference-rewardme__entry"><span>{t('Example voucher selected')}</span><strong>Recorded</strong></div>
          <div className="reference-rewardme__entry"><span>{t('Savings unavailable')}</span><strong>{t('Planned')}</strong></div>
          <div className="reference-rewardme__balance"><span>{t('Available to redeem')}</span><strong>—</strong></div>
        </div>

        <figure className="reference-rewardme__wide-photo">
          <img src={checkoutMoment} alt={t('Member using a phone while paying at a local café')} fetchPriority="high" />
        </figure>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="how">
        <div className="reference-rewardme__section-head">
          <p className="reference-rewardme__eyebrow">{t('How it works')}</p>
          <h2>{t("Three steps. That's the whole system.")}</h2>
          <p>{t('No app gymnastics, no fine print you need a lawyer for. Just join, spend like you normally would, and watch your account fill up.')}</p>
        </div>
        <ol className="reference-rewardme__ledger-list">
          {memberSteps.map(([number, title, body]) => (
            <li key={number}><span>{number}</span><div><h3>{t(title)}</h3><p>{t(body)}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="reference-rewardme__section reference-rewardme__section--deep" id="store">
        <div className="reference-rewardme__wrap reference-rewardme__split">
          <div>
            <p className="reference-rewardme__eyebrow">{t('The store')}</p>
            <h2>{t('Your rewards are real credit — spendable in one place, made for you.')}</h2>
            <p>{t("Think of it like store credit, not cash you can spend anywhere: you earn it, then redeem it somewhere it's actually good for something — food, drink, stays, and bigger-ticket items too.")}</p>
            <div className="reference-rewardme__store-options">
              <article><h3>{t('Browse any time')}</h3><p>{t("The open store is always there — see what's available and shop it yourself, whenever you like.")}</p></article>
              <article><h3>{t('Ask a concierge')}</h3><p>{t("Our virtual assistants can find things you won't see browsing on your own — a members-only selection, found for you.")}</p></article>
            </div>
            <Link className="reference-rewardme__button reference-rewardme__button--outline" to="/shop">{t('The store')}</Link>
          </div>
          <div className="reference-rewardme__photo-grid">
            <img src={dinnerReward} alt={t('Dinner reward from a participating restaurant')} loading="lazy" />
            <img src={hotelReward} alt={t('Hotel reward from a participating property')} loading="lazy" />
            <img src={salonReward} alt={t('Salon reward from a participating business')} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="rewards">
        <div className="reference-rewardme__section-head">
          <p className="reference-rewardme__eyebrow">{t('Reward rates')}</p>
          <h2>{t('Discover the offers available to you.')}</h2>
          <p>{t("Reward rates vary by business — here's roughly what to expect.")}</p>
        </div>
        <div className="reference-rewardme__rate-grid">
          {rates.map(([value, label, body]) => <article key={label}><p>{t(label)}</p><strong>{t(value)}</strong><span>{t(body)}</span></article>)}
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="savings">
        <div className="reference-rewardme__savings"><div><p className="reference-rewardme__eyebrow">{t('Savings plan')}</p><h2>{t('Planned — not available')}</h2><p>{t('Savings is not open for deposits, locking funds or payouts. Its terms and operation remain under review.')}</p></div></div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="membership">
        <div className="reference-rewardme__section-head"><p className="reference-rewardme__eyebrow">{t('Membership')}</p><h2>{t('Free membership for everyone.')}</h2><p>{t('Everyone starts free. Regular and Gold are planned additional tiers with no paid activation available yet.')}</p></div>
        <div className="reference-rewardme__tiers">
          {plans.map(([name, title, price, body], index) => <article className={index === 1 ? 'is-featured' : ''} key={name}><span>{t(name)}</span><h3>{t(title)}</h3><strong>{t(price)}</strong><p>{t(body)}</p></article>)}
        </div>
        <Link className="reference-rewardme__button reference-rewardme__button--gold" to="/membership">{t('Explore membership')}</Link>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="business">
        <div className="reference-rewardme__business-card">
          <div><h2>{t('Own a restaurant, hotel, or shop?')}</h2><p>{t('Join the RewardMe network, put your slow hours to work, and bring in customers who are already looking for a reason to choose you.')}</p><Link className="reference-rewardme__button reference-rewardme__button--gold" to="/business">{t('See how businesses join →')}</Link></div>
          <img src={businessOwner} alt={t('Local business owner ready to welcome rewards members')} loading="lazy" />
        </div>
      </section>

      <footer className="reference-rewardme__footer">
        <div className="reference-rewardme__wrap reference-rewardme__footer-inner">
          <div><a className="reference-rewardme__logo" href="#top">{isWondertown && program.logoUrl ? <img src={program.logoUrl} alt="" aria-hidden="true" /> : <RewardMeLedgerMark />}<span className="reference-rewardme__brand-name">{brand}</span></a><p>{t(isWondertown ? 'Production-equivalent RewardMe flows with fictional test data.' : 'Earn where you already spend. Save toward what actually matters.')}</p></div>
          <nav aria-label={t('Footer navigation')}><a href="#how">{t('How it works')}</a><a href="#membership">{t('Membership')}</a><Link to="/business">{t('Businesses')}</Link>{isWondertown ? <Link to="/guide">{t('Test guide')}</Link> : null}<Link to="/terms">{t('Terms')}</Link><Link to="/privacy">{t('Privacy')}</Link><a href={`mailto:${program.supportEmail}`}>{t('Contact')}</a></nav>
        </div>
      </footer>
      </main>
    </Fragment>
  )
}
