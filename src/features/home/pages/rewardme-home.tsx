import { ArrowRight, Bookmark, Check, LockKeyhole, Store } from 'lucide-react'
import { Link } from 'react-router'

import coffeeMember from '@/assets/landing/coffee-member-wide.webp'
import coffeeMemberSmall from '@/assets/landing/coffee-member-wide-768.webp'
import dinnerRewards from '@/assets/landing/dinner-rewards.webp'
import localBusinessOwner from '@/assets/business/local-business-owner-wide.webp'
import { LanguagePicker } from '@/components/language-picker'
import { type Language, useLanguage } from '@/lib/language'

import './rewardme-home.css'

interface RewardMeHomeCopy {
  homeLabel: string
  navigationLabel: string
  howItWorks: string
  store: string
  savingsPlan: string
  forBusinesses: string
  signIn: string
  startFreeAccess: string
  heroEyebrow: string
  heroTitle: string
  heroLead: string
  heroAction: string
  seeHowItWorks: string
  finePrint: string
  ledgerLabel: string
  accountTitle: string
  illustration: string
  ledgerRows: readonly { label: string; value: string }[]
  savingsRow: string
  planned: string
  availableToRedeem: string
  ledgerNote: string
  featureAlt: string
  featureCaption: string
  howEyebrow: string
  howTitle: string
  howIntro: string
  steps: readonly { number: string; title: string; body: string }[]
  storeEyebrow: string
  storeTitle: string
  storeBody: string
  browseStore: string
  storeImageAlt: string
  ratesEyebrow: string
  ratesTitle: string
  ratesIntro: string
  rates: readonly { label: string; value: string; body: string }[]
  savingsEyebrow: string
  savingsTitle: string
  savingsBody: string
  plannedLabel: string
  plannedTitle: string
  plannedBody: string
  membershipEyebrow: string
  membershipTitle: string
  membershipIntro: string
  plans: readonly { name: string; price: string; description: string; featured: boolean }[]
  recommended: string
  offerTerms: string
  compareMemberships: string
  businessEyebrow: string
  businessTitle: string
  businessBody: string
  businessAction: string
  businessImageAlt: string
  bridgeTitle: string
  bridgeBody: string
  footerMotto: string
  footerNavigationLabel: string
  membership: string
  businesses: string
}

const rewardMeHomeCopy: Record<Language, RewardMeHomeCopy> = {
  en: {
    homeLabel: 'RewardMe home',
    navigationLabel: 'RewardMe navigation', howItWorks: 'How it works', store: 'The store', savingsPlan: 'Savings plan', forBusinesses: 'For businesses', signIn: 'Sign in', startFreeAccess: 'Start free access',
    heroEyebrow: '3 MONTHS FREE TO EXPLORE', heroTitle: "Turn what you already spend into what you're saving for.", heroLead: 'RewardMe connects everyday spending with meaningful member rewards from participating local businesses.', heroAction: 'Start your free access', seeHowItWorks: 'See how it works', finePrint: 'Three-month free access. No payment card is required to create an account. No rewards or referral bonuses are paid during the trial.',
    ledgerLabel: 'Illustrative RewardMe account activity', accountTitle: 'My RewardMe Account', illustration: 'ILLUSTRATION',
    ledgerRows: [
      { label: 'Coffee run · 20% back', value: '+ $1' },
      { label: 'Dinner out · 10% off-peak', value: '+ $6' },
      { label: 'Weekend stay · 20% back', value: '+ $48' },
    ],
    savingsRow: 'Moved to savings plan', planned: 'planned', availableToRedeem: 'AVAILABLE TO REDEEM', ledgerNote: 'Example active-member activity only. Actual offers, rates, and availability vary by participating business.',
    featureAlt: 'A customer checking a mobile rewards account in a local café', featureCaption: 'Earn where you already shop, eat, and stay.',
    howEyebrow: 'HOW IT WORKS', howTitle: "Three steps. That's the whole system.", howIntro: 'The trial lets you explore the program first. Reward earning begins only after the RewardMe team manually activates an eligible membership.',
    steps: [
      { number: '01', title: 'Join with three-month free access', body: 'Create an account with your email, phone number, and password. No card is collected during signup.' },
      { number: '02', title: 'Request a membership', body: 'After the trial, request Regular or Gold access. The RewardMe team reviews and manually activates eligible memberships.' },
      { number: '03', title: 'Redeem, or save it', body: 'Use earned Rewards on available store offers. A longer-term savings feature is planned, but is not live yet.' },
    ],
    storeEyebrow: 'THE STORE', storeTitle: 'Rewards are credit you can use on available partner offers.', storeBody: 'Browse the live catalog, then sign in to redeem eligible items. Inventory and offer terms are set by participating businesses.', browseStore: 'Browse the store', storeImageAlt: 'A table set for a local dining reward',
    ratesEyebrow: 'REWARD RATES', ratesTitle: 'Most places, 20% or more back. Some days, all of it.', ratesIntro: 'These are program targets from the RewardMe model. The rate shown on an active offer is the rate that applies.',
    rates: [
      { label: 'EVERYDAY SPOTS', value: '20%+', body: 'Most participating restaurants, cafés, hotels, shops, and services.' },
      { label: 'SLOW-TIME SPECIALS', value: '100%', body: 'Selected partners may return the full qualifying amount in Rewards during an eligible off-peak offer.' },
      { label: 'BIG PURCHASES', value: '<20%', body: 'Cars, real estate, and other high-ticket categories may use a smaller percentage.' },
    ],
    savingsEyebrow: 'SAVINGS CONCEPT', savingsTitle: "Save it. Don't spend it. Watch it grow.", savingsBody: 'The pitch deck describes locking eligible Rewards toward a longer-term goal. This feature is planned and is not accepting deposits or locking balances yet.', plannedLabel: 'PLANNED · NOT LIVE', plannedTitle: '12-month lock concept', plannedBody: 'Final terms, eligibility, and payout rules will be published before launch.',
    membershipEyebrow: 'MEMBERSHIP', membershipTitle: "Start free. Upgrade when you're ready to earn more.", membershipIntro: 'Public pricing and reward terms follow the RewardMe pitch deck. RewardMe does not collect payments online; Regular and Gold access is activated manually.',
    plans: [
      { name: 'Free', price: '$0', description: 'Earn up to 10% back. Referral bonuses are not included. Eligible retroactive bonuses may apply after an upgrade.', featured: false },
      { name: 'Regular', price: '$25/month', description: 'Earn 20%–100% back, receive the full member store experience, and get $10 for each qualifying referral after manual activation.', featured: true },
      { name: 'Gold', price: '$100/year', description: 'Full access plus the Gold referral schedule: three monthly rewards for Regular referrals or a $100 reward for Gold referrals.', featured: false },
    ],
    recommended: 'RECOMMENDED', offerTerms: 'Offer terms and eligibility apply', compareMemberships: 'Compare membership options',
    businessEyebrow: 'FOR BUSINESSES', businessTitle: 'Bring RewardMe members through your door.', businessBody: "Partners can participate through a Commission model or a Business-credit model. RewardMe's platform share is a 25% commission on Rewards spent.", businessAction: 'See how businesses join', businessImageAlt: 'A local business owner welcoming RewardMe members', bridgeTitle: 'Synergize bridge', bridgeBody: 'Business credits from the separate Synergize network may help fund RewardMe offers that create paying customer activity. Each product keeps its own audience and terms.',
    footerMotto: 'Earn where you already spend. Save toward what matters.', footerNavigationLabel: 'Footer navigation', membership: 'Membership', businesses: 'Businesses',
  },
  es: {
    homeLabel: 'Inicio de RewardMe',
    navigationLabel: 'Navegación de RewardMe', howItWorks: 'Cómo funciona', store: 'La tienda', savingsPlan: 'Plan de ahorro', forBusinesses: 'Para negocios', signIn: 'Iniciar sesión', startFreeAccess: 'Comenzar acceso gratis',
    heroEyebrow: '3 MESES GRATIS PARA EXPLORAR', heroTitle: 'Convierte lo que ya gastas en aquello para lo que estás ahorrando.', heroLead: 'RewardMe conecta tus gastos diarios con recompensas valiosas de negocios locales participantes.', heroAction: 'Comienza tu acceso gratis', seeHowItWorks: 'Descubre cómo funciona', finePrint: 'Tres meses de acceso gratuito. No se requiere tarjeta de pago para crear una cuenta. Durante la prueba no se pagan recompensas ni bonos por referidos.',
    ledgerLabel: 'Actividad ilustrativa de una cuenta RewardMe', accountTitle: 'Mi cuenta RewardMe', illustration: 'ILUSTRACIÓN',
    ledgerRows: [
      { label: 'Café · 20% de vuelta', value: '+ $1' },
      { label: 'Cena · 10% en horario tranquilo', value: '+ $6' },
      { label: 'Estadía de fin de semana · 20% de vuelta', value: '+ $48' },
    ],
    savingsRow: 'Movido al plan de ahorro', planned: 'planificado', availableToRedeem: 'DISPONIBLE PARA CANJEAR', ledgerNote: 'Solo es un ejemplo de actividad de un miembro activo. Las ofertas, tasas y disponibilidad varían según el negocio participante.',
    featureAlt: 'Una persona revisa su cuenta móvil de recompensas en un café local', featureCaption: 'Gana donde ya compras, comes y te hospedas.',
    howEyebrow: 'CÓMO FUNCIONA', howTitle: 'Tres pasos. Ese es todo el sistema.', howIntro: 'La prueba te permite explorar primero. Solo comienzas a ganar cuando el equipo de RewardMe activa manualmente una membresía elegible.',
    steps: [
      { number: '01', title: 'Únete con tres meses de acceso gratis', body: 'Crea una cuenta con tu correo, teléfono y contraseña. No se solicita tarjeta durante el registro.' },
      { number: '02', title: 'Solicita una membresía', body: 'Después de la prueba, solicita acceso Regular o Gold. El equipo de RewardMe revisa y activa manualmente las membresías elegibles.' },
      { number: '03', title: 'Canjea o ahorra', body: 'Usa tus recompensas en ofertas disponibles de la tienda. Se planea una función de ahorro a largo plazo, pero aún no está activa.' },
    ],
    storeEyebrow: 'LA TIENDA', storeTitle: 'Tus recompensas son crédito para usar en ofertas disponibles de aliados.', storeBody: 'Explora el catálogo activo e inicia sesión para canjear artículos elegibles. El inventario y los términos los define cada negocio participante.', browseStore: 'Explorar la tienda', storeImageAlt: 'Una mesa preparada para una recompensa gastronómica local',
    ratesEyebrow: 'TASAS DE RECOMPENSA', ratesTitle: 'En la mayoría de lugares, 20% o más. Algunos días, todo.', ratesIntro: 'Estas son metas del modelo RewardMe. Siempre se aplica la tasa indicada en la oferta activa.',
    rates: [
      { label: 'LUGARES COTIDIANOS', value: '20%+', body: 'La mayoría de restaurantes, cafés, hoteles, tiendas y servicios participantes.' },
      { label: 'OFERTAS EN HORAS TRANQUILAS', value: '100%', body: 'Algunos aliados pueden devolver todo el monto elegible en recompensas durante una oferta en horario tranquilo.' },
      { label: 'COMPRAS GRANDES', value: '<20%', body: 'Autos, bienes raíces y otras categorías de alto valor pueden usar un porcentaje menor.' },
    ],
    savingsEyebrow: 'CONCEPTO DE AHORRO', savingsTitle: 'Ahorra. No lo gastes. Mira cómo crece.', savingsBody: 'La presentación propone reservar recompensas elegibles para una meta a largo plazo. Esta función está planificada y todavía no acepta depósitos ni bloquea saldos.', plannedLabel: 'PLANIFICADO · NO ACTIVO', plannedTitle: 'Concepto de reserva por 12 meses', plannedBody: 'Los términos, requisitos y reglas de pago finales se publicarán antes del lanzamiento.',
    membershipEyebrow: 'MEMBRESÍA', membershipTitle: 'Empieza gratis. Mejora cuando quieras ganar más.', membershipIntro: 'Los precios y términos públicos siguen la presentación de RewardMe. RewardMe no cobra en línea; el acceso Regular y Gold se activa manualmente.',
    plans: [
      { name: 'Gratis', price: '$0', description: 'Gana hasta 10% de vuelta. No incluye bonos por referidos. Algunos bonos retroactivos elegibles pueden aplicarse después de mejorar.', featured: false },
      { name: 'Regular', price: '$25/mes', description: 'Gana entre 20% y 100%, accede a toda la tienda para miembros y recibe $10 por cada referido elegible después de la activación manual.', featured: true },
      { name: 'Gold', price: '$100/año', description: 'Acceso completo y calendario Gold de referidos: tres recompensas mensuales por referidos Regular o una recompensa de $100 por referidos Gold.', featured: false },
    ],
    recommended: 'RECOMENDADO', offerTerms: 'Aplican términos y requisitos de la oferta', compareMemberships: 'Comparar membresías',
    businessEyebrow: 'PARA NEGOCIOS', businessTitle: 'Recibe a miembros de RewardMe en tu negocio.', businessBody: 'Los aliados pueden participar mediante un modelo de comisión o de crédito comercial. La participación de la plataforma RewardMe es una comisión del 25% sobre las recompensas utilizadas.', businessAction: 'Cómo se unen los negocios', businessImageAlt: 'Propietaria de un negocio local dando la bienvenida a miembros de RewardMe', bridgeTitle: 'Puente con Synergize', bridgeBody: 'Los créditos comerciales de la red independiente Synergize pueden ayudar a financiar ofertas de RewardMe que generen actividad de clientes que pagan. Cada producto mantiene su propio público y términos.',
    footerMotto: 'Gana donde ya gastas. Ahorra para lo que importa.', footerNavigationLabel: 'Navegación del pie de página', membership: 'Membresía', businesses: 'Negocios',
  },
  tl: {
    homeLabel: 'Tahanan ng RewardMe',
    navigationLabel: 'Nabigasyon ng RewardMe', howItWorks: 'Paano ito gumagana', store: 'Ang tindahan', savingsPlan: 'Plano sa pag-iipon', forBusinesses: 'Para sa mga negosyo', signIn: 'Pumasok', startFreeAccess: 'Simulan ang libreng pagpasok',
    heroEyebrow: '3 BUWANG LIBRE PARA SUBUKAN', heroTitle: 'Gawing ipon para sa mahalaga ang karaniwan mo nang gastos.', heroLead: 'Iniuugnay ng RewardMe ang pang-araw-araw na gastos sa makabuluhang gantimpala mula sa mga kalahok na lokal na negosyo.', heroAction: 'Simulan ang libreng pagpasok', seeHowItWorks: 'Tingnan kung paano', finePrint: 'Tatlong buwang libreng pagpasok. Walang kard pambayad na kailangan sa paggawa ng kuwenta. Walang gantimpalang dagdag sa pagsangguni na ibinibigay habang nagsusubok.',
    ledgerLabel: 'Halimbawang aktibidad ng kuwenta sa RewardMe', accountTitle: 'Aking Kuwenta sa RewardMe', illustration: 'HALIMBAWA',
    ledgerRows: [
      { label: 'Kape · 20% balik', value: '+ $1' },
      { label: 'Hapunan · 10% sa tahimik na oras', value: '+ $6' },
      { label: 'Bakasyon sa katapusan ng linggo · 20% balik', value: '+ $48' },
    ],
    savingsRow: 'Inilipat sa plano sa pag-iipon', planned: 'nakaplano', availableToRedeem: 'MAAARING GAMITIN', ledgerNote: 'Halimbawa lamang ito ng aktibidad ng aktibong miyembro. Nag-iiba ang aktuwal na alok, antas, at pagkakaroon ayon sa kalahok na negosyo.',
    featureAlt: 'Tinitingnan ng kostumer ang pitaka ng gantimpala sa telepono sa isang lokal na kapihan', featureCaption: 'Kumita kung saan ka namimili, kumakain, at tumutuloy.',
    howEyebrow: 'PAANO ITO GUMAGANA', howTitle: 'Tatlong hakbang. Iyon na ang buong sistema.', howIntro: 'Maaari mo munang tuklasin ang programa habang nagsusubok. Magsisimula lamang ang pagkita kapag manu-manong pinagana ng pangkat ng RewardMe ang kuwalipikadong pagiging kasapi.',
    steps: [
      { number: '01', title: 'Sumali gamit ang tatlong buwang libreng pagpasok', body: 'Gumawa ng kuwenta gamit ang email, numero ng telepono, at sandi. Walang kard na kukunin habang nagrerehistro.' },
      { number: '02', title: 'Humiling ng pagiging kasapi', body: 'Pagkatapos ng pagsubok, humiling ng Regular o Gold na pagpasok. Sinusuri at manu-manong pinapagana ng pangkat ng RewardMe ang kuwalipikadong pagiging kasapi.' },
      { number: '03', title: 'Gamitin o ipunin', body: 'Gamitin ang kinita mong gantimpala sa mga magagamit na alok sa tindahan. Nakaplano ang pangmatagalang pag-iipon, ngunit hindi pa ito gumagana.' },
    ],
    storeEyebrow: 'ANG TINDAHAN', storeTitle: 'Ang mga gantimpala ay kreditong magagamit sa mga alok ng katuwang.', storeBody: 'Tingnan ang kasalukuyang talaan at pumasok upang gamitin ang mga kuwalipikadong bagay. Ang mga kalahok na negosyo ang nagtatakda ng imbentaryo at tuntunin ng alok.', browseStore: 'Tingnan ang tindahan', storeImageAlt: 'Mesa na inihanda para sa gantimpalang pagkain sa lokal na kainan',
    ratesEyebrow: 'MGA ANTAS NG GANTIMPALA', ratesTitle: 'Sa karamihan ng lugar, 20% o higit pa. Sa ilang araw, lahat.', ratesIntro: 'Mga layunin ito ng balangkas ng RewardMe. Ang antas sa aktibong alok ang siyang susundin.',
    rates: [
      { label: 'PANG-ARAW-ARAW NA LUGAR', value: '20%+', body: 'Karamihan ng kalahok na kainan, kapihan, tuluyan, tindahan, at serbisyo.' },
      { label: 'ALOK SA TAHIMIK NA ORAS', value: '100%', body: 'Maaaring ibalik ng piling katuwang ang buong kuwalipikadong halaga bilang gantimpala sa alok sa oras na hindi matao.' },
      { label: 'MALALAKING BILI', value: '<20%', body: 'Maaaring gumamit ng mas mababang porsiyento ang sasakyan, ari-arian, at iba pang mataas ang halaga.' },
    ],
    savingsEyebrow: 'KONSEPTO NG PAG-IIPON', savingsTitle: 'Ipunin. Huwag gastusin. Panooring lumago.', savingsBody: 'Inilalarawan ng presentasyon ang pagtatabi ng kuwalipikadong gantimpala para sa pangmatagalang layunin. Nakaplano pa ito at hindi pa tumatanggap ng deposito o nagtatabi ng balanse.', plannedLabel: 'NAKAPLANO · HINDI PA GUMAGANA', plannedTitle: 'Konsepto ng 12-buwang pagtatabi', plannedBody: 'Ilalathala bago ilunsad ang pinal na tuntunin, pagiging karapat-dapat, at patakaran sa pagbibigay.',
    membershipEyebrow: 'PAGIGING KASAPI', membershipTitle: 'Magsimula nang libre. Taasan ang antas kapag handa ka nang kumita pa.', membershipIntro: 'Ang pampublikong presyo at tuntunin ay ayon sa presentasyon ng RewardMe. Hindi naniningil sa internet ang RewardMe; manu-manong pinapagana ang Regular at Gold na pagpasok.',
    plans: [
      { name: 'Libre', price: '$0', description: 'Kumita ng hanggang 10% balik. Hindi kasama ang dagdag na gantimpala sa pagsangguni. Maaaring idagdag ang kuwalipikadong naunang gantimpala pagkatapos itaas ang antas.', featured: false },
      { name: 'Regular', price: '$25/buwan', description: 'Kumita ng 20%–100%, gamitin ang buong tindahan ng miyembro, at makatanggap ng $10 sa bawat kuwalipikadong pagsangguni pagkatapos ng manu-manong pagpapaandar.', featured: true },
      { name: 'Gold', price: '$100/taon', description: 'Buong pagpasok at talaan ng pagsangguni sa Gold: tatlong buwanang gantimpala para sa pagsangguni sa Regular o $100 gantimpala para sa pagsangguni sa Gold.', featured: false },
    ],
    recommended: 'INIREREKOMENDA', offerTerms: 'May nalalapat na tuntunin at pagiging karapat-dapat ang alok', compareMemberships: 'Ihambing ang pagiging kasapi',
    businessEyebrow: 'PARA SA MGA NEGOSYO', businessTitle: 'Anyayahan ang mga miyembro ng RewardMe sa iyong negosyo.', businessBody: 'Maaaring lumahok ang mga katuwang sa paraang may komisyon o kreditong pangnegosyo. Ang bahagi ng plataporma ng RewardMe ay 25% komisyon sa nagamit na gantimpala.', businessAction: 'Tingnan kung paano sumali ang negosyo', businessImageAlt: 'May-ari ng lokal na negosyong tumatanggap sa mga kasapi ng RewardMe', bridgeTitle: 'Tulay sa Synergize', bridgeBody: 'Maaaring tumulong ang mga kreditong pangnegosyo mula sa hiwalay na ugnayan ng Synergize sa pagpondo ng mga alok ng RewardMe na lumilikha ng aktibidad ng nagbabayad na kostumer. May sariling mga gumagamit at tuntunin ang bawat produkto.',
    footerMotto: 'Kumita kung saan ka na gumagastos. Mag-ipon para sa mahalaga.', footerNavigationLabel: 'Nabigasyon sa ibaba', membership: 'Pagiging kasapi', businesses: 'Mga negosyo',
  },
}

export function RewardMeHomePage() {
  const { language } = useLanguage()
  const copy = rewardMeHomeCopy[language]
  const heroVideoUrl = import.meta.env.VITE_REWARDME_HERO_VIDEO_URL?.trim()

  return (
    <div className="rewardme-home">
      <div className="rewardme-home__dark-intro">
        <header className="rewardme-home__header">
        <Link className="rewardme-home__brand" to="/" aria-label={copy.homeLabel}><Bookmark aria-hidden="true" /><span>RewardMe</span></Link>
        <nav className="rewardme-home__nav" aria-label={copy.navigationLabel}><a href="#how-it-works">{copy.howItWorks}</a><Link to="/shop">{copy.store}</Link><a href="#savings">{copy.savingsPlan}</a><Link to="/business">{copy.forBusinesses}</Link></nav>
        <div className="rewardme-home__header-actions"><LanguagePicker className="rewardme-home__language" compact condenseOnNarrowScreens /><Link className="rewardme-home__text-link" to="/signin">{copy.signIn}</Link><Link className="rewardme-home__button rewardme-home__button--small rewardme-home__header-join" to="/join">{copy.startFreeAccess}</Link></div>
        </header>

        <section className="rewardme-home__hero" aria-labelledby="rewardme-hero-title">
          <div className="rewardme-home__hero-copy"><p className="rewardme-home__eyebrow">{copy.heroEyebrow}</p><h1 id="rewardme-hero-title">{copy.heroTitle}</h1><p className="rewardme-home__lead">{copy.heroLead}</p><div className="rewardme-home__actions"><Link className="rewardme-home__button" to="/join">{copy.heroAction}</Link><a className="rewardme-home__button rewardme-home__button--outline" href="#how-it-works">{copy.seeHowItWorks}</a></div><p className="rewardme-home__fine-print">{copy.finePrint}</p></div>
          <div className="rewardme-home__hero-visual">
            <figure className="rewardme-home__hero-media">
              {heroVideoUrl ? <video autoPlay loop muted playsInline poster={coffeeMember}><source src={heroVideoUrl} type="video/mp4" /></video> : <picture><source media="(max-width: 720px)" srcSet={coffeeMemberSmall} /><img src={coffeeMember} alt={copy.featureAlt} decoding="async" fetchPriority="high" /></picture>}
              <figcaption>{copy.featureCaption}</figcaption>
            </figure>
            <aside className="rewardme-home__ledger" aria-label={copy.ledgerLabel}><div className="rewardme-home__ledger-head"><strong>{copy.accountTitle}</strong><span>{copy.illustration}</span></div>{copy.ledgerRows.map((row) => <div className="rewardme-home__ledger-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}<div className="rewardme-home__ledger-row"><span>{copy.savingsRow}</span><strong><LockKeyhole aria-hidden="true" /> {copy.planned}</strong></div><div className="rewardme-home__ledger-total"><span>{copy.availableToRedeem}</span><strong>$109</strong></div><p>{copy.ledgerNote}</p></aside>
          </div>
        </section>
      </div>

      <main>
        <section className="rewardme-home__section" id="how-it-works" aria-labelledby="rewardme-how-title"><p className="rewardme-home__eyebrow">{copy.howEyebrow}</p><div className="rewardme-home__section-heading"><h2 id="rewardme-how-title">{copy.howTitle}</h2><p>{copy.howIntro}</p></div><ol className="rewardme-home__steps">{copy.steps.map((step) => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol></section>

        <section className="rewardme-home__section rewardme-home__store" aria-labelledby="rewardme-store-title"><div><p className="rewardme-home__eyebrow">{copy.storeEyebrow}</p><h2 id="rewardme-store-title">{copy.storeTitle}</h2><p>{copy.storeBody}</p><div className="rewardme-home__actions"><Link className="rewardme-home__button" to="/shop"><Store aria-hidden="true" /> {copy.browseStore}</Link><Link className="rewardme-home__button rewardme-home__button--outline" to="/signin">{copy.signIn}</Link></div></div><img src={dinnerRewards} alt={copy.storeImageAlt} loading="lazy" decoding="async" /></section>

        <section className="rewardme-home__section" aria-labelledby="rewardme-rates-title"><p className="rewardme-home__eyebrow">{copy.ratesEyebrow}</p><div className="rewardme-home__section-heading"><h2 id="rewardme-rates-title">{copy.ratesTitle}</h2><p>{copy.ratesIntro}</p></div><div className="rewardme-home__rates">{copy.rates.map((rate) => <article key={rate.label}><span>{rate.label}</span><strong>{rate.value}</strong><p>{rate.body}</p></article>)}</div></section>

        <section className="rewardme-home__savings" id="savings" aria-labelledby="rewardme-savings-title"><div><p className="rewardme-home__eyebrow">{copy.savingsEyebrow}</p><h2 id="rewardme-savings-title">{copy.savingsTitle}</h2><p>{copy.savingsBody}</p></div><div className="rewardme-home__planned-card"><span>{copy.plannedLabel}</span><strong>{copy.plannedTitle}</strong><p>{copy.plannedBody}</p></div></section>

        <section className="rewardme-home__section" id="membership" aria-labelledby="rewardme-membership-title"><p className="rewardme-home__eyebrow">{copy.membershipEyebrow}</p><div className="rewardme-home__section-heading"><h2 id="rewardme-membership-title">{copy.membershipTitle}</h2><p>{copy.membershipIntro}</p></div><div className="rewardme-home__plans">{copy.plans.map((plan) => <article className={plan.featured ? 'rewardme-home__plan--featured' : undefined} key={plan.name}>{plan.featured ? <span className="rewardme-home__plan-label">{copy.recommended}</span> : null}<h3>{plan.name}</h3><strong>{plan.price}</strong><p>{plan.description}</p><p className="rewardme-home__plan-check"><Check aria-hidden="true" /> {copy.offerTerms}</p></article>)}</div><div className="rewardme-home__center-action"><Link className="rewardme-home__button" to="/membership">{copy.compareMemberships} <ArrowRight aria-hidden="true" /></Link></div></section>

        <section className="rewardme-home__business" aria-labelledby="rewardme-business-title"><img src={localBusinessOwner} alt={copy.businessImageAlt} loading="lazy" decoding="async" /><div className="rewardme-home__business-copy"><p className="rewardme-home__eyebrow">{copy.businessEyebrow}</p><h2 id="rewardme-business-title">{copy.businessTitle}</h2><p>{copy.businessBody}</p><Link className="rewardme-home__button rewardme-home__button--outline" to="/business">{copy.businessAction} <ArrowRight aria-hidden="true" /></Link><div className="rewardme-home__bridge"><strong>{copy.bridgeTitle}</strong><p>{copy.bridgeBody}</p></div></div></section>
      </main>

      <footer className="rewardme-home__footer"><div className="rewardme-home__brand"><Bookmark aria-hidden="true" /><span>RewardMe</span></div><p>{copy.footerMotto}</p><nav aria-label={copy.footerNavigationLabel}><a href="#how-it-works">{copy.howItWorks}</a><Link to="/shop">{copy.store}</Link><Link to="/membership">{copy.membership}</Link><Link to="/business">{copy.businesses}</Link></nav></footer>
    </div>
  )
}
