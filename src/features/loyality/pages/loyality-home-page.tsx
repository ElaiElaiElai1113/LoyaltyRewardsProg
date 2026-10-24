import { useEffect, useRef, useState } from 'react'
import { Menu, X, Layers, Users, RotateCcw, ScanLine } from 'lucide-react'
import { Link } from 'react-router'

import { useLanguage } from '@/lib/language'
import { loyalityHomeSpanish } from './loyality-home-copy'

import './loyality-home-page.css'

const pillarCards = [
  ['Acquisition', 'Trackable referrals', "Every promotion becomes trackable. Give a new customer an incentive via a QR code, and see exactly where each redemption came from — no guesswork on what's working."],
  ['Retention', 'Visit-based rewards', 'Reward customers automatically on their 2nd or 3rd visit, or run a classic punch-card model. Retention raises both spend and repeat-visit rate.'],
  ['Simplicity', 'No POS integration needed', "Staff scan a QR code and see the customer's balance. No new hardware, no complicated setup — it works alongside whatever you already use."],
]

const benefits = [
  ['For Your Customers', 'Feels like your program', 'Your branding, your name, your look — customers never see "Loyality," they see a loyalty program built by you, for them.'],
  ['For Your Business', 'Runs itself in the background', "Once it's set up, the acquisition and retention mechanics run automatically. You focus on the business, not the software."],
]

const pillarIcons = [Users, RotateCcw, ScanLine]

function useHomeLanguage() {
  const { language, t } = useLanguage()
  return { t: (text: string) => language === 'es' ? loyalityHomeSpanish[text] ?? t(text) : t(text) }
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { t } = useHomeLanguage()
  return <div className="reference-loyality__section-head"><div className="reference-loyality__eyebrow">{t(eyebrow)}</div><h2>{t(title)}</h2></div>
}

export function LoyalityHomePage() {
  const { t } = useHomeLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const updateSection = () => {
      const sections = ['pillars', 'pricing', 'contact']
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      const current = atBottom ? 'contact' : sections.filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 130).at(-1)
      setActiveSection(current ?? '')
    }
    window.addEventListener('scroll', updateSection, { passive: true })
    updateSection()
    return () => window.removeEventListener('scroll', updateSection)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileMenuOpen(false); menuButtonRef.current?.focus() }
    }
    const outside = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setMobileMenuOpen(false) }
    const desktop = window.matchMedia('(min-width: 961px)')
    const resize = () => { if (desktop.matches) setMobileMenuOpen(false) }
    document.addEventListener('pointerdown', outside)
    desktop.addEventListener('change', resize)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', outside)
      desktop.removeEventListener('change', resize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="reference-loyality">
      <header className="reference-loyality__header" ref={headerRef}>
        <nav className="reference-loyality__nav" aria-label={t('Loyality navigation')}>
          <a className="reference-loyality__logo" href="#top"><img src="/loyality-client-logo.webp" alt="Loyality" width="280" height="140" /></a>
          <div className="reference-loyality__nav-links">
            <a href="#how" aria-current={activeSection === 'pillars' ? 'location' : undefined}>{t('Product')}</a>
            <a href="#pricing" aria-current={activeSection === 'pricing' ? 'location' : undefined}>{t('Pricing')}</a>
            <a href="#contact" aria-current={activeSection === 'contact' ? 'location' : undefined}>{t('Contact')}</a>
          </div>
          <div className="reference-loyality__nav-actions"><Link className="reference-loyality__sign-in" to="/signin">{t('Sign in')}</Link><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('See a Demo')}</Link></div>
          <button ref={menuButtonRef} className="reference-loyality__menu-toggle" type="button" aria-label={t(mobileMenuOpen ? 'Close navigation' : 'Open navigation')} aria-controls="loyality-mobile-navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}>{mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
        </nav>
        <nav id="loyality-mobile-navigation" className={`reference-loyality__mobile-menu${mobileMenuOpen ? ' is-open' : ''}`} aria-label={t('Loyality mobile navigation')} hidden={!mobileMenuOpen}>
          <a href="#how" aria-current={activeSection === 'pillars' ? 'location' : undefined} onClick={closeMobileMenu}>{t('Product')}</a>
          <a href="#pricing" aria-current={activeSection === 'pricing' ? 'location' : undefined} onClick={closeMobileMenu}>{t('Pricing')}</a>
          <a href="#contact" aria-current={activeSection === 'contact' ? 'location' : undefined} onClick={closeMobileMenu}>{t('Contact')}</a>
          <Link to="/business" onClick={closeMobileMenu}>{t('Businesses')}</Link>
          <div className="reference-loyality__mobile-actions"><Link className="reference-loyality__btn reference-loyality__btn--outline" to="/signin" onClick={closeMobileMenu}>{t('Sign in')}</Link><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business" onClick={closeMobileMenu}>{t('See a Demo')}</Link></div>
        </nav>
      </header>

      <main id="top">
        <div className="reference-loyality__wrap v2-hero">
          <section className="reference-loyality__hero">
            <div className="reference-loyality__eyebrow">{t('Your Own Branded Loyalty Program')}</div>
            <h1>{t('Your loyalty card, reimagined.')}</h1>
            <p className="reference-loyality__lead">{t('A white-label, QR-based loyalty platform that runs under your own brand. Customers scan, earn, and redeem — you focus on running your business.')}</p>
            <div className="reference-loyality__hero-ctas"><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('See a Demo')}</Link><a className="reference-loyality__btn reference-loyality__btn--outline" href="#how">{t('How it works')}</a></div>
          </section>
          <div className="v2-product-visual">
            <figure className="reference-loyality__photo v2-hero-photo">
              <img src="/loyality-member-scan.jpg" alt={t('A customer scanning a QR code at an independent café counter with their phone')} width="3600" height="1200" loading="eager" />
            </figure>
            <div className="reference-loyality__card restored-demo-card" aria-label="Harvest & Vine loyalty card example">
              <span className="restored-anchor" id="ledger" /><span className="restored-anchor" id="example" />
              <span className="restored-demo-tag">{t('Powered by Loyality')}</span>
              <h2>{t('Harvest & Vine')}</h2><p className="restored-demo-sub">{t('Neighborhood wine bar & kitchen')}</p>
              <div className="restored-qr-row"><div className="restored-qr" aria-hidden="true" /><p>{t('Scan at checkout to earn points automatically — no app download required for the customer.')}</p></div>
              <div className="restored-progress"><strong>{t('3 visits to next reward')}</strong><p>{t('Almost there — one more visit unlocks it')}</p><div className="restored-progress-bar" aria-hidden="true"><span /></div></div>
            </div>
            <div className="v2-glyph" aria-hidden="true"><Layers /></div>
          </div>
        </div>

        <section className="reference-loyality__wrap" id="pillars">
          <span className="restored-anchor" id="how" /><span className="restored-anchor" id="concept" />
          <SectionHeading eyebrow="Two Core Pillars" title="Built to bring customers in, and keep them coming back." />
          <div className="reference-loyality__card-grid">{pillarCards.map(([label, title, copy], index) => {
            const Icon = pillarIcons[index]
            return <article className="reference-loyality__card" key={title}><div className="v2-glyph" aria-hidden="true"><Icon /></div><span>{t(label)}</span><h3>{t(title)}</h3><p>{t(copy)}</p></article>
          })}</div>
        </section>

        <section className="restored-white-label" id="pricing">
          <span className="restored-anchor" id="support" /><span className="restored-anchor" id="features" /><span className="restored-anchor" id="guarantee" />
          <div className="reference-loyality__wrap">
            <SectionHeading eyebrow="Why It Works" title="White-label means it's yours, not ours." />
            <div className="restored-benefits-layout">
              <figure className="reference-loyality__photo restored-benefit-photo"><img src="/loyality-owner-dashboard.jpg" alt={t('An independent business owner reviewing member activity on a phone')} width="3600" height="1195" loading="lazy" /></figure>
              <div className="restored-benefits">{benefits.map(([label, title, copy]) => <article className="reference-loyality__compare-card" key={title}><span>{t(label)}</span><h3>{t(title)}</h3><p>{t(copy)}</p></article>)}</div>
            </div>
          </div>
        </section>

        <section className="reference-loyality__final-cta reference-loyality__wrap" id="demo"><h2>{t('See it running for a business like yours.')}</h2><p>{t("We'll walk you through a live demo built around your business type — no commitment required.")}</p><Link className="reference-loyality__btn reference-loyality__btn--gold" to="/business">{t('Request a Demo')}</Link></section>
      </main>

      <footer className="reference-loyality__footer" id="contact">
        <div className="reference-loyality__wrap reference-loyality__footer-wrap">
          <div><a className="reference-loyality__logo" href="#top"><img src="/loyality-client-logo.webp" alt="Loyality" width="280" height="140" loading="lazy" /></a><p>{t('Your loyalty card, reimagined.')}</p></div>
          <nav aria-label={t('Footer navigation')}><a href="#how">{t('Product')}</a><a href="#pricing">{t('Why It Works')}</a><Link to="/business">{t('Contact')}</Link><Link to="/signin">{t('Sign in')}</Link></nav>
        </div>
        <p className="reference-loyality__wrap restored-copyright">{t('© Loyality. A white-label loyalty platform for independent businesses.')}</p>
      </footer>
    </div>
  )
}
