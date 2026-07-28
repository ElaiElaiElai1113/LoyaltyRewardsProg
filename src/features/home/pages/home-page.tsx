import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import { useLanguage } from '@/lib/language'
import { useTenant } from '@/hooks/use-tenant'
import carRewards from '@/assets/landing/car-rewards-clean.webp'
import carRewardsSmall from '@/assets/landing/car-rewards-clean-768.webp'
import coffeeMember from '@/assets/landing/coffee-member.webp'
import coffeeMemberSmall from '@/assets/landing/coffee-member-768.webp'
import coffeeRewards from '@/assets/landing/coffee-rewards.webp'
import coffeeRewardsSmall from '@/assets/landing/coffee-rewards-768.webp'
import dinnerRewards from '@/assets/landing/dinner-rewards.webp'
import dinnerRewardsSmall from '@/assets/landing/dinner-rewards-768.webp'
import realEstateRewards from '@/assets/landing/real-estate-rewards.webp'
import realEstateRewardsSmall from '@/assets/landing/real-estate-rewards-768.webp'
import salonRewards from '@/assets/landing/salon-rewards.webp'
import salonRewardsSmall from '@/assets/landing/salon-rewards-768.webp'
import vacationBanner from '@/assets/landing/vacation-beach-clean.webp'

import './home-page.css'

const spanishHomeCopy: Record<string, string> = {
  'How it works': 'Cómo funciona',
  Businesses: 'Negocios',
  'Join now': 'Únete ahora',
  'Earn Amazing': 'Gana increíbles',
  'Rewards While': 'recompensas mientras',
  'Supporting Local': 'apoyas a los',
  'Businesses headline': 'negocios locales',
  "Every time you shop, dine, or spend at a business in our network, you're supporting a local business — and earning Rewards you can actually use.":
    'Cada vez que compras, comes o gastas en un negocio de nuestra red, apoyas a un negocio local y ganas recompensas que realmente puedes usar.',
  'Join free and earn 10% back automatically — or upgrade to earn between 20% and 100% back — every time you spend with the businesses in our network.':
    'Únete gratis y recibe automáticamente un 10% de vuelta, o mejora tu membresía para ganar entre un 20% y un 100% cada vez que compras en nuestra red.',
  'Join Medellín Rewards': 'Únete a Medellín Rewards',
  'See how it works': 'Descubre cómo funciona',
  'Everyday spending': 'Compras de todos los días',
  '20% – 100% back': '20% – 100% de vuelta',
  'Any business, anywhere': 'Cualquier negocio, en cualquier lugar',
  'BACK TODAY': 'DE VUELTA HOY',
  'Every purchase becomes a Reward': 'Cada compra se convierte en una recompensa',
  'Support local, automatically': 'Apoya lo local, automáticamente',
  'Support the local businesses you already love, every single time you spend.':
    'Apoya a los negocios locales que ya amas cada vez que compras.',
  'Earn 20% – 100% back': 'Recibe entre 20% y 100%',
  'Simply spend at amazing businesses within our platform to start earning.':
    'Compra en negocios increíbles de nuestra plataforma para comenzar a ganar.',
  'Almost anything counts': 'Casi todo cuenta',
  'Earn from purchasing almost any type of product or service - from Restaurants, hotels, coffee shops, hair and nail salons, cars, even real estate and more.':
    'Gana al comprar casi cualquier producto o servicio: restaurantes, hoteles, cafés, salones de belleza, autos, bienes raíces y mucho más.',
  MEMBERSHIP: 'MEMBRESÍA',
  'Choose how you earn': 'Elige cómo quieres ganar',
  'Start free, or upgrade and get 100% of it back in Rewards credit.':
    'Comienza gratis o mejora tu membresía y recibe el 100% en crédito de recompensas.',
  'Free Membership': 'Membresía gratuita',
  'No cost to join': 'Sin costo para unirte',
  'Earn 10% back automatically on every purchase': 'Recibe automáticamente un 10% en cada compra',
  'Upgrade any time as you spend more': 'Mejora tu membresía cuando quieras',
  'Join Free →': 'Únete gratis →',
  'Regular Membership': 'Membresía regular',
  'WORKS OUT TO BE FREE': 'AL FINAL ES GRATIS',
  'Earn 100,000 COP back in rewards': 'Recibe 100.000 COP en recompensas',
  'Earn minimum 20% – 100% back on almost all purchases': 'Recibe entre 20% y 100% en casi todas tus compras',
  'Earn 40,000 COP in rewards for every member you refer that joins':
    'Gana 40.000 COP por cada miembro referido que se una',
  'Earn a minimum of 200,000 COP in Rewards for referring a business that joins':
    'Gana al menos 200.000 COP por referir un negocio que se una',
  'Upgrade →': 'Mejorar →',
  'THE PROCESS': 'EL PROCESO',
  Join: 'Únete',
  'Sign up as a member — free, in under a minute.': 'Regístrate gratis como miembro en menos de un minuto.',
  'Spend & earn': 'Compra y gana',
  'Shop, dine, and buy at any business in our network. Earn 10% back for free, or 20–100% back on our paid tier.':
    'Compra o come en cualquier negocio de nuestra red. Recibe 10% gratis, o entre 20% y 100% con nuestra membresía regular.',
  Redeem: 'Canjea',
  "Use your Rewards to purchase your dream vacation, or on anything available in our Rewards Store.":
    'Usa tus recompensas para tus vacaciones soñadas o para cualquier opción disponible en nuestra tienda.',
  REDEEM: 'CANJEA',
  'Your dream vacation.': 'Tus vacaciones soñadas.',
  'Already paid for.': 'Ya están pagadas.',
  "Every Reward you earn stacks toward the Rewards Store — including the trip you've been putting off.":
    'Cada recompensa se acumula para usarla en nuestra tienda, incluso para ese viaje que has estado aplazando.',
  'Start earning today': 'Empieza a ganar hoy',
  'GOOD TO KNOW': 'LO QUE DEBES SABER',
  'Frequently asked questions': 'Preguntas frecuentes',
  'Where can I use my Rewards?': '¿Dónde puedo usar mis recompensas?',
  'You can use your Rewards with many partnered businesses, either by going to the Rewards Store or by messaging us for more options.':
    'Puedes usar tus recompensas con muchos negocios aliados, en la tienda de recompensas o escribiéndonos para conocer más opciones.',
  'Can I have more than one Rewards account?': '¿Puedo tener más de una cuenta de recompensas?',
  'No. Each person can have one Rewards account, tied to your full name, email, and phone number.':
    'No. Cada persona puede tener una sola cuenta asociada con su nombre completo, correo y teléfono.',
  'Can I transfer Rewards to another account?': '¿Puedo transferir recompensas a otra cuenta?',
  'Rewards are tied to your member account and must be used and cannot be transferred.':
    'Las recompensas pertenecen a tu cuenta de miembro, deben ser usadas por ti y no se pueden transferir.',
  'Can Rewards be exchanged for money?': '¿Puedo cambiar las recompensas por dinero?',
  'No, Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within the Medellin Rewards Program - not cash exchange.':
    'No. Las recompensas están diseñadas para beneficios, compras, viajes, experiencias y ofertas de aliados, no para cambiarlas por efectivo.',
  "Don't see one of your favourite businesses?": '¿No encuentras uno de tus negocios favoritos?',
  "Refer them to us, and if they join, you'll earn Rewards.":
    'Recomiéndalo y, si se une, ganarás recompensas.',
  'Suggest a business →': 'Recomienda un negocio →',
  'Earn amazing rewards while supporting local businesses.':
    'Gana increíbles recompensas mientras apoyas a los negocios locales.',
  'Privacy policy': 'Política de privacidad',
  Contact: 'Contacto',
  'All rights reserved.': 'Todos los derechos reservados.',
  'Made for members in Medellín, Colombia': 'Hecho para miembros en Medellín, Colombia',
  English: 'English',
  Spanish: 'Español',
}

const valueItems = [
  {
    icon: '🏠',
    title: 'Support local, automatically',
    body: 'Support the local businesses you already love, every single time you spend.',
  },
  {
    icon: '📊',
    title: 'Earn 20% – 100% back',
    body: 'Simply spend at amazing businesses within our platform to start earning.',
  },
  {
    icon: '🛒',
    title: 'Almost anything counts',
    body: 'Earn from purchasing almost any type of product or service - from Restaurants, hotels, coffee shops, hair and nail salons, cars, even real estate and more.',
  },
] as const

const categoryImages = [
  {
    src: coffeeRewards,
    srcSmall: coffeeRewardsSmall,
    alt: 'Member earning rewards at a local coffee shop',
    className: 'figma-home__category-card--coffee',
  },
  {
    src: dinnerRewards,
    srcSmall: dinnerRewardsSmall,
    alt: 'Friends dining together in Medellín',
    className: 'figma-home__category-card--dining',
  },
  {
    src: salonRewards,
    srcSmall: salonRewardsSmall,
    alt: 'Member enjoying a day at a local hair salon',
    className: 'figma-home__category-card--salon',
  },
  {
    src: carRewards,
    srcSmall: carRewardsSmall,
    alt: 'Family celebrating a car purchase',
    className: 'figma-home__category-card--cars',
  },
  {
    src: realEstateRewards,
    srcSmall: realEstateRewardsSmall,
    alt: 'Couple earning rewards on a real estate purchase',
    className: 'figma-home__category-card--real-estate',
  },
] as const

const freeBenefits = [
  'Earn 10% back automatically on every purchase',
  'Upgrade any time as you spend more',
] as const

const regularBenefits = [
  'Earn minimum 20% – 100% back on almost all purchases',
  'Earn 40,000 COP in rewards for every member you refer that joins',
  'Earn a minimum of 200,000 COP in Rewards for referring a business that joins',
] as const

const processSteps = [
  {
    number: '01',
    title: 'Join',
    body: 'Sign up as a member — free, in under a minute.',
  },
  {
    number: '02',
    title: 'Spend & earn',
    body: 'Shop, dine, and buy at any business in our network. Earn 10% back for free, or 20–100% back on our paid tier.',
  },
  {
    number: '03',
    title: 'Redeem',
    body: 'Use your Rewards to purchase your dream vacation, or on anything available in our Rewards Store.',
  },
] as const

const faqs = [
  {
    icon: '📍',
    question: 'Where can I use my Rewards?',
    answer: 'You can use your Rewards with many partnered businesses, either by going to the Rewards Store or by messaging us for more options.',
  },
  {
    icon: '👤',
    question: 'Can I have more than one Rewards account?',
    answer: 'No. Each person can have one Rewards account, tied to your full name, email, and phone number.',
    open: true,
  },
  {
    icon: '✅',
    question: 'Can I transfer Rewards to another account?',
    answer: 'Rewards are tied to your member account and must be used and cannot be transferred.',
  },
  {
    icon: '$',
    question: 'Can Rewards be exchanged for money?',
    answer: 'No, Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within the Medellin Rewards Program - not cash exchange.',
  },
] as const

function Brand() {
  const { program } = useTenant()
  return (
    <span className="figma-home__brand">
      {program.logoUrl ? <img src={program.logoUrl} alt="" aria-hidden="true" /> : null}
      <span>{program.name.toUpperCase()}</span>
    </span>
  )
}

function SectionEyebrow({ children }: { children: string }) {
  return <p className="figma-home__eyebrow">{children}</p>
}

export function HomePage() {
  const { language, setLanguage } = useLanguage()
  const { program } = useTenant()
  const tx = (text: string) => language === 'es' ? spanishHomeCopy[text] ?? text : text

  return (
    <main className="figma-home" id="top">
      <div className="figma-home__paper">
        <header className="figma-home__header">
          <div className="figma-home__container figma-home__header-inner">
            <a href="#top" className="figma-home__brand-link" aria-label={`${program.name} home`}>
              <Brand />
            </a>

            <nav className="figma-home__nav" aria-label="Primary navigation">
              <a href="#how-it-works">{tx('How it works')}</a>
              <Link to="/business">{tx('Businesses')}</Link>
              <a href="#faq">FAQ</a>
            </nav>

            <div className="figma-home__header-actions">
              <button
                className="figma-home__language-toggle"
                type="button"
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a español'}
              >
                {language === 'es' ? 'English' : 'Español'}
              </button>
              <Link className="figma-home__button figma-home__button--header" to="/join">
                {tx('Join now')}
              </Link>
            </div>
          </div>
        </header>

        <section className="figma-home__hero" aria-labelledby="home-hero-title">
          <div className="figma-home__container figma-home__hero-grid">
            <div className="figma-home__hero-copy">
              <h1 id="home-hero-title">
                {tx('Earn Amazing')}
                <br />
                {tx('Rewards While')}
                <br />
                <em>{tx('Supporting Local')}</em>
                <br />
                {tx('Businesses headline')}
              </h1>

              <div className="figma-home__hero-text">
                <p>
                  {tx("Every time you shop, dine, or spend at a business in our network, you're supporting a local business — and earning Rewards you can actually use.")}
                </p>
                <p>
                  {tx('Join free and earn 10% back automatically — or upgrade to earn between 20% and 100% back — every time you spend with the businesses in our network.')}
                </p>
              </div>

              <div className="figma-home__hero-actions">
                <Link className="figma-home__button" to="/join">{language === 'es' ? `Únete a ${program.name}` : `Join ${program.name}`}</Link>
                <a className="figma-home__button figma-home__button--secondary" href="#how-it-works">{tx('See how it works')}</a>
              </div>

              <ul className="figma-home__hero-pills" aria-label="Membership benefits">
                <li>{tx('Everyday spending')}</li>
                <li>{tx('20% – 100% back')}</li>
                <li>{tx('Any business, anywhere')}</li>
              </ul>
            </div>

            <div className="figma-home__hero-visual">
              <img
                src={coffeeMember}
                srcSet={`${coffeeMemberSmall} 768w, ${coffeeMember} 1024w`}
                sizes="(max-width: 768px) 100vw, 50vw"
                alt="Member enjoying rewards at a local coffee shop"
                fetchPriority="high"
              />
              <div className="figma-home__reward-badge" aria-label="More than fifty percent back today">
                <strong>+50%</strong>
                <span>{tx('BACK TODAY')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="figma-home__rewards" id="rewards" aria-labelledby="rewards-title">
        <div className="figma-home__container">
          <h2 id="rewards-title">{tx('Every purchase becomes a Reward')}</h2>

          <div className="figma-home__value-grid">
            {valueItems.map((item) => (
              <article className="figma-home__value-card" key={item.title}>
                <span className="figma-home__value-icon" aria-hidden="true">{item.icon}</span>
                <h3>{tx(item.title)}</h3>
                <p>{tx(item.body)}</p>
              </article>
            ))}
          </div>

          <div className="figma-home__category-grid">
            {categoryImages.map((item) => (
              <figure className={`figma-home__category-card ${item.className}`} key={item.alt}>
                <img
                  src={item.src}
                  srcSet={`${item.srcSmall} 768w, ${item.src} 1024w`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="figma-home__membership" id="membership" aria-labelledby="membership-title">
        <div className="figma-home__container">
          <SectionEyebrow>{tx('MEMBERSHIP')}</SectionEyebrow>
          <h2 id="membership-title">{tx('Choose how you earn')}</h2>
          <p className="figma-home__section-intro">{tx('Start free, or upgrade and get 100% of it back in Rewards credit.')}</p>

          <div className="figma-home__membership-grid">
            <article className="figma-home__membership-card">
              <div className="figma-home__membership-heading">
                <h3>{tx('Free Membership')}</h3>
                <span className="figma-home__percentage">10%</span>
              </div>
              <p className="figma-home__price">$0</p>
              <p className="figma-home__price-note">{tx('No cost to join')}</p>
              <ul className="figma-home__benefit-list">
                {freeBenefits.map((benefit) => <li key={benefit}>{tx(benefit)}</li>)}
              </ul>
              <Link className="figma-home__membership-button figma-home__membership-button--free" to="/join">
                {tx('Join Free →')}
              </Link>
            </article>

            <article className="figma-home__membership-card figma-home__membership-card--regular">
              <span className="figma-home__free-ribbon">{tx('WORKS OUT TO BE FREE')}</span>
              <div className="figma-home__membership-heading">
                <h3>{tx('Regular Membership')}</h3>
                <span className="figma-home__percentage figma-home__percentage--regular">100%</span>
              </div>
              <p className="figma-home__price">$100,000 COP</p>
              <p className="figma-home__price-note">{tx('Earn 100,000 COP back in rewards')}</p>
              <ul className="figma-home__benefit-list">
                {regularBenefits.map((benefit) => <li key={benefit}>{tx(benefit)}</li>)}
              </ul>
              <Link className="figma-home__membership-button" to="/join">{tx('Upgrade →')}</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="figma-home__process" id="how-it-works" aria-labelledby="process-title">
        <div className="figma-home__container">
          <SectionEyebrow>{tx('THE PROCESS')}</SectionEyebrow>
          <h2 id="process-title">{tx('How it works')}</h2>

          <div className="figma-home__process-grid">
            {processSteps.map((step) => (
              <article className="figma-home__process-step" key={step.number}>
                <span className="figma-home__step-number">{step.number}</span>
                <h3>{tx(step.title)}</h3>
                <p>{tx(step.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="figma-home__vacation"
        id="vacation"
        aria-labelledby="vacation-title"
        style={{ '--vacation-art': `url(${vacationBanner})` } as CSSProperties}
      >
        <div className="figma-home__vacation-shade" />
        <div className="figma-home__container figma-home__vacation-content">
          <SectionEyebrow>{tx('REDEEM')}</SectionEyebrow>
          <h2 id="vacation-title">{tx('Your dream vacation.')}<br />{tx('Already paid for.')}</h2>
          <p>{tx("Every Reward you earn stacks toward the Rewards Store — including the trip you've been putting off.")}</p>
          <Link className="figma-home__button" to="/join">{tx('Start earning today')}</Link>
        </div>
      </section>

      <section className="figma-home__faq" id="faq" aria-labelledby="faq-title">
        <div className="figma-home__container">
          <SectionEyebrow>{tx('GOOD TO KNOW')}</SectionEyebrow>
          <h2 id="faq-title">{tx('Frequently asked questions')}</h2>

          <div className="figma-home__faq-list">
            {faqs.map((faq) => (
              <details key={faq.question} open={'open' in faq && faq.open}>
                <summary>
                  <span><span aria-hidden="true">{faq.icon}</span>{tx(faq.question)}</span>
                  <span className="figma-home__faq-toggle" aria-hidden="true" />
                </summary>
                {'answer' in faq && faq.answer ? <p>{tx(faq.answer)}</p> : null}
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="figma-home__suggest" aria-labelledby="suggest-title">
        <div className="figma-home__container figma-home__suggest-inner">
          <div>
            <h2 id="suggest-title">{tx("Don't see one of your favourite businesses?")}</h2>
            <p>{tx("Refer them to us, and if they join, you'll earn Rewards.")}</p>
          </div>
          <Link className="figma-home__button figma-home__suggest-button" to="/business">{tx('Suggest a business →')}</Link>
        </div>
      </section>

      <footer className="figma-home__footer">
        <div className="figma-home__container">
          <div className="figma-home__footer-top">
            <div>
              <a href="#top" className="figma-home__brand-link" aria-label="Back to the top">
                <Brand />
              </a>
              <p>{tx('Earn amazing rewards while supporting local businesses.')}</p>
            </div>
            <nav aria-label="Footer navigation">
              <Link to="/privacy">{tx('Privacy policy')}</Link>
              <Link to="/terms">{tx('Contact')}</Link>
            </nav>
          </div>
          <div className="figma-home__footer-bottom">
            <p>© 2026 {program.name}. {tx('All rights reserved.')}</p>
            <p>{program.countryCode}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
