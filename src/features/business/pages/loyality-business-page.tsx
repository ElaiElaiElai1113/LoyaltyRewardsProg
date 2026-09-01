import { ArrowRight, BarChart3, Check, QrCode, Repeat2, Store } from 'lucide-react'
import { Link } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'

import './loyality-business-page.css'

const benefits = [
  {
    icon: QrCode,
    label: 'Simple at checkout',
    title: 'One scan records the visit.',
    body: 'Staff scan the customer QR, confirm the visit, and immediately see what the customer can use next.',
  },
  {
    icon: Repeat2,
    label: 'Retention built in',
    title: 'Bring the right customers back.',
    body: 'Set visit milestones, vouchers, and private offers around the behavior that matters to your business.',
  },
  {
    icon: BarChart3,
    label: 'Clear attribution',
    title: 'Know which promotion worked.',
    body: 'Track referrals and redemptions from the first shared link through the resulting customer visit.',
  },
] as const

export function LoyalityBusinessPage() {
  const { program } = useTenant()
  const { t } = useLanguage()
  const demoHref = `mailto:${program.supportEmail}?subject=${encodeURIComponent(t('Loyality business demo request'))}`

  return (
    <div className="loyality-business">
      <section className="loyality-business__hero" aria-labelledby="loyality-business-title">
        <div className="loyality-business__wrap loyality-business__hero-grid">
          <div>
            <p className="loyality-business__eyebrow">{t('Your brand. Your customers. Your rules.')}</p>
            <h1 id="loyality-business-title">{t('A loyalty program that feels like your business.')}</h1>
            <p className="loyality-business__lead">{t('Loyality gives one independent business a branded QR program for referrals, repeat visits, vouchers, and private offers—without joining a public marketplace.')}</p>
            <div className="loyality-business__actions">
              <a className="loyality-business__button" href={demoHref}>{t('Request a demo')} <ArrowRight aria-hidden="true" /></a>
              <Link className="loyality-business__button loyality-business__button--secondary" to="/signin?portal=business">{t('Business sign in')}</Link>
            </div>
          </div>

          <div className="loyality-business__program-card" aria-label={t('Example branded loyalty program')}>
            <div className="loyality-business__program-head"><span>{t('Example business')}</span><strong>Harvest &amp; Vine</strong><small>{t('Private customer loyalty')}</small></div>
            <div className="loyality-business__program-rule"><span>{t('Visit reward')}</span><strong>{t('4 visits')}</strong><p>{t('Unlock a house reward on the next eligible visit.')}</p></div>
            <div className="loyality-business__program-rule"><span>{t('Referral offer')}</span><strong>{t('New guest voucher')}</strong><p>{t('Track the shared link through first redemption.')}</p></div>
            <div className="loyality-business__program-foot"><Check aria-hidden="true" /> {t('Branded for the business, powered privately by Loyality')}</div>
          </div>
        </div>
      </section>

      <section className="loyality-business__section" id="benefits" aria-labelledby="loyality-benefits-title">
        <div className="loyality-business__wrap">
          <p className="loyality-business__eyebrow">{t('Built for everyday operations')}</p>
          <h2 id="loyality-benefits-title">{t('Acquire, retain, and understand customers in one flow.')}</h2>
          <div className="loyality-business__benefits">
            {benefits.map(({ icon: Icon, label, title, body }) => <article key={title}><Icon aria-hidden="true" /><span>{t(label)}</span><h3>{t(title)}</h3><p>{t(body)}</p></article>)}
          </div>
        </div>
      </section>

      <section className="loyality-business__section loyality-business__section--steps" id="how-it-works" aria-labelledby="loyality-steps-title">
        <div className="loyality-business__wrap loyality-business__steps-grid">
          <div><p className="loyality-business__eyebrow">{t('A focused setup')}</p><h2 id="loyality-steps-title">{t('Launch the program your business actually needs.')}</h2><p>{t('There is no public partner network and no commission calculator. The program is configured for one business and its own customers.')}</p></div>
          <ol>
            <li><span>01</span><div><h3>{t('Define your rules')}</h3><p>{t('Choose visit milestones, vouchers, referral incentives, and any private offers.')}</p></div></li>
            <li><span>02</span><div><h3>{t('Apply your brand')}</h3><p>{t('Set the customer-facing name, colors, and business identity before launch.')}</p></div></li>
            <li><span>03</span><div><h3>{t('Invite and measure')}</h3><p>{t('Share the QR or referral link, serve customers, and review every resulting visit.')}</p></div></li>
          </ol>
        </div>
      </section>

      <section className="loyality-business__cta" id="get-started" aria-labelledby="loyality-business-cta">
        <div className="loyality-business__wrap">
          <Store aria-hidden="true" />
          <div><p className="loyality-business__eyebrow">{t('See your own program')}</p><h2 id="loyality-business-cta">{t('Start with a demo built around your business.')}</h2><p>{t('We will map the program to your customer journey before any launch decision.')}</p></div>
          <a className="loyality-business__button" href={demoHref}>{t('Request a demo')} <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
    </div>
  )
}
