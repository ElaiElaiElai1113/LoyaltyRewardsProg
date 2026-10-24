import { Link } from 'react-router'

import businessOwner from '@/assets/business/local-business-owner-wide.webp'
import hotelReward from '@/assets/business/hotel-partner.webp'
import checkoutMoment from '@/assets/landing/coffee-member-wide.webp'
import dinnerReward from '@/assets/landing/dinner-rewards.webp'
import salonReward from '@/assets/landing/salon-rewards.webp'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { RewardMeLedgerMark, RewardMePublicHeader } from '@/features/home/components/rewardme-public-header'
import { translateRewardMeReference } from './rewardme-reference-copy'

const steps = [
  ['1', 'Join free', 'Sign up in under a minute. No subscription, no card fees — RewardMe never costs you anything to use.'],
  ['2', 'Spend like normal', "Show your RewardMe code at checkout at any participating local business. That's the whole step."],
  ['3', 'Redeem rewards', 'Points stack up automatically. Redeem for free items, discounts, or perks at any business in the network.'],
] as const

const benefits = [
  ['🔥', 'Streak bonuses', 'Keep your visit streak alive and unlock bonus points the longer it runs.'],
  ['★', 'Real local rewards', 'Free coffee, discounts, appetizers — rewards from the independent businesses you already visit.'],
  ['◎', 'Growing network', "New cafés, boutiques, and studios join every month, so there's always somewhere new to earn."],
] as const

// The account shown in the supplied PDF is a static marketing illustration.
// It is deliberately independent of live balances, offers and reward logic.
export function RewardMeReferenceHomePage() {
  const { program } = useTenant()
  const { t: translate, language } = useLanguage()
  const t = (text: string) => translateRewardMeReference(text, language, translate)
  return <>
    <RewardMePublicHeader />
    <main className="reference-rewardme restored-rewardme" id="top" data-rewardme-editorial-home data-rewardme-reference-home>
      <section className="reference-rewardme__hero reference-rewardme__wrap">
        <div className="reference-rewardme__hero-title">
          <p className="reference-rewardme__eyebrow">{t('Free to Join')}</p>
          <h1>{t('Get rewarded for spending where you already love.')}</h1>
          <p className="reference-rewardme__lead">{t('Earn real rewards every time you visit your favorite local cafés, boutiques, and studios. No cost to join, no catch — just points that turn into things you actually want.')}</p>
        </div>
        <figure className="reference-rewardme__wide-photo"><img src={checkoutMoment} alt={t('Member using a phone while paying at a local café')} fetchPriority="high" /></figure>
        <div className="reference-rewardme__actions">
          <Link className="reference-rewardme__button" to="/join">{t('Join Free')}</Link>
          <a className="reference-rewardme__button reference-rewardme__button--outline" href="#how">{t('See how it works')}</a>
        </div>
      </section>

      <section className="reference-rewardme__discovery reference-rewardme__wrap restored-rewardme__preview" id="store">
        <aside className="reference-rewardme__passbook restored-rewardme__account" aria-label={translate('Example {brand} account activity', { brand: program.name })}>
          <div className="restored-rewardme__time">9:41</div>
          <p className="restored-rewardme__greeting">{t('Good evening,')}</p>
          <h2>Maria</h2>
          <div className="restored-rewardme__balance">
            <p>{t('YOUR BALANCE')}</p><strong>2,340 PTS</strong><span>{t('Worth ~$23.40 in rewards')}</span>
          </div>
          <div className="restored-rewardme__streak"><strong><span aria-hidden="true">🔥</span> {t('4-week streak')}</strong><p>{t('Visit once more this week to keep it')}</p></div>
          <h3 className="restored-rewardme__nearby"><Link to="/shop">{t('Nearby Rewards')}</Link></h3>
          <ul className="restored-rewardme__rewards">
            <li><span className="restored-rewardme__dot" aria-hidden="true" /><div><strong>Casa Verde Café</strong><p>{t('150 pts — Free coffee')}</p></div></li>
            <li><span className="restored-rewardme__dot" aria-hidden="true" /><div><strong>Luna Boutique</strong><p>{t('300 pts — 15% off')}</p></div></li>
            <li><span className="restored-rewardme__dot" aria-hidden="true" /><div><strong>Sal y Mar</strong><p>{t('500 pts — Free appetizer')}</p></div></li>
          </ul>
        </aside>
        <div className="reference-rewardme__photo-grid" aria-hidden="true">
          <img src={dinnerReward} alt="" loading="lazy" /><img src={hotelReward} alt="" loading="lazy" /><img src={salonReward} alt="" loading="lazy" />
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="how">
        <div className="reference-rewardme__section-head"><p className="reference-rewardme__eyebrow">{t('How It Works')}</p><h2>{t('Three steps. Zero cost.')}</h2></div>
        <ol className="reference-rewardme__ledger-list">
          {steps.map(([number, title, body]) => <li key={number}><span>{number}</span><div><h3>{t(title)}</h3><p>{t(body)}</p></div></li>)}
        </ol>
      </section>

      <section className="reference-rewardme__section reference-rewardme__section--deep" id="rewards">
        <div className="reference-rewardme__wrap">
          <div className="reference-rewardme__section-head"><p className="reference-rewardme__eyebrow">{t('Why Members Stay')}</p><h2>{t('Built to feel like a win, every visit.')}</h2></div>
          <div className="restored-rewardme__benefits">
            {benefits.map(([icon, title, body]) => <article key={title}><span className="restored-rewardme__benefit-icon" aria-hidden="true">{icon}</span><h3>{t(title)}</h3><p>{t(body)}</p></article>)}
          </div>
        </div>
      </section>

      <section className="reference-rewardme__section reference-rewardme__wrap" id="join">
        <span id="savings" className="restored-rewardme__anchor" aria-hidden="true" /><span id="membership" className="restored-rewardme__anchor" aria-hidden="true" />
        <div className="reference-rewardme__business-card restored-rewardme__closing">
          <div><h2>{t('Free to join. Easy to love.')}</h2><p>{t('Start earning rewards at the local spots you already visit.')}</p><Link className="reference-rewardme__button" to="/join">{t('Join RewardMe Free')}</Link></div>
          <img src={businessOwner} alt={t('Local business owner ready to welcome rewards members')} loading="lazy" />
        </div>
      </section>

      <footer className="reference-rewardme__footer" id="business">
        <div className="reference-rewardme__wrap reference-rewardme__footer-inner">
          <div><a className="reference-rewardme__logo" href="#top" aria-label={translate('{brand} homepage', { brand: program.name })}><RewardMeLedgerMark /><span className="reference-rewardme__brand-name">REWARDME</span></a><p>{t('Rewards for spending where you already love.')}</p></div>
          <nav aria-label={t('Footer navigation')}><a href="#how">{t('How It Works')}</a><Link to="/business">{t('For Business')}</Link><a href={`mailto:${program.supportEmail}`}>{t('Contact')}</a></nav>
        </div>
        <div className="reference-rewardme__wrap restored-rewardme__copyright">{t('© RewardMe. Free for members, always.')}</div>
      </footer>
    </main>
  </>
}
