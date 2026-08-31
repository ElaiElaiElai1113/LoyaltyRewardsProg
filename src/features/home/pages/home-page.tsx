import type { CSSProperties } from 'react'
import { Link } from 'react-router'

import { languageDisplayNames, useLanguage } from '@/lib/language'
import { useTenant } from '@/hooks/use-tenant'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import { isRewardMeExperience } from '@/lib/rewardme-experience'
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
import { RewardMeHomePage } from './rewardme-home'
import { LoyalityHomePage } from '@/features/loyality/pages/loyality-home-page'

import './home-page.css'

const spanishHomeCopy: Record<string, string> = {
  'How it works': 'Cómo funciona',
  Businesses: 'Negocios',
  'Join now': 'Únete ahora',
  'Earn Amazing': 'Gana increíbles',
  'Rewards While': 'recompensas mientras',
  'Supporting Local': 'apoyas a los',
  "Every time you shop, dine, or spend at a business in our network, you're supporting a local business — and earning Rewards you can actually use.":
    'Cada vez que compras, comes o gastas en un negocio de nuestra red, apoyas a un negocio local y ganas recompensas que realmente puedes usar.',
  'Join free and earn 10% back automatically — or upgrade to earn between 20% and 100% back — every time you spend with the businesses in our network.':
    'Únete gratis y recibe automáticamente un 10% de vuelta, o mejora tu membresía para ganar entre un 20% y un 100% cada vez que compras en nuestra red.',
  'Create an account and earn Rewards on eligible purchases. Current rates and upgrade benefits are set by this program.':
    'Crea una cuenta y gana recompensas en compras elegibles. Este programa define las tasas y los beneficios de cada plan.',
  'Join Medellín Rewards': 'Únete a Medellín Rewards',
  'See how it works': 'Descubre cómo funciona',
  'Everyday spending': 'Compras de todos los días',
  '20% – 100% back': '20% – 100% de vuelta',
  'Any business, anywhere': 'Cualquier negocio, en cualquier lugar',
  'Eligible spending': 'Compras elegibles',
  'Program-set reward rates': 'Tasas definidas por el programa',
  'Participating businesses': 'Negocios participantes',
  'BACK TODAY': 'DE VUELTA HOY',
  REWARDS: 'RECOMPENSAS',
  'ON ELIGIBLE PURCHASES': 'EN COMPRAS ELEGIBLES',
  'Every purchase becomes a Reward': 'Cada compra se convierte en una recompensa',
  'Eligible purchases can earn Rewards': 'Las compras elegibles pueden generar recompensas',
  'Support local, automatically': 'Apoya lo local, automáticamente',
  'Support the local businesses you already love, every single time you spend.':
    'Apoya a los negocios locales que ya amas cada vez que compras.',
  'Support participating local businesses when you make an eligible purchase.':
    'Apoya a negocios locales participantes cuando haces una compra elegible.',
  'Earn 20% – 100% back': 'Recibe entre 20% y 100%',
  'Simply spend at amazing businesses within our platform to start earning.':
    'Compra en negocios increíbles de nuestra plataforma para comenzar a ganar.',
  'Earn at program-set rates': 'Gana según las tasas del programa',
  'Each participating offer defines its own earn rate and eligibility.':
    'Cada oferta participante define su tasa y sus requisitos.',
  'Offers and eligibility vary by participating business.':
    'Las ofertas y los requisitos varían según el negocio participante.',
  'Almost anything counts': 'Casi todo cuenta',
  'Explore eligible offers': 'Explora ofertas elegibles',
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
  'Premium Membership': 'Membresía premium',
  'Pricing available on request': 'Precio disponible bajo solicitud',
  'Start free, then contact the program team for current upgrade pricing and benefits.':
    'Comienza gratis y luego contacta al equipo del programa para conocer los precios y beneficios actuales.',
  'Review current membership options, pricing, and benefits with the program team.':
    'Consulta con el equipo del programa las opciones, precios y beneficios actuales.',
  'Member Account': 'Cuenta de miembro',
  'Program terms apply': 'Se aplican los términos del programa',
  'Earn Rewards on eligible purchases when offered': 'Gana recompensas en compras elegibles cuando estén disponibles',
  'Review current program terms before upgrading': 'Revisa los términos actuales antes de mejorar tu membresía',
  'View membership options →': 'Ver opciones de membresía →',
  'Pricing and benefits are managed by this program in':
    'Los precios y beneficios son administrados por este programa en',
  'Earn more on eligible purchases at participating businesses':
    'Gana más en compras elegibles en negocios participantes',
  'Access referral rewards when offered by this program':
    'Accede a recompensas por referidos cuando este programa las ofrezca',
  'Review current benefits and terms before upgrading':
    'Revisa los beneficios y términos actuales antes de mejorar tu membresía',
  'Ask about membership →': 'Consulta sobre la membresía →',
  'WORKS OUT TO BE FREE': 'AL FINAL ES GRATIS',
  'Earn minimum 20% – 100% back on almost all purchases': 'Recibe entre 20% y 100% en casi todas tus compras',
  'Upgrade →': 'Mejorar →',
  'THE PROCESS': 'EL PROCESO',
  Join: 'Únete',
  'Sign up as a member — free, in under a minute.': 'Regístrate gratis como miembro en menos de un minuto.',
  'Create a member account to review current program offers.':
    'Crea una cuenta de miembro para revisar las ofertas actuales.',
  'Spend & earn': 'Compra y gana',
  'Shop, dine, and buy at any business in our network. Earn 10% back for free, or 20–100% back on our paid tier.':
    'Compra o come en cualquier negocio de nuestra red. Recibe 10% gratis, o entre 20% y 100% con nuestra membresía regular.',
  'Shop with participating businesses and earn at the rate shown in each eligible offer.':
    'Compra en negocios participantes y gana según la tasa indicada en cada oferta elegible.',
  Redeem: 'Canjea',
  "Use your Rewards to purchase your dream vacation, or on anything available in our Rewards Store.":
    'Usa tus recompensas para tus vacaciones soñadas o para cualquier opción disponible en nuestra tienda.',
  'Use your Rewards on currently available offers from participating businesses.':
    'Usa tus recompensas en las ofertas disponibles de los negocios participantes.',
  REDEEM: 'CANJEA',
  'Your dream vacation.': 'Tus vacaciones soñadas.',
  'Already paid for.': 'Ya están pagadas.',
  'Rewards you can use.': 'Recompensas que puedes usar.',
  'Browse current offers.': 'Explora las ofertas actuales.',
  "Every Reward you earn stacks toward the Rewards Store — including the trip you've been putting off.":
    'Cada recompensa se acumula para usarla en nuestra tienda, incluso para ese viaje que has estado aplazando.',
  'Available Rewards depend on current program and partner offers.':
    'Las recompensas disponibles dependen de las ofertas actuales del programa y sus aliados.',
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
  'No. Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within Pinas Rewards—not cash exchange.':
    'No. Las recompensas están diseñadas para beneficios, compras, viajes, experiencias y ofertas de aliados, no para cambiarlas por efectivo.',
  'No. Rewards are member benefits available through current program and partner offers, not cash.':
    'No. Las recompensas son beneficios disponibles en las ofertas actuales del programa y sus aliados, no dinero en efectivo.',
  'You can use Rewards with participating businesses and current offers listed by this program.':
    'Puedes usar recompensas con los negocios participantes y las ofertas actuales de este programa.',
  'Account limits and transfer options follow the current program terms. Contact support if you need help with an existing account.':
    'Los limites de cuentas y las opciones de transferencia dependen de los terminos actuales del programa. Contacta a soporte si necesitas ayuda con una cuenta existente.',
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

const tagalogHomeCopy: Record<string, string> = {
  'How it works': 'Paano ito gumagana',
  Businesses: 'Mga Negosyo',
  'Join now': 'Sumali ngayon',
  'Earn Amazing': 'Kumita ng Malalaking',
  'Rewards While': 'Reward Habang',
  'Supporting Local': 'Sinusuportahan ang Lokal',
  "Every time you shop, dine, or spend at a business in our network, you're supporting a local business — and earning Rewards you can actually use.":
    'Sa bawat pamimili, pagkain, o paggastos sa aming network, sinusuportahan mo ang lokal na negosyo at kumikita ng Rewards na magagamit mo.',
  'See how it works': 'Tingnan kung paano',
  'Everyday spending': 'Araw-araw na gastos',
  'Any business, anywhere': 'Iba’t ibang lokal na negosyo',
  'Every purchase becomes a Reward': 'Bawat pagbili ay nagiging Reward',
  'Support local, automatically': 'Awtomatikong suportahan ang lokal',
  'Support the local businesses you already love, every single time you spend.':
    'Suportahan ang mga lokal na negosyong mahal mo sa bawat paggastos.',
  'Almost anything counts': 'Halos lahat ay kasama',
  MEMBERSHIP: 'MEMBERSHIP',
  'Choose how you earn': 'Piliin kung paano ka kikita',
  'Membership Packages': 'Mga Membership Package',
  'Two ways to join — both give you back what you spend.':
    'Dalawang paraan para sumali — pareho kang binibigyan ng Rewards na katumbas ng iyong binabayaran.',
  Regular: 'Regular',
  'Billed monthly': 'Buwanang sinisingil',
  'Paid once, upfront': 'Isang beses na paunang bayad',
  'Start Regular →': 'Simulan ang Regular →',
  'Start Gold →': 'Simulan ang Gold →',
  'No cost to join': 'Walang bayad sa pagsali',
  'THE PROCESS': 'ANG PROSESO',
  Join: 'Sumali',
  'Spend & earn': 'Gumastos at kumita',
  Redeem: 'Gamitin',
  'Start earning today': 'Magsimulang kumita ngayon',
  'GOOD TO KNOW': 'MAHALAGANG MALAMAN',
  'Frequently asked questions': 'Mga madalas itanong',
  'Where can I use my Rewards?': 'Saan ko magagamit ang aking Rewards?',
  'You can use your Rewards with many partnered businesses, either by going to the Rewards Store or by messaging us for more options.':
    'Magagamit mo ang iyong Rewards sa mga partner na negosyo, sa Rewards Store, o sa pakikipag-ugnayan sa amin para sa iba pang opsyon.',
  'Can I have more than one Rewards account?': 'Maaari ba akong magkaroon ng higit sa isang Rewards account?',
  'No. Each person can have one Rewards account, tied to your full name, email, and phone number.':
    'Hindi. Isang Rewards account lamang ang maaari sa bawat tao at nakaugnay ito sa buong pangalan, email, at numero ng telepono.',
  'Can I transfer Rewards to another account?': 'Maaari ko bang ilipat ang Rewards sa ibang account?',
  'Rewards are tied to your member account and must be used and cannot be transferred.':
    'Nakaugnay ang Rewards sa iyong member account at hindi ito maaaring ilipat sa ibang account.',
  'Can Rewards be exchanged for money?': 'Maaari bang ipalit sa pera ang Rewards?',
  'No. Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within Pinas Rewards—not cash exchange.':
    'Hindi. Ang Rewards ay para sa mga benepisyo, pagbili, biyahe, karanasan, at partner offers ng programa at hindi maaaring ipalit sa cash.',
  'No. Rewards are member benefits available through current program and partner offers, not cash.':
    'Hindi. Ang Rewards ay mga benepisyo mula sa kasalukuyang programa at partner offers, hindi cash.',
  'Privacy policy': 'Patakaran sa Privacy',
  Contact: 'Makipag-ugnayan',
  'All rights reserved.': 'Lahat ng karapatan ay nakalaan.',
}

const heroBusinessCopy = {
  en: 'Businesses',
  es: 'negocios locales',
  tl: 'na mga Negosyo',
} as const

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
    label: 'Coffee runs',
    className: 'figma-home__category-card--coffee',
  },
  {
    src: dinnerRewards,
    srcSmall: dinnerRewardsSmall,
    alt: 'Friends dining together at a local restaurant',
    label: 'Dining out',
    className: 'figma-home__category-card--dining',
  },
  {
    src: salonRewards,
    srcSmall: salonRewardsSmall,
    alt: 'Member enjoying a day at a local hair salon',
    label: 'Salon days',
    className: 'figma-home__category-card--salon',
  },
  {
    src: carRewards,
    srcSmall: carRewardsSmall,
    alt: 'Family celebrating a car purchase',
    label: 'Cars',
    className: 'figma-home__category-card--cars',
  },
  {
    src: realEstateRewards,
    srcSmall: realEstateRewardsSmall,
    alt: 'Couple earning rewards on a real estate purchase',
    label: 'Real estate',
    className: 'figma-home__category-card--real-estate',
  },
] as const

const regularBenefits = [
  'PHP 1,000 in monthly Rewards credit',
  '20%–100% back at partner cafés, spas, and restaurants',
  'Cancel or upgrade anytime',
] as const

const tenantManagedBenefits = [
  'Earn more on eligible purchases at participating businesses',
  'Access referral rewards when offered by this program',
  'Review current benefits and terms before upgrading',
] as const

const tenantManagedValueItems = [
  {
    icon: '🏠',
    title: 'Support local, automatically',
    body: 'Support participating local businesses when you make an eligible purchase.',
  },
  {
    icon: '📊',
    title: 'Earn at program-set rates',
    body: 'Each participating offer defines its own earn rate and eligibility.',
  },
  {
    icon: '🛒',
    title: 'Explore eligible offers',
    body: 'Offers and eligibility vary by participating business.',
  },
] as const

const tenantManagedFreeBenefits = [
  'Earn Rewards on eligible purchases when offered',
  'Review current program terms before upgrading',
] as const

const tenantManagedProcessSteps = [
  {
    number: '01',
    title: 'Join',
    body: 'Create a member account to review current program offers.',
  },
  {
    number: '02',
    title: 'Spend & earn',
    body: 'Shop with participating businesses and earn at the rate shown in each eligible offer.',
  },
  {
    number: '03',
    title: 'Redeem',
    body: 'Use your Rewards on currently available offers from participating businesses.',
  },
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

const pinasRewardsFaqs = [
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
    answer: 'No. Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within Pinas Rewards—not cash exchange.',
  },
] as const

const tenantManagedFaqs = [
  {
    icon: '📍',
    question: 'Where can I use my Rewards?',
    answer: 'You can use Rewards with participating businesses and current offers listed by this program.',
  },
  {
    icon: '👤',
    question: 'Can I have more than one Rewards account?',
    answer: 'Account limits and transfer options follow the current program terms. Contact support if you need help with an existing account.',
    open: true,
  },
  {
    icon: '✅',
    question: 'Can I transfer Rewards to another account?',
    answer: 'Account limits and transfer options follow the current program terms. Contact support if you need help with an existing account.',
  },
  {
    icon: '$',
    question: 'Can Rewards be exchanged for money?',
    answer: 'No. Rewards are member benefits available through current program and partner offers, not cash.',
  },
] as const

function Brand() {
  const { program } = useTenant()
  const logoUrl = program.logoUrl
    ?? (program.slug === 'pinas' ? '/rewardme-mark.svg' : null)
    ?? (program.slug === 'pinasrewards' ? '/pinas-rewards-mark.svg' : null)
  return (
    <span className="figma-home__brand">
      {logoUrl ? <img src={logoUrl} alt="" aria-hidden="true" /> : null}
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
  if (program.slug === 'loyality') return <LoyalityHomePage />
  if (isRewardMeExperience(program.slug)) return <RewardMeHomePage />
  const isPinasRewards = program.slug === 'pinasrewards'
  const tx = (text: string) => (
    language === 'es'
      ? spanishHomeCopy[text] ?? text
      : language === 'tl'
        ? tagalogHomeCopy[text] ?? text
        : text
  )
    .replaceAll('Medellin Rewards', program.name)
    .replaceAll('Medellín Rewards', program.name)
  const paidBenefits = isPinasRewards
    ? [
        'Earn a minimum of 20% – 100% back on almost all purchases',
        'Earn rewards for every member you refer who joins',
        'Earn even more when a business you refer joins the network',
        'Claim a minimum PHP 1,000 Rewards bonus for qualifying business referrals',
      ]
    : tenantManagedBenefits
  const paidMembershipPrice = isPinasRewards
    ? `${formatTenantCurrency(4_000, program)}/Year`
    : tx('Pricing available on request')
  const paidMembershipPriceNote = isPinasRewards
    ? `Get the full ${formatTenantCurrency(4_000, program)} back in Rewards credit`
    : `${tx('Pricing and benefits are managed by this program in')} ${program.currency}.`
  const membershipSectionIntro = isPinasRewards
    ? tx('Two ways to join — both give you back what you spend.')
    : tx('Review current membership options, pricing, and benefits with the program team.')
  const homepageValueItems = isPinasRewards ? valueItems : tenantManagedValueItems
  const homepageProcessSteps = isPinasRewards ? processSteps : tenantManagedProcessSteps
  const homepageFaqs = isPinasRewards ? pinasRewardsFaqs : tenantManagedFaqs
  const baseMembershipBenefits = isPinasRewards ? regularBenefits : tenantManagedFreeBenefits
  const heroOfferCopy = isPinasRewards
    ? 'Join free and earn 10% back automatically — or upgrade to earn between 20% and 100% back — every time you spend with the businesses in our network.'
    : 'Create an account and earn Rewards on eligible purchases. Current rates and upgrade benefits are set by this program.'
  const heroPills = isPinasRewards
    ? ['Everyday spending', '20% – 100% back', 'Any business, anywhere']
    : ['Eligible spending', 'Program-set reward rates', 'Participating businesses']

  return (
    <main className={`figma-home${isPinasRewards ? ' figma-home--pinas' : ''}`} id="top">
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
                onClick={() => setLanguage(isPinasRewards ? (language === 'tl' ? 'en' : 'tl') : (language === 'es' ? 'en' : 'es'))}
                aria-label={isPinasRewards
                  ? (language === 'tl' ? 'Lumipat sa Ingles' : 'Switch to Tagalog')
                  : language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
              >
                {languageDisplayNames[language][isPinasRewards
                  ? (language === 'tl' ? 'en' : 'tl')
                  : (language === 'es' ? 'en' : 'es')]}
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
                {heroBusinessCopy[language]}
              </h1>

              <div className="figma-home__hero-text">
                <p>
                  {tx("Every time you shop, dine, or spend at a business in our network, you're supporting a local business — and earning Rewards you can actually use.")}
                </p>
                <p>
                  {tx(heroOfferCopy)}
                </p>
              </div>

              <div className="figma-home__hero-actions">
                <Link className="figma-home__button" to="/join">{language === 'es' ? `Únete a ${program.name}` : `Join ${program.name}`}</Link>
                <a className="figma-home__button figma-home__button--secondary" href="#how-it-works">{tx('See how it works')}</a>
              </div>

              <ul className="figma-home__hero-pills" aria-label="Membership benefits">
                {heroPills.map((pill) => <li key={pill}>{tx(pill)}</li>)}
              </ul>
            </div>

            <div className="figma-home__hero-visual">
              <img
                src={isPinasRewards ? coffeeRewards : coffeeMember}
                srcSet={isPinasRewards
                  ? `${coffeeRewardsSmall} 768w, ${coffeeRewards} 1024w`
                  : `${coffeeMemberSmall} 768w, ${coffeeMember} 1024w`}
                sizes="(max-width: 768px) 100vw, 50vw"
                alt={isPinasRewards
                  ? 'Pinas Rewards member enjoying coffee at a local business'
                  : 'Member enjoying rewards at a local coffee shop'}
                fetchPriority="high"
              />
              <div
                className="figma-home__reward-badge"
                aria-label={isPinasRewards ? 'More than fifty percent back today' : 'Rewards on eligible purchases'}
              >
                <strong>{isPinasRewards ? '+50%' : tx('REWARDS')}</strong>
                <span>{tx(isPinasRewards ? 'BACK TODAY' : 'ON ELIGIBLE PURCHASES')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="figma-home__rewards" id="rewards" aria-labelledby="rewards-title">
        <div className="figma-home__container">
          <h2 id="rewards-title">{tx(isPinasRewards ? 'Every purchase becomes a Reward' : 'Eligible purchases can earn Rewards')}</h2>

          <div className="figma-home__value-grid">
            {homepageValueItems.map((item) => (
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
                {isPinasRewards ? <figcaption>{item.label}</figcaption> : null}
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="figma-home__membership" id="membership" aria-labelledby="membership-title">
        <div className="figma-home__container">
          <SectionEyebrow>{tx('MEMBERSHIP')}</SectionEyebrow>
          <h2 id="membership-title">{tx(isPinasRewards ? 'Membership Packages' : 'Choose how you earn')}</h2>
          <p className="figma-home__section-intro">{membershipSectionIntro}</p>

          <div className="figma-home__membership-grid">
            <article className="figma-home__membership-card">
              <div className="figma-home__membership-heading">
                <h3>{tx(isPinasRewards ? 'Regular' : 'Member Account')}</h3>
                {isPinasRewards ? <span className="figma-home__percentage">10%</span> : null}
              </div>
              <p className="figma-home__price">{isPinasRewards ? `${formatTenantCurrency(1_000, program)}/Month` : tx('Program terms apply')}</p>
              <p className="figma-home__price-note">{tx(isPinasRewards ? 'Billed monthly' : 'Review current program terms before upgrading')}</p>
              {isPinasRewards ? <p className="figma-home__membership-referral">Refer a friend and earn PHP 100 every 3 months</p> : null}
              <ul className="figma-home__benefit-list">
                {baseMembershipBenefits.map((benefit) => <li key={benefit}>{tx(benefit)}</li>)}
              </ul>
              <Link className="figma-home__membership-button figma-home__membership-button--free" to="/join">
                {tx(isPinasRewards ? 'Start Regular →' : 'View membership options →')}
              </Link>
            </article>

            <article className="figma-home__membership-card figma-home__membership-card--regular">
              {isPinasRewards ? <span className="figma-home__free-ribbon">{tx('WORKS OUT TO BE FREE')}</span> : null}
              <div className="figma-home__membership-heading">
                <h3>{isPinasRewards ? 'Gold' : tx('Premium Membership')}</h3>
                {isPinasRewards ? <span className="figma-home__percentage figma-home__percentage--regular">100%</span> : null}
              </div>
              <p className="figma-home__price">{paidMembershipPrice}</p>
              <p className="figma-home__price-note">{isPinasRewards ? tx('Paid once, upfront') : paidMembershipPriceNote}</p>
              {isPinasRewards ? <p className="figma-home__membership-referral">Refer a friend on Gold and get PHP 1,000 back instantly</p> : null}
              <ul className="figma-home__benefit-list">
                {paidBenefits.map((benefit) => <li key={benefit}>{tx(benefit)}</li>)}
              </ul>
              {isPinasRewards ? (
                <Link className="figma-home__membership-button" to="/join">{tx('Start Gold →')}</Link>
              ) : (
                <a
                  className="figma-home__membership-button"
                  href={`mailto:${program.supportEmail}?subject=${encodeURIComponent(`${program.name} membership`)}`}
                >
                  {tx('Ask about membership →')}
                </a>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="figma-home__process" id="how-it-works" aria-labelledby="process-title">
        <div className="figma-home__container">
          <SectionEyebrow>{tx('THE PROCESS')}</SectionEyebrow>
          <h2 id="process-title">{tx('How it works')}</h2>

          <div className="figma-home__process-grid">
            {homepageProcessSteps.map((step) => (
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
          <h2 id="vacation-title">
            {tx(isPinasRewards ? 'Your dream vacation.' : 'Rewards you can use.')}<br />
            {tx(isPinasRewards ? 'Already paid for.' : 'Browse current offers.')}
          </h2>
          <p>{tx(isPinasRewards
            ? "Every Reward you earn stacks toward the Rewards Store — including the trip you've been putting off."
            : 'Available Rewards depend on current program and partner offers.')}</p>
          <Link className="figma-home__button" to="/join">{tx('Start earning today')}</Link>
        </div>
      </section>

      <section className="figma-home__faq" id="faq" aria-labelledby="faq-title">
        <div className="figma-home__container">
          <SectionEyebrow>{tx('GOOD TO KNOW')}</SectionEyebrow>
          <h2 id="faq-title">{tx('Frequently asked questions')}</h2>

          <div className="figma-home__faq-list">
            {homepageFaqs.map((faq) => (
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
              <a href={`mailto:${program.supportEmail}`}>{tx('Contact')}</a>
            </nav>
          </div>
          <div className="figma-home__footer-bottom">
            <p>© 2026 {program.name}. {tx('All rights reserved.')}</p>
            <p>{isPinasRewards ? 'Made for members in the Philippines' : `Made for members in ${program.countryCode}`}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
