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
  ['01', 'Join free for 3 months', 'Sign up with just an email, phone number, or a social account — no card needed. Every new member gets 3 months of full Gold-level access: the highest reward rate, every referral bonus, completely free.'],
  ['02', 'Earn as you spend', 'From day one — trial included — you earn rewards back at participating restaurants, cafés, hotels, and shops around your city, most giving back 20% or more.'],
  ['03', 'Redeem it, or save it', "Spend what you've earned in the RewardMe store any time — trial or not — or lock it into a savings plan and let it grow toward something bigger."],
] as const

const rates = [
  ['20%+', 'Everyday spots', 'Nearly every participating business gives back at least 20% — restaurants, cafés, shops, and services around your city.'],
  ['100%', 'Slow-time specials', 'Some partners give everything back during quieter hours — a great time to try somewhere new for the price of nothing.'],
  ['<20%', 'Big purchases', 'Cars, real estate, and other big-ticket items give a lower percentage back — but on a purchase that size, it still adds up to real money back.'],
] as const

const plans = [
  ['Free', 'Get a taste', '$0', '3 months of Gold, then up to 10% back forever — still eligible for the savings plan.'],
  ['Regular', 'Full rewards', '$25/mo', '3 months of Gold, then 20–100% back, plus $10 in rewards for every member you refer.'],
  ['Gold', 'Best for referrers', '$100/yr', 'Same great reward rate throughout, with the highest referral payouts on the platform.'],
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
          <p className="reference-rewardme__eyebrow">{t(isWondertown ? 'RewardMe test environment · fictional data' : '3 months free to join')}</p>
          <h1>{t('Earn amazing rewards while supporting local businesses.')}</h1>
          <p className="reference-rewardme__hero-highlight">{t("The world's highest paying rewards program — earn a minimum of")} <strong>{t('20% to 100% back')}</strong> {t('in rewards.')}</p>
          <p className="reference-rewardme__lead">{t('Earn high rewards when you spend with the local businesses we recommend — then treat yourself to something great, or save it toward something bigger.')}</p>
          <p className="reference-rewardme__lead">{t('Your rewards can be used for so many things:')}</p>
          <ul className="reference-rewardme__hero-list">
            <li>{t('Treat yourself to a night out on the town')}</li>
            <li>{t('Save toward your dream vacation')}</li>
            <li>{t('Lock it away toward a car, a home, or paying off debt')}</li>
          </ul>
          <div className="reference-rewardme__actions">
            <Link className="reference-rewardme__button reference-rewardme__button--gold" to="/join">{t('Start your free trial')}</Link>
            <a className="reference-rewardme__button reference-rewardme__button--outline" href="#how">{t('See how it works')}</a>
          </div>
          <p className="reference-rewardme__fine">{t(isWondertown ? 'Wondertown mirrors the RewardMe experience with fictional businesses and safe test data. No real payment card is collected.' : 'Join with just an email, WhatsApp, or phone number — no card required until you decide to stay.')}</p>
        </div>

        <div className="reference-rewardme__passbook" aria-label={t('Example {brand} account activity', { brand })}>
          <span className="reference-rewardme__stamp">{t(isWondertown ? 'Sandbox account' : 'Member account')}</span>
          <div className="reference-rewardme__passbook-title"><strong>{t('My {brand} Account', { brand })}</strong><span>NO. 00482</span></div>
          <div className="reference-rewardme__entry"><span>{t('Coffee run, The Daily Grind — $5 spent, 20% back')}</span><strong>+ $1</strong></div>
          <div className="reference-rewardme__entry"><span>{t('Dinner out, Harvest & Vine — $60 spent, 100% back')}</span><strong>+ $60</strong></div>
          <div className="reference-rewardme__entry"><span>{t('Weekend stay, The Wayfarer Inn — $240 spent, 20% back')}</span><strong>+ $48</strong></div>
          <div className="reference-rewardme__entry"><span>{t('Moved to savings plan')}</span><strong>{t('→ locked')}</strong></div>
          <div className="reference-rewardme__balance"><span>{t('Available to redeem')}</span><strong>$109</strong></div>
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
          <h2>{t('Most places, 20% or more back. Some days, all of it.')}</h2>
          <p>{t("Reward rates vary by business — here's roughly what to expect.")}</p>
        </div>
        <div className="reference-rewardme__rate-grid">
          {rates.map(([value, label, body]) => <article key={label}><p>{t(label)}</p><strong>{t(value)}</strong><span>{t(body)}</span></article>)}
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="savings">
        <div className="reference-rewardme__savings">
          <div><p className="reference-rewardme__eyebrow">{t('Savings plan')}</p><h2>{t("Save it. Don't spend it. Watch it grow.")}</h2><p>{t("Lock away any amount, any time — rewards, cash, whatever you're setting aside — for a full year, growing toward a car, a home, or paying off a credit card. As a bonus: put your membership fee into savings, and we'll double it back at year's end.")}</p></div>
          <div className="reference-rewardme__balance-card"><span>{t('12-month lock')}</span><strong>$100 → $200</strong><p>{t("Double back at year end. Monthly members get a bonus 13th-month payout instead. This bonus applies to your membership fee — general savings just grow safely, ready when you need them.")}</p></div>
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="membership">
        <div className="reference-rewardme__section-head"><p className="reference-rewardme__eyebrow">{t('Membership')}</p><h2>{t('Try it free for 3 months.')}</h2><p>{t('Every new member starts with a free 3-month trial of our top-tier Gold rewards — the highest reward rate, no charge, no card required until you decide to stay.')}</p></div>
        <div className="reference-rewardme__tiers">
          {plans.map(([name, title, price, body], index) => <article className={index === 1 ? 'is-featured' : ''} key={name}><span>{t(name)}</span><h3>{t(title)}</h3><strong>{t(price)}</strong><p>{t(body)}</p></article>)}
        </div>
        <Link className="reference-rewardme__button reference-rewardme__button--gold" to="/membership">{t('Compare plans & start free trial')}</Link>
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
