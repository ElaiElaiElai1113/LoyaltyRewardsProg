import {
  ArrowRight,
  BookOpen,
  Building2,
  CakeSlice,
  Coffee,
  Gift,
  Hotel,
  Scissors,
  Sparkles,
  Store,
} from 'lucide-react'
import { Link } from 'react-router'

import wondertownHero from '@/assets/wondertown/wondertown-hero.webp'
import wondertownHeroSmall from '@/assets/wondertown/wondertown-hero-768.webp'
import wondertownLegacyHero from '@/assets/wondertown/wondertown-hero.jpg'
import wondertownLegacyHeroSmall from '@/assets/wondertown/wondertown-hero-768.jpg'
import { LanguagePicker } from '@/components/language-picker'
import { type Language, useLanguage } from '@/lib/language'

import './wondertown-home.css'

const businessDefinitions = [
  { name: 'Moonbeam Café', icon: Coffee, className: 'wondertown-home__business-card--moonbeam' },
  { name: 'Dragonfly Books', icon: BookOpen, className: 'wondertown-home__business-card--dragonfly' },
  { name: 'Stardust Salon', icon: Scissors, className: 'wondertown-home__business-card--stardust' },
  { name: 'Lantern Hotel', icon: Hotel, className: 'wondertown-home__business-card--lantern' },
  { name: 'Cloud Nine Bakery', icon: CakeSlice, className: 'wondertown-home__business-card--cloud' },
] as const

const stepIcons = [Store, Sparkles, Gift] as const

interface WondertownHomeCopy {
  homeLabel: string
  navigationLabel: string
  exploreCity: string
  howItWorks: string
  forBusinesses: string
  memberSignIn: string
  enterWondertown: string
  heroAlt: string
  demoLabel: string
  heroTitleStart: string
  heroTitleEmphasis: string
  heroBody: string
  testMember: string
  testBusiness: string
  demoHighlightsLabel: string
  demoHighlights: readonly string[]
  welcomeEyebrow: string
  introTitleStart: string
  introTitleEnd: string
  introBody: string
  platformTour: string
  aroundTown: string
  meetLocals: string
  businessIntro: string
  businesses: readonly { type: string; description: string }[]
  stepsEyebrow: string
  stepsTitle: string
  stepsIntro: string
  steps: readonly { number: string; title: string; body: string }[]
  ctaEyebrow: string
  ctaTitle: string
  ctaBody: string
  signIn: string
  createAccount: string
  backToTop: string
  footerBody: string
  footerNavigationLabel: string
  privacy: string
  terms: string
  businessesLink: string
}

const wondertownHomeCopy: Record<Language, WondertownHomeCopy> = {
  en: {
    homeLabel: 'Wondertown Rewards home',
    navigationLabel: 'Primary navigation', exploreCity: 'Explore the city', howItWorks: 'How it works', forBusinesses: 'For businesses', memberSignIn: 'Member sign in', enterWondertown: 'Enter Wondertown',
    heroAlt: 'A colorful illustrated town square filled with friendly local businesses', demoLabel: 'A fictional city built for testing', heroTitleStart: 'Every little thing', heroTitleEmphasis: 'feels rewarding.', heroBody: 'Shop around Wondertown, collect Sparks, and turn everyday visits into delightful treats. The city is imaginary. The rewards experience is completely testable.', testMember: 'Test as a member', testBusiness: 'Test as a business', demoHighlightsLabel: 'Demo highlights', demoHighlights: ['Working logins', 'Real points flows', 'Safe demo data'],
    welcomeEyebrow: 'WELCOME, NEIGHBOR', introTitleStart: 'One tiny city.', introTitleEnd: 'A whole rewards platform.', introBody: 'Wondertown is a friendly sandbox for trying every part of the platform—from joining as a member to serving customers behind a business counter.', platformTour: 'Take the platform tour',
    aroundTown: 'AROUND TOWN', meetLocals: 'Meet the locals', businessIntro: 'Five whimsical businesses make the marketplace feel lived in while keeping every record clearly fictional.',
    businesses: [
      { type: 'Coffee & pastries', description: 'Cozy cups, cloud-soft pastries, and a little starlight with every visit.' },
      { type: 'Books & curiosities', description: 'Stories, stationery, and unexpected treasures for wonderfully curious people.' },
      { type: 'Hair & self-care', description: 'Fresh looks, bright moods, and feel-good rewards from the neighborhood stylists.' },
      { type: 'Stays & experiences', description: 'A storybook stay in the heart of town, complete with warm welcomes and local charm.' },
      { type: 'Bread & sweets', description: 'Dreamy bakes made every morning for celebrations, picnics, and ordinary Tuesdays.' },
    ],
    stepsEyebrow: 'HOW THE MAGIC WORKS', stepsTitle: 'Three stops. Full-circle testing.', stepsIntro: 'Use the permanent demo accounts to walk through the exact same member and business processes as every live tenant.',
    steps: [
      { number: '01', title: 'Meet the neighborhood', body: 'Create your member account and discover the fictional businesses around Wondertown.' },
      { number: '02', title: 'Collect a little magic', body: 'A business records your visit and your rewards appear in the same real platform flow.' },
      { number: '03', title: 'Treat yourself', body: 'Spend rewards on products, gift cards, and playful offers from participating businesses.' },
    ],
    ctaEyebrow: 'YOUR TEST DRIVE STARTS HERE', ctaTitle: 'Ready to try the whole town?', ctaBody: 'Sign in with a demo role, award a few Sparks, redeem an offer, and decide what the real programs should become.', signIn: 'Sign in', createAccount: 'Create account', backToTop: 'Back to the top', footerBody: 'A fictional city powered by real Rewards Platform workflows.', footerNavigationLabel: 'Footer navigation', privacy: 'Privacy', terms: 'Terms', businessesLink: 'Businesses',
  },
  es: {
    homeLabel: 'Inicio de Wondertown Rewards',
    navigationLabel: 'Navegación principal', exploreCity: 'Explora la ciudad', howItWorks: 'Cómo funciona', forBusinesses: 'Para negocios', memberSignIn: 'Acceso de miembro', enterWondertown: 'Entra a Wondertown',
    heroAlt: 'Una colorida plaza ilustrada llena de amigables negocios locales', demoLabel: 'Una ciudad ficticia creada para pruebas', heroTitleStart: 'Cada pequeño detalle', heroTitleEmphasis: 'se siente gratificante.', heroBody: 'Recorre Wondertown, reúne Sparks y convierte tus visitas cotidianas en premios encantadores. La ciudad es imaginaria. La experiencia de recompensas se puede probar por completo.', testMember: 'Probar como miembro', testBusiness: 'Probar como negocio', demoHighlightsLabel: 'Aspectos destacados de la demostración', demoHighlights: ['Accesos funcionales', 'Flujos reales de puntos', 'Datos de prueba seguros'],
    welcomeEyebrow: 'BIENVENIDO, VECINO', introTitleStart: 'Una ciudad pequeña.', introTitleEnd: 'Toda una plataforma de recompensas.', introBody: 'Wondertown es un entorno amigable para probar cada parte de la plataforma: desde unirse como miembro hasta atender clientes detrás del mostrador de un negocio.', platformTour: 'Recorre la plataforma',
    aroundTown: 'POR LA CIUDAD', meetLocals: 'Conoce a los locales', businessIntro: 'Cinco negocios fantásticos dan vida al mercado mientras mantienen cada registro claramente ficticio.',
    businesses: [
      { type: 'Café y pasteles', description: 'Tazas acogedoras, pasteles suaves como nubes y un poco de luz estelar en cada visita.' },
      { type: 'Libros y curiosidades', description: 'Historias, artículos de papelería y tesoros inesperados para personas maravillosamente curiosas.' },
      { type: 'Cabello y cuidado personal', description: 'Estilos renovados, buen ánimo y recompensas agradables de los estilistas del vecindario.' },
      { type: 'Estadías y experiencias', description: 'Una estadía de cuento en el centro, con cálidas bienvenidas y encanto local.' },
      { type: 'Pan y dulces', description: 'Deliciosos productos horneados cada mañana para celebraciones, picnics y martes comunes.' },
    ],
    stepsEyebrow: 'CÓMO FUNCIONA LA MAGIA', stepsTitle: 'Tres paradas. Una prueba completa.', stepsIntro: 'Usa las cuentas de demostración permanentes para recorrer los mismos procesos de miembros y negocios que cualquier programa activo.',
    steps: [
      { number: '01', title: 'Conoce el vecindario', body: 'Crea tu cuenta de miembro y descubre los negocios ficticios de Wondertown.' },
      { number: '02', title: 'Reúne un poco de magia', body: 'Un negocio registra tu visita y tus recompensas aparecen en el mismo flujo real de la plataforma.' },
      { number: '03', title: 'Date un gusto', body: 'Usa recompensas en productos, tarjetas de regalo y ofertas divertidas de los negocios participantes.' },
    ],
    ctaEyebrow: 'TU PRUEBA COMIENZA AQUÍ', ctaTitle: '¿Listo para probar toda la ciudad?', ctaBody: 'Inicia sesión con un rol de demostración, entrega algunos Sparks, canjea una oferta y decide en qué deberían convertirse los programas reales.', signIn: 'Iniciar sesión', createAccount: 'Crear cuenta', backToTop: 'Volver arriba', footerBody: 'Una ciudad ficticia impulsada por flujos reales de la plataforma de recompensas.', footerNavigationLabel: 'Navegación del pie de página', privacy: 'Privacidad', terms: 'Términos', businessesLink: 'Negocios',
  },
  tl: {
    homeLabel: 'Tahanan ng Wondertown Rewards',
    navigationLabel: 'Pangunahing nabigasyon', exploreCity: 'Tuklasin ang lungsod', howItWorks: 'Paano ito gumagana', forBusinesses: 'Para sa mga negosyo', memberSignIn: 'Pumasok bilang miyembro', enterWondertown: 'Pumasok sa Wondertown',
    heroAlt: 'Makulay na guhit ng liwasang bayan na puno ng magiliw na lokal na negosyo', demoLabel: 'Kathang-isip na lungsod para sa pagsubok', heroTitleStart: 'Bawat munting bagay', heroTitleEmphasis: 'ay may gantimpala.', heroBody: 'Mamasyal sa Wondertown, mangolekta ng Sparks, at gawing masasayang gantimpala ang pang-araw-araw na pagbisita. Kathang-isip ang lungsod. Lubos na masusubukan ang karanasan sa gantimpala.', testMember: 'Subukan bilang miyembro', testBusiness: 'Subukan bilang negosyo', demoHighlightsLabel: 'Mga tampok ng pagsubok', demoHighlights: ['Gumaganang pagpasok', 'Tunay na daloy ng puntos', 'Ligtas na datos ng pagsubok'],
    welcomeEyebrow: 'MALIGAYANG PAGDATING, KAPITBAHAY', introTitleStart: 'Isang munting lungsod.', introTitleEnd: 'Isang buong plataporma ng gantimpala.', introBody: 'Ang Wondertown ay magiliw na lugar upang subukan ang bawat bahagi ng plataporma—mula sa pagsali bilang miyembro hanggang sa pagsilbi sa kostumer sa mesa ng negosyo.', platformTour: 'Tingnan ang gabay sa plataporma',
    aroundTown: 'SA PALIGID NG BAYAN', meetLocals: 'Kilalanin ang mga lokal', businessIntro: 'Limang kakaibang negosyo ang nagbibigay-buhay sa pamilihan habang malinaw na kathang-isip ang bawat tala.',
    businesses: [
      { type: 'Kape at pastry', description: 'Mainit na kape, malalambot na pastry, at kaunting liwanag ng bituin sa bawat pagbisita.' },
      { type: 'Aklat at kakaibang bagay', description: 'Mga kuwento, stationery, at di-inaasahang yaman para sa mga likas na mausisa.' },
      { type: 'Buhok at pangangalaga sa sarili', description: 'Bagong ayos, masayang pakiramdam, at magagandang gantimpala mula sa mga tagapag-ayos sa kapitbahayan.' },
      { type: 'Tuluyan at karanasan', description: 'Parang kuwentong pananatili sa gitna ng bayan, may mainit na pagtanggap at lokal na alindog.' },
      { type: 'Tinapay at matatamis', description: 'Masasarap na bagong lutong pagkain tuwing umaga para sa pagdiriwang, piknik, at karaniwang Martes.' },
    ],
    stepsEyebrow: 'PAANO GUMAGANA ANG MAHIWAGA', stepsTitle: 'Tatlong hintuan. Kumpletong pagsubok.', stepsIntro: 'Gamitin ang permanenteng mga kuwentang pansubok upang sundan ang parehong proseso ng miyembro at negosyo na ginagamit ng bawat aktibong programa.',
    steps: [
      { number: '01', title: 'Kilalanin ang kapitbahayan', body: 'Gumawa ng kuwenta ng miyembro at tuklasin ang mga kathang-isip na negosyo sa Wondertown.' },
      { number: '02', title: 'Mangolekta ng kaunting mahika', body: 'Itinatala ng negosyo ang pagbisita mo at lalabas ang mga gantimpala sa parehong tunay na daloy ng plataporma.' },
      { number: '03', title: 'Bigyan ang sarili ng gantimpala', body: 'Gamitin ang mga gantimpala sa produkto, kard na regalo, at masasayang alok mula sa mga kalahok na negosyo.' },
    ],
    ctaEyebrow: 'DITO NAGSISIMULA ANG PAGSUBOK', ctaTitle: 'Handa ka na bang subukan ang buong bayan?', ctaBody: 'Pumasok gamit ang pansubok na tungkulin, magbigay ng ilang Sparks, gumamit ng alok, at magpasya kung ano ang dapat maging anyo ng tunay na programa.', signIn: 'Pumasok', createAccount: 'Gumawa ng kuwenta', backToTop: 'Bumalik sa itaas', footerBody: 'Kathang-isip na lungsod na pinapagana ng tunay na mga daloy ng gawain sa plataporma ng gantimpala.', footerNavigationLabel: 'Nabigasyon sa ibaba', privacy: 'Pagkapribado', terms: 'Mga tuntunin', businessesLink: 'Mga negosyo',
  },
}

export function WondertownHomePage() {
  const { language } = useLanguage()
  const copy = wondertownHomeCopy[language]

  return (
    <main className="wondertown-home" id="top">
      <header className="wondertown-home__header">
        <div className="wondertown-home__container wondertown-home__header-inner">
          <a className="wondertown-home__brand" href="#top" aria-label={copy.homeLabel}><img src="/wondertown-rewards-logo.svg" alt="" aria-hidden="true" /><span><strong>Wondertown</strong><small>Rewards</small></span></a>
          <nav className="wondertown-home__nav" aria-label={copy.navigationLabel}><a href="#businesses">{copy.exploreCity}</a><a href="#how-it-works">{copy.howItWorks}</a><Link to="/business">{copy.forBusinesses}</Link></nav>
          <div className="wondertown-home__header-actions"><LanguagePicker className="wondertown-home__language" compact condenseOnNarrowScreens /><Link className="wondertown-home__text-link" to="/signin">{copy.memberSignIn}</Link><Link className="wondertown-home__button wondertown-home__button--small wondertown-home__header-join" to="/join">{copy.enterWondertown}</Link></div>
        </div>
      </header>

      <section className="wondertown-home__hero" aria-labelledby="wondertown-hero-title" data-legacy-hero-assets={`${wondertownLegacyHeroSmall},${wondertownLegacyHero}`}>
        <img className="wondertown-home__hero-art" src={wondertownHero} srcSet={`${wondertownHeroSmall} 768w, ${wondertownHero} 1440w`} sizes="100vw" alt={copy.heroAlt} fetchPriority="high" />
        <div className="wondertown-home__hero-shade" />
        <div className="wondertown-home__container wondertown-home__hero-content">
          <div className="wondertown-home__demo-label"><Sparkles size={16} aria-hidden="true" />{copy.demoLabel}</div>
          <h1 id="wondertown-hero-title">{copy.heroTitleStart}<br /><em>{copy.heroTitleEmphasis}</em></h1>
          <p>{copy.heroBody}</p>
          <div className="wondertown-home__hero-actions"><Link className="wondertown-home__button" to="/signin">{copy.testMember} <ArrowRight size={18} aria-hidden="true" /></Link><Link className="wondertown-home__button wondertown-home__button--glass" to="/signin?portal=business">{copy.testBusiness}</Link></div>
          <ul className="wondertown-home__hero-notes" aria-label={copy.demoHighlightsLabel}>{copy.demoHighlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
        </div>
      </section>

      <section className="wondertown-home__intro" aria-labelledby="wondertown-intro-title"><div className="wondertown-home__container wondertown-home__intro-grid"><div><p className="wondertown-home__eyebrow">{copy.welcomeEyebrow}</p><h2 id="wondertown-intro-title">{copy.introTitleStart}<br />{copy.introTitleEnd}</h2></div><div className="wondertown-home__intro-copy"><p>{copy.introBody}</p><Link to="/guide">{copy.platformTour} <ArrowRight size={17} aria-hidden="true" /></Link></div></div></section>

      <section className="wondertown-home__businesses" id="businesses" aria-labelledby="wondertown-businesses-title"><div className="wondertown-home__container"><div className="wondertown-home__section-heading"><div><p className="wondertown-home__eyebrow">{copy.aroundTown}</p><h2 id="wondertown-businesses-title">{copy.meetLocals}</h2></div><p>{copy.businessIntro}</p></div><div className="wondertown-home__business-grid">{businessDefinitions.map((business, index) => { const Icon = business.icon; const localizedBusiness = copy.businesses[index]; return <article className={`wondertown-home__business-card ${business.className}`} key={business.name}><div className="wondertown-home__business-icon"><Icon size={30} aria-hidden="true" /></div><p>{localizedBusiness.type}</p><h3>{business.name}</h3><span>{localizedBusiness.description}</span></article> })}</div></div></section>

      <section className="wondertown-home__steps" id="how-it-works" aria-labelledby="wondertown-steps-title"><div className="wondertown-home__container"><p className="wondertown-home__eyebrow">{copy.stepsEyebrow}</p><div className="wondertown-home__steps-heading"><h2 id="wondertown-steps-title">{copy.stepsTitle}</h2><p>{copy.stepsIntro}</p></div><div className="wondertown-home__steps-grid">{copy.steps.map((step, index) => { const Icon = stepIcons[index]; return <article key={step.number}><div className="wondertown-home__step-top"><span>{step.number}</span><Icon size={25} aria-hidden="true" /></div><h3>{step.title}</h3><p>{step.body}</p></article> })}</div></div></section>

      <section className="wondertown-home__cta" aria-labelledby="wondertown-cta-title"><div className="wondertown-home__container wondertown-home__cta-card"><div className="wondertown-home__cta-orbit" aria-hidden="true" /><div><p className="wondertown-home__eyebrow">{copy.ctaEyebrow}</p><h2 id="wondertown-cta-title">{copy.ctaTitle}</h2><p>{copy.ctaBody}</p></div><div className="wondertown-home__cta-actions"><Link className="wondertown-home__button" to="/signin">{copy.signIn}</Link><Link className="wondertown-home__button wondertown-home__button--outline" to="/join">{copy.createAccount}</Link></div></div></section>

      <footer className="wondertown-home__footer"><div className="wondertown-home__container wondertown-home__footer-inner"><a className="wondertown-home__brand" href="#top" aria-label={copy.backToTop}><img src="/wondertown-rewards-logo.svg" alt="" aria-hidden="true" /><span><strong>Wondertown</strong><small>Rewards</small></span></a><p><Building2 size={16} aria-hidden="true" /> {copy.footerBody}</p><nav aria-label={copy.footerNavigationLabel}><Link to="/privacy">{copy.privacy}</Link><Link to="/terms">{copy.terms}</Link><Link to="/business">{copy.businessesLink}</Link></nav></div></footer>
    </main>
  )
}
