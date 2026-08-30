import { ArrowRight, Gift, QrCode, Sparkles, Store, Users } from 'lucide-react'
import { Link } from 'react-router'

import wondertownHero from '@/assets/wondertown/wondertown-hero.webp'
import { useLanguage } from '@/lib/language'

import './wondertown-business-page.css'

const toolIcons = [QrCode, Gift, Users] as const

const wondertownBusinessCopy = {
  en: {
    alt: "A colorful illustrated view of Wondertown's fictional business district",
    heroEyebrow: 'Fictional businesses. Complete workflows.', title: 'Run the counter side of Wondertown.',
    heroBody: 'Test the business experience with safe demo data—from serving a member to confirming the resulting reward activity.',
    testBusiness: 'Test as a business', guide: 'Open the demo guide', toolsEyebrow: 'Behind the counter', toolsTitle: 'Everything needed for a safe end-to-end test.',
    tools: [
      ['Record a complete demo visit', 'Use the permanent business role to scan a member, record a purchase, and watch the same auditable rewards flow used by the platform.'],
      ['Try offers and redemptions', 'Review the fictional catalog, serve a customer, and verify how points, gift cards, and rewards move through each screen.'],
      ['Inspect customer history', 'See member activity and business records without touching a real customer, payment, or production partner account.'],
    ],
    stepsEyebrow: 'Three stops', stepsTitle: 'From sign-in to verified reward activity.',
    steps: [
      ['Choose the Business demo role', 'The test sign-in screen opens the permanent fictional business account without exposing credentials.'],
      ['Serve a Wondertown member', 'Use the business tools to record a visit or purchase against safe demo customer data.'],
      ['Confirm the full result', 'Review the business record, then switch roles to see the corresponding member reward and activity.'],
    ],
    ctaEyebrow: 'Ready for a test drive?', ctaTitle: 'Open the fictional shop.', ctaBody: 'No real customer, payment, or partner data is used.',
  },
  es: {
    alt: 'Una vista ilustrada y colorida del distrito comercial ficticio de Wondertown',
    heroEyebrow: 'Negocios ficticios. Flujos completos.', title: 'Dirige el mostrador de Wondertown.',
    heroBody: 'Prueba la experiencia del negocio con datos seguros, desde atender a un miembro hasta confirmar la actividad de recompensas resultante.',
    testBusiness: 'Probar como negocio', guide: 'Abrir la guía de demostración', toolsEyebrow: 'Tras el mostrador', toolsTitle: 'Todo lo necesario para una prueba segura de principio a fin.',
    tools: [
      ['Registra una visita de prueba completa', 'Usa el rol permanente de negocio para escanear a un miembro, registrar una compra y ver el mismo flujo auditable de recompensas de la plataforma.'],
      ['Prueba ofertas y canjes', 'Revisa el catálogo ficticio, atiende a un cliente y verifica cómo pasan los puntos, las tarjetas de regalo y las recompensas por cada pantalla.'],
      ['Revisa el historial del cliente', 'Consulta la actividad y los registros sin tocar datos de un cliente, pago o socio de producción real.'],
    ],
    stepsEyebrow: 'Tres paradas', stepsTitle: 'Del inicio de sesión a la actividad de recompensas verificada.',
    steps: [
      ['Elige el rol de demostración Negocio', 'La pantalla de prueba abre la cuenta permanente del negocio ficticio sin mostrar credenciales.'],
      ['Atiende a un miembro de Wondertown', 'Usa las herramientas del negocio para registrar una visita o compra con datos de prueba seguros.'],
      ['Confirma el resultado completo', 'Revisa el registro del negocio y luego cambia de rol para ver la recompensa y actividad correspondientes del miembro.'],
    ],
    ctaEyebrow: '¿Listo para una prueba?', ctaTitle: 'Abre la tienda ficticia.', ctaBody: 'No se usan datos reales de clientes, pagos ni socios.',
  },
  tl: {
    alt: 'Makulay na guhit ng kathang-isip na distrito ng negosyo sa Wondertown',
    heroEyebrow: 'Kathang-isip na negosyo. Kumpletong daloy.', title: 'Patakbuhin ang tindahan sa Wondertown.',
    heroBody: 'Subukan ang karanasan ng negosyo gamit ang ligtas na demo data, mula sa paglilingkod sa miyembro hanggang sa pagkumpirma ng reward activity.',
    testBusiness: 'Subukan bilang negosyo', guide: 'Buksan ang gabay sa demo', toolsEyebrow: 'Sa likod ng counter', toolsTitle: 'Lahat ng kailangan para sa ligtas na end-to-end na pagsubok.',
    tools: [
      ['Magtala ng kumpletong demo na pagbisita', 'Gamitin ang permanenteng business role para i-scan ang miyembro, itala ang bili, at tingnan ang nasusuring daloy ng rewards ng platform.'],
      ['Subukan ang mga alok at paggamit ng reward', 'Suriin ang kathang-isip na katalogo, maglingkod sa customer, at tiyakin kung paano dumadaloy ang points, gift card, at rewards sa bawat screen.'],
      ['Suriin ang kasaysayan ng customer', 'Tingnan ang aktibidad at tala nang hindi gumagamit ng tunay na customer, bayad, o production partner account.'],
    ],
    stepsEyebrow: 'Tatlong hintuan', stepsTitle: 'Mula pagpasok hanggang beripikadong reward activity.',
    steps: [
      ['Piliin ang demo role na Negosyo', 'Binubuksan ng test sign-in ang permanenteng kathang-isip na business account nang hindi inilalantad ang credentials.'],
      ['Paglingkuran ang miyembro ng Wondertown', 'Gamitin ang business tools para magtala ng pagbisita o bili gamit ang ligtas na demo customer data.'],
      ['Kumpirmahin ang buong resulta', 'Suriin ang business record at saka magpalit ng role upang makita ang kaugnay na reward at activity ng miyembro.'],
    ],
    ctaEyebrow: 'Handa na bang sumubok?', ctaTitle: 'Buksan ang kathang-isip na tindahan.', ctaBody: 'Walang tunay na customer, bayad, o partner data na ginagamit.',
  },
} as const

export function WondertownBusinessPage() {
  const { language } = useLanguage()
  const copy = wondertownBusinessCopy[language]

  return (
    <div className="wondertown-business">
      <section className="wondertown-business__hero" aria-labelledby="wondertown-business-title">
        <img src={wondertownHero} alt={copy.alt} />
        <div className="wondertown-business__hero-shade" />
        <div className="wondertown-business__wrap wondertown-business__hero-copy">
          <p><Sparkles aria-hidden="true" /> {copy.heroEyebrow}</p>
          <h1 id="wondertown-business-title">{copy.title}</h1>
          <span>{copy.heroBody}</span>
          <div>
            <Link className="wondertown-business__button" to="/signin?portal=business">{copy.testBusiness} <ArrowRight aria-hidden="true" /></Link>
            <Link className="wondertown-business__button wondertown-business__button--outline" to="/guide">{copy.guide}</Link>
          </div>
        </div>
      </section>

      <section className="wondertown-business__section" id="benefits" aria-labelledby="wondertown-business-tools">
        <div className="wondertown-business__wrap">
          <p className="wondertown-business__eyebrow">{copy.toolsEyebrow}</p>
          <h2 id="wondertown-business-tools">{copy.toolsTitle}</h2>
          <div className="wondertown-business__tools">
            {copy.tools.map(([title, body], index) => { const Icon = toolIcons[index]; return <article key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article> })}
          </div>
        </div>
      </section>

      <section className="wondertown-business__section wondertown-business__section--steps" id="how-it-works" aria-labelledby="wondertown-business-steps">
        <div className="wondertown-business__wrap">
          <p className="wondertown-business__eyebrow">{copy.stepsEyebrow}</p>
          <h2 id="wondertown-business-steps">{copy.stepsTitle}</h2>
          <ol>
            {copy.steps.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}
          </ol>
        </div>
      </section>

      <section className="wondertown-business__cta" id="get-started" aria-labelledby="wondertown-business-cta">
        <div className="wondertown-business__wrap">
          <Store aria-hidden="true" />
          <div><p className="wondertown-business__eyebrow">{copy.ctaEyebrow}</p><h2 id="wondertown-business-cta">{copy.ctaTitle}</h2><p>{copy.ctaBody}</p></div>
          <Link className="wondertown-business__button" to="/signin?portal=business">{copy.testBusiness} <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  )
}
