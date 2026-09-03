import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router'

import { LanguagePicker } from '@/components/language-picker'
import { LoyalityMark } from '@/features/loyality/components/loyality-mark'
import { useLanguage } from '@/lib/language'

import './loyality-home-page.css'

const ledgerRows = [
  ['LOY-204', 'New member joined — referred by an existing member', 'Referral bonus', '+1 member'],
  ['LOY-205', 'Member hit their 10th-visit milestone — reward issued automatically', 'Milestone', 'Auto'],
  ['LOY-206', 'Member redeemed points for a free item', 'Loyalty reward', '−40 pts'],
  ['LOY-207', 'Member upgraded from free to paid tier', 'Upgrade', '+1 tier'],
]

const incentiveCards = [
  ['Loyalty rewards', 'Points or free items', 'Reward every visit or purchase however you like — points toward a redemption, or a free item after so many visits.'],
  ['Milestones', 'Celebrate the moments that matter', "A 10th visit, a one-year anniversary, a spend threshold — or something as simple as a free item on a member's birthday. Set the milestone and the reward, and the platform delivers it for you."],
  ['Referral bonuses', 'Reward members for bringing friends', 'When a member refers a friend who joins and redeems, both sides get rewarded — automatically, from the first share to the final redemption.'],
]

const supportCards = [
  ['Strategy', 'We help you decide what to offer', 'Not sure whether points, milestones, or referral bonuses fit your business best? We look at what you sell and who buys it, and suggest the incentives most likely to actually grow your business.'],
  ['Management', 'We run the system, day to day', "Once it's live, you're not the one maintaining it. We handle the technical side and keep the membership running smoothly — so growing your business doesn't mean adding another job to your plate."],
]

const pillarCards = [
  ['Attraction', 'Get new eyes on your business', 'Members share your referral offers through social media, word of mouth, or a simple invite — and every channel is trackable.'],
  ['Acquisition', 'Turn interest into members', 'A single QR scan is the entire sign-up. No app download, no account setup — nothing stands between a passerby and becoming a member.'],
  ['Retention', 'Give them a reason to return', 'Loyalty rewards, milestones, and referral perks keep the next visit worth coming back for — instead of leaving it to chance.'],
]

const steps = [
  ['01 / Launch', 'Set up your branded membership', 'Your name, your look, your rules. Loyality runs underneath it — members never see anything but your brand.'],
  ['02 / Invite', 'Customers join as members with one scan', 'A QR code on the counter, receipt, or menu is the entire sign-up. No app to install, no card to carry.'],
  ['03 / Set incentives', 'Choose your loyalty rewards, milestones, and referral bonuses', "Run one, run all three, or design your own combination — it's your membership to shape."],
  ['04 / Reward', 'The platform tracks and rewards automatically', "Every visit, milestone, and referral is tracked end to end. When a member earns something, it's issued automatically — no manual tally-keeping."],
]

const features = [
  ['Membership tiers', 'Free and paid tiers, your call', "Build a free tier for everyone, and an optional paid tier on top — say, a monthly fee that includes spendable credit plus extra perks free members don't get. Fully customizable to your business."],
  ['No hardware', 'Nothing to install, nothing to carry', 'No card, no key tag, no app to download. Everything runs on QR codes your members already know how to use.'],
  ['Tracking', 'Every incentive, in one place', 'Loyalty rewards, milestones, and referral bonuses all show up in a single dashboard — no spreadsheets, no manual tally-keeping.'],
  ['Redemption', "One scan and it's done", 'Free item, gift card, or voucher — redeeming is as simple as it gets. The member pulls up their QR code, your staff scans it, and the reward is applied. No codes to read out, nothing to check manually.'],
  ['Full control', 'You decide the reward level, any time', "Give back 10%, 100%, or anything in between — it's entirely up to you, and you can change it whenever you want. Dial it up during a slow stretch to bring members in, then bring it back down once things pick up."],
]

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  const { t } = useLanguage()
  return <div className="reference-loyality__section-head"><div className="reference-loyality__eyebrow">{t(eyebrow)}</div><h2>{t(title)}</h2>{children}</div>
}

function Cards({ items }: { items: string[][] }) {
  const { t } = useLanguage()
  return <div className="reference-loyality__card-grid">{items.map(([label, title, copy]) => <article className="reference-loyality__card" key={title}><span>{t(label)}</span><h3>{t(title)}</h3><p>{t(copy)}</p></article>)}</div>
}

export function LoyalityHomePage() {
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="reference-loyality">
      <header className="reference-loyality__header">
        <nav className="reference-loyality__nav" aria-label={t('Loyality navigation')}>
          <a className="reference-loyality__logo" href="#top"><LoyalityMark />Loyality</a>
          <div className="reference-loyality__nav-links"><a href="#concept">{t('The concept')}</a><a href="#how">{t('How it works')}</a><a href="#guarantee">{t('Guarantee')}</a></div>
          <div className="reference-loyality__nav-actions"><LanguagePicker className="reference-loyality__language" compact condenseOnNarrowScreens /><Link className="reference-loyality__sign-in" to="/signin">{t('Sign in')}</Link><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('Get started')}</Link></div>
          <button className="reference-loyality__menu-toggle" type="button" aria-label={t(mobileMenuOpen ? 'Close navigation' : 'Open navigation')} aria-controls="loyality-mobile-navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}>{mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
        </nav>
        <nav id="loyality-mobile-navigation" className={`reference-loyality__mobile-menu${mobileMenuOpen ? ' is-open' : ''}`} aria-label={t('Loyality mobile navigation')} hidden={!mobileMenuOpen}>
          <a href="#concept" onClick={closeMobileMenu}>{t('The concept')}</a>
          <a href="#how" onClick={closeMobileMenu}>{t('How it works')}</a>
          <a href="#guarantee" onClick={closeMobileMenu}>{t('Guarantee')}</a>
          <Link to="/business" onClick={closeMobileMenu}>{t('Businesses')}</Link>
          <div className="reference-loyality__mobile-actions"><Link className="reference-loyality__btn reference-loyality__btn--outline" to="/signin" onClick={closeMobileMenu}>{t('Sign in')}</Link><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business" onClick={closeMobileMenu}>{t('Get started')}</Link></div>
        </nav>
      </header>

      <main id="top">
        <div className="reference-loyality__wrap">
          <section className="reference-loyality__hero">
            <div className="reference-loyality__eyebrow">{t('White-label membership platform · Any business, any industry')}</div>
            <h1>{t('Turn your customers into members.')}</h1>
            <p className="reference-loyality__lead">{t('Loyality lets any business build a fully-branded membership program and hand out whatever incentives they want — loyalty rewards, milestone bonuses, referral perks, all of it, or just one — running on nothing but a QR code.')}</p>
            <div className="reference-loyality__hero-ctas"><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('Get started')}</Link><a className="reference-loyality__btn reference-loyality__btn--outline" href="#concept">{t('See the concept')}</a></div>
            <p className="reference-loyality__hero-note">{t('Works for any business, in any industry, anywhere.')}</p>
          </section>
          <div className="reference-loyality__highlight" aria-label={t('Loyality platform highlights')}>
            <div className="reference-loyality__stat"><strong>0</strong><span>{t('Hardware or apps required')}</span></div>
            <div className="reference-loyality__stat"><strong>100%</strong><span>{t('Branded under your name')}</span></div>
            <div className="reference-loyality__stat"><strong>20%</strong><span>{t('Min. profit lift, guaranteed')}</span></div>
          </div>
        </div>

        <section className="reference-loyality__wrap" id="ledger">
          <div className="reference-loyality__ledger">
            <div className="reference-loyality__ledger-head"><span><i aria-hidden="true" />{t('Sample membership activity — one business')}</span><span>{t('Every incentive tracked automatically')}</span></div>
            <div>{ledgerRows.map(([id, description, type, amount]) => <div className="reference-loyality__ledger-row" key={id}><span className="reference-loyality__ledger-id">{id}</span><span className="reference-loyality__ledger-desc">{t(description)}</span><span className="reference-loyality__ledger-type">{t(type)}</span><strong>{t(amount)}</strong></div>)}</div>
            <div className="reference-loyality__ledger-foot"><span>{t('No manual tally-keeping — the platform runs the loop.')}</span><strong>{t('100% trackable')}</strong></div>
          </div>
        </section>

        <section className="reference-loyality__wrap" id="concept">
          <SectionHeading eyebrow="The concept" title="One membership. Any incentive you want."><p>{t("Loyality isn't a single reward type — it's a membership you build for your own customers, then decide exactly what being a member is worth.")}</p></SectionHeading>
          <Cards items={incentiveCards} />
          <div className="reference-loyality__flex-note"><strong>{t('Mix and match, or run just one.')}</strong> {t("It's your membership — combine loyalty rewards, milestones, and referral bonuses however you want, and change the rules any time.")}</div>
        </section>

        <section className="reference-loyality__wrap" id="support">
          <SectionHeading eyebrow="More than software" title="A partner that runs it with you — not a tool you're left to figure out."><p>{t("Loyality isn't something you're handed and left alone with. We work with you on both ends of it.")}</p></SectionHeading>
          <div className="reference-loyality__support-grid">{supportCards.map(([label, title, copy]) => <article className="reference-loyality__card" key={title}><span>{t(label)}</span><h3>{t(title)}</h3><p>{t(copy)}</p></article>)}</div>
        </section>

        <figure className="reference-loyality__photo reference-loyality__wrap">
          <img src="/loyality-member-scan.jpg" alt={t('A customer scanning a QR code at an independent café counter with their phone')} width="3600" height="1200" loading="lazy" />
          <figcaption><span>{t('One scan, no hardware')}</span><p>{t('A customer scanning a QR code at the counter on their own phone — the moment they become a member.')}</p></figcaption>
        </figure>

        <section className="reference-loyality__wrap" id="pillars">
          <SectionHeading eyebrow="Why it works" title="A membership does three jobs at once."><p>{t('Once your customers are members, the same program pulls three different levers for your business.')}</p></SectionHeading>
          <Cards items={pillarCards} />
        </section>

        <section className="reference-loyality__wrap" id="how">
          <SectionHeading eyebrow="How it works" title="Four steps, fully automated after launch."><p>{t('You set the rules once. The platform runs the membership every time after that.')}</p></SectionHeading>
          <div className="reference-loyality__steps">{steps.map(([number, title, copy]) => <article key={number}><span>{t(number)}</span><h3>{t(title)}</h3><p>{t(copy)}</p></article>)}</div>
        </section>

        <section className="reference-loyality__wrap" id="features">
          <SectionHeading eyebrow="Features" title="Everything a loyalty app does. Plus what most of them don't." />
          <div className="reference-loyality__features">{features.map(([label, title, copy]) => <article key={label}><span>{t(label)}</span><div><h3>{t(title)}</h3><p>{t(copy)}</p></div></article>)}</div>
        </section>

        <section className="reference-loyality__wrap">
          <SectionHeading eyebrow="Why it's different" title="Built to run under your name, not someone else's." />
          <div className="reference-loyality__compare">
            <article className="reference-loyality__compare-card"><span>{t('Many marketing & delivery platforms')}</span><h3>{t('Take a cut of every sale')}</h3><p>{t('Many third-party marketing and delivery platforms charge steep commissions on every transaction — and still push discounts on top, eating further into your margin.')}</p></article>
            <article className="reference-loyality__compare-card reference-loyality__compare-card--new"><span>Loyality</span><h3>{t("A membership that's actually yours")}</h3><p>{t('Build the exact membership you want — every incentive, every rule — and keep it running under your own brand and your own margin.')}</p></article>
          </div>
        </section>

        <section className="reference-loyality__wrap" id="guarantee">
          <div className="reference-loyality__guarantee">
             <div><span className="reference-loyality__stamp">{t('Grand slam offer')}</span><h2>{t("We're confident enough to put it in writing.")}</h2><p>{t("Follow the plan and don't see a minimum 20% profit increase within 3 months? You get extra months free until you do — and a straightforward money-back guarantee sits underneath that, no fine print.")}</p></div>
            <div className="reference-loyality__guarantee-cards"><div><span>{t('Profit guarantee')}</span><strong>{t('20% or extra months free')}</strong></div><div><span>{t('Satisfaction guarantee')}</span><strong>{t('Money back')}</strong></div></div>
          </div>
        </section>

        <section className="reference-loyality__wrap" id="example">
          <SectionHeading eyebrow="Your membership, your rules" title="What a membership tier could look like."><p>{t("You design the tiers and the incentives. Here's one simple way businesses commonly structure them.")}</p></SectionHeading>
          <div className="reference-loyality__plans">
            <article className="reference-loyality__plan"><span>{t('Free tier')}</span><h3>{t('Open to everyone')}</h3><strong>$0</strong><small>{t('No cost to join')}</small><ul><li>{t('One-scan sign-up, no app required')}</li><li>{t('Earns loyalty rewards on every visit')}</li><li>{t('Eligible for milestones and referral bonuses')}</li></ul></article>
            <article className="reference-loyality__plan reference-loyality__plan--featured"><span>{t('Paid tier')}</span><h3>{t('Example tier')}</h3><strong>$10<small>{t('/mo')}</small></strong><small>{t('Illustrative — set your own price')}</small><ul><li>{t('$10 of spendable credit included — net-neutral cost')}</li><li>{t('Bonus perks and faster milestone rewards')}</li><li>{t('Priority access to member-only promos')}</li></ul></article>
          </div>
          <p className="reference-loyality__example-flag">{t('Illustrative example only — every business sets its own tiers, incentives, and pricing.')}</p>
        </section>

        <figure className="reference-loyality__photo reference-loyality__wrap">
          <img src="/loyality-owner-dashboard.jpg" alt={t('An independent business owner reviewing member activity on a phone')} width="3600" height="1195" loading="lazy" />
          <figcaption><span>{t('Everything, at a glance')}</span><p>{t('A business owner checking member activity on a simple phone dashboard — no extra software to learn.')}</p></figcaption>
        </figure>

        <section className="reference-loyality__wrap" id="pricing">
          <SectionHeading eyebrow="Getting started" title="Onboarding, made simple." />
          <div className="reference-loyality__pricing-box"><div><h3>{t('Get a membership built for your business.')}</h3><p>{t("No two memberships are priced the same, because no two businesses are the same. Tell us about your business and we'll put together an onboarding plan — backed by the profit and satisfaction guarantee above.")}</p></div><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('Get started')}</Link></div>
        </section>

        <section className="reference-loyality__final-cta reference-loyality__wrap"><h2>{t('Ready to turn your customers into members?')}</h2><p>{t("Tell us about your business and we'll show you what your branded membership could look like.")}</p><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('Get started')}</Link></section>
      </main>

      <footer className="reference-loyality__footer">
        <div className="reference-loyality__wrap reference-loyality__footer-wrap">
          <div><a className="reference-loyality__logo" href="#top"><LoyalityMark size={20} />Loyality</a><p>{t('Turn your customers into members. A white-label membership platform for any business, anywhere.')}</p></div>
          <nav aria-label={t('Footer navigation')}><a href="#concept">{t('The concept')}</a><a href="#how">{t('How it works')}</a><a href="#guarantee">{t('Guarantee')}</a><Link to="/business">{t('Get started')}</Link><Link to="/signin">{t('Sign in')}</Link></nav>
        </div>
      </footer>
    </div>
  )
}
