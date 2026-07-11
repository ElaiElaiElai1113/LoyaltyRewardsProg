import {
  BarChart3,
  Calculator,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gift,
  Handshake,
  QrCode,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { useLanguage, type Language } from '@/lib/language'

const businessPillIcons = [QrCode, Handshake, Gift, ShieldCheck] as const
const outcomeIcons = [QrCode, Handshake, Gift, BarChart3] as const
const onboardingStepIcons = [FileText, ClipboardCheck, UserPlus] as const
const faqIcons = [QrCode, Calculator, ShieldCheck] as const

const pageCopy: Record<Language, {
  heroBadge: string
  heroTitleBefore: string
  heroTitleHighlight: string
  heroTitleAfter: string
  heroParagraphs: string[]
  qrRowBefore: string
  qrRowStrong: string
  qrRowAfter: string
  portalRow: string
  businessPills: string[]
  startOnboarding: string
  businessLogin: string
  howHeading: string
  howLead: string
  onboardingSteps: Array<{ title: string; body: string }>
  toolsHeading: string
  toolsLead: string
  outcomes: Array<{ title: string; body: string }>
  checklistBadge: string
  checklistHeading: string
  proofPoints: string[]
  costCalculator: string
  formBadge: string
  formHeading: string
  formLead: string
  nameLabel: string
  namePlaceholder: string
  businessLabel: string
  businessPlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  phoneLabel: string
  phonePlaceholder: string
  notesLabel: string
  notesPlaceholder: string
  submittedMessage: string
  helperText: string
  requestButton: string
  faqHeading: string
  faqs: Array<{ question: string; answer: string }>
}> = {
  en: {
    heroBadge: 'Business onboarding',
    heroTitleBefore: 'Join the ',
    heroTitleHighlight: 'rewards network',
    heroTitleAfter: ' members already want to use',
    heroParagraphs: [
      'Medellin Rewards gives businesses a simple QR sale flow, customer rewards, partner attribution, and launch steps in one clear portal.',
      'Owners can review the model, prepare the first offer, and understand the commission math before the business goes live.',
    ],
    qrRowBefore: 'Let customers show their ',
    qrRowStrong: 'Medellin Rewards QR',
    qrRowAfter: ' so your staff can record purchases and award points.',
    portalRow: 'Track reward value, member sales, and Medellin Rewards commission from the same business portal.',
    businessPills: ['QR customer sales', 'Partner referrals', 'Reward offers', 'Commission tracking'],
    startOnboarding: 'Start Onboarding',
    businessLogin: 'Business Login',
    howHeading: 'How business onboarding works',
    howLead: 'Three simple steps from presentation to live QR sales',
    onboardingSteps: [
      {
        title: 'Watch the presentation',
        body: 'A simple video explains how members earn Rewards, how businesses participate, and what launch support looks like.',
      },
      {
        title: 'Fit check',
        body: 'We confirm your category, reward percentage, hard costs, and the best first offer for members.',
      },
      {
        title: 'Sign up and launch',
        body: 'Your business portal, QR signup links, partner links, and staff redemption flow are prepared for rollout.',
      },
    ],
    toolsHeading: 'What we prepare with you',
    toolsLead: 'The practical pieces a business needs before launch',
    outcomes: [
      {
        title: 'QR signup portals',
        body: 'Put a scannable rewards invite at checkout, tables, events, and partner desks.',
      },
      {
        title: 'Partner attribution',
        body: 'Give hotels, hostels, concierges, and local partners their own links and QR codes.',
      },
      {
        title: 'Reward credits',
        body: 'Issue simple customer perks that staff can validate in-store with short-lived codes.',
      },
      {
        title: 'Owner reporting',
        body: 'Track members, revenue, orders, reward fulfillment, and partner referral performance.',
      },
    ],
    checklistBadge: 'Owner checklist',
    checklistHeading: 'Everything needed before the business portal goes live',
    proofPoints: [
      'Review the presentation before committing',
      'Confirm the reward offer and partner terms',
      'Set up products, rewards, promotions, and staff access',
      'Launch with QR codes, referral links, and in-store validation',
    ],
    costCalculator: 'Open Cost Calculator',
    formBadge: 'Start onboarding',
    formHeading: 'Request the presentation and signup process',
    formLead: 'Submit your details and the Medellin Rewards team will receive your onboarding request in the admin lead pipeline.',
    nameLabel: 'Your Name',
    namePlaceholder: 'Alex Rivera',
    businessLabel: 'Business Name',
    businessPlaceholder: 'Harbor Roast',
    emailLabel: 'Email',
    emailPlaceholder: 'owner@example.com',
    phoneLabel: 'Phone',
    phonePlaceholder: 'Optional',
    notesLabel: 'What should we know before onboarding?',
    notesPlaceholder: 'Business type, expected reward offer, staff needs, partner referrals...',
    submittedMessage: 'Onboarding request sent. The team can now review it from the admin lead dashboard.',
    helperText: 'Best for member-friendly businesses with clear repeat purchase or referral potential.',
    requestButton: 'Request Onboarding',
    faqHeading: 'Frequently asked questions',
    faqs: [
      {
        question: 'How does a customer earn rewards at my business?',
        answer: 'The customer shows their Medellin Rewards QR code. Staff scan it, enter the sale amount, and the app records the points and commission.',
      },
      {
        question: 'Can I check the cost before joining?',
        answer: 'Yes. Use the cost calculator to compare reward value, food cost, and commission before finalizing your first offer.',
      },
      {
        question: 'Do staff need technical training?',
        answer: 'No. The launch flow is designed around scanning a QR code, entering the purchase amount, and confirming the transaction.',
      },
    ],
  },
  es: {
    heroBadge: 'Onboarding de negocios',
    heroTitleBefore: 'Unete a la ',
    heroTitleHighlight: 'red de recompensas',
    heroTitleAfter: ' que los miembros ya quieren usar',
    heroParagraphs: [
      'Medellin Rewards ofrece a los negocios un flujo simple de ventas con QR, recompensas para clientes, atribucion de aliados y pasos de lanzamiento en un solo portal.',
      'Los duenos pueden revisar el modelo, preparar la primera oferta y entender la comision antes de que el negocio salga en vivo.',
    ],
    qrRowBefore: 'Permite que los clientes muestren su ',
    qrRowStrong: 'QR de Medellin Rewards',
    qrRowAfter: ' para que tu equipo registre compras y asigne puntos.',
    portalRow: 'Consulta valor de recompensas, ventas de miembros y comisiones de Medellin Rewards desde el mismo portal de negocio.',
    businessPills: ['Ventas con QR', 'Referidos de aliados', 'Ofertas de recompensa', 'Seguimiento de comisiones'],
    startOnboarding: 'Iniciar onboarding',
    businessLogin: 'Acceso para negocios',
    howHeading: 'Como funciona el onboarding de negocios',
    howLead: 'Tres pasos simples desde la presentacion hasta ventas en vivo con QR',
    onboardingSteps: [
      {
        title: 'Ver la presentacion',
        body: 'Un video simple explica como los miembros ganan Rewards, como participan los negocios y como se ve el apoyo de lanzamiento.',
      },
      {
        title: 'Revision de ajuste',
        body: 'Confirmamos tu categoria, porcentaje de recompensa, costos reales y la mejor primera oferta para los miembros.',
      },
      {
        title: 'Registro y lanzamiento',
        body: 'Preparamos tu portal de negocio, enlaces QR de registro, enlaces de aliados y flujo de canje para el equipo.',
      },
    ],
    toolsHeading: 'Lo que preparamos contigo',
    toolsLead: 'Las piezas practicas que un negocio necesita antes del lanzamiento',
    outcomes: [
      {
        title: 'Portales de registro QR',
        body: 'Coloca una invitacion de recompensas escaneable en caja, mesas, eventos y puntos de aliados.',
      },
      {
        title: 'Atribucion de aliados',
        body: 'Da a hoteles, hostales, conserjes y aliados locales sus propios enlaces y codigos QR.',
      },
      {
        title: 'Creditos de recompensa',
        body: 'Emite beneficios simples para clientes que el equipo pueda validar en tienda con codigos de corta duracion.',
      },
      {
        title: 'Reportes para duenos',
        body: 'Consulta miembros, ingresos, ordenes, cumplimiento de recompensas y rendimiento de referidos.',
      },
    ],
    checklistBadge: 'Checklist del dueno',
    checklistHeading: 'Todo lo necesario antes de activar el portal de negocio',
    proofPoints: [
      'Revisar la presentacion antes de comprometerse',
      'Confirmar la oferta de recompensa y terminos de aliado',
      'Configurar productos, recompensas, promociones y acceso del equipo',
      'Lanzar con codigos QR, enlaces de referido y validacion en tienda',
    ],
    costCalculator: 'Abrir calculadora de costos',
    formBadge: 'Iniciar onboarding',
    formHeading: 'Solicitar la presentacion y el proceso de registro',
    formLead: 'Envia tus datos y el equipo de Medellin Rewards recibira tu solicitud en el panel de leads del admin.',
    nameLabel: 'Tu nombre',
    namePlaceholder: 'Alex Rivera',
    businessLabel: 'Nombre del negocio',
    businessPlaceholder: 'Harbor Roast',
    emailLabel: 'Email',
    emailPlaceholder: 'dueno@ejemplo.com',
    phoneLabel: 'Telefono',
    phonePlaceholder: 'Opcional',
    notesLabel: 'Que debemos saber antes del onboarding?',
    notesPlaceholder: 'Tipo de negocio, oferta de recompensa esperada, necesidades del equipo, referidos de aliados...',
    submittedMessage: 'Solicitud de onboarding enviada. El equipo ya puede revisarla en el panel de leads del admin.',
    helperText: 'Ideal para negocios amigables con miembros y con buen potencial de recompra o referidos.',
    requestButton: 'Solicitar onboarding',
    faqHeading: 'Preguntas frecuentes',
    faqs: [
      {
        question: 'Como gana recompensas un cliente en mi negocio?',
        answer: 'El cliente muestra su codigo QR de Medellin Rewards. El equipo lo escanea, ingresa el monto de venta y la app registra los puntos y la comision.',
      },
      {
        question: 'Puedo revisar el costo antes de unirme?',
        answer: 'Si. Usa la calculadora de costos para comparar valor de recompensa, costo real y comision antes de definir tu primera oferta.',
      },
      {
        question: 'El equipo necesita entrenamiento tecnico?',
        answer: 'No. El flujo de lanzamiento esta disenado para escanear un QR, ingresar el monto de compra y confirmar la transaccion.',
      },
    ],
  },
}

export function ForBusinessesPage() {
  const { language } = useLanguage()
  const copy = pageCopy[language]
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const heroRows = [
    {
      icon: QrCode,
      text: (
        <>
          {copy.qrRowBefore}
          <strong className="font-semibold text-[#28292b]">{copy.qrRowStrong}</strong>
          {copy.qrRowAfter}
        </>
      ),
    },
    {
      icon: BarChart3,
      text: copy.portalRow,
    },
  ] as const

  const businessPills = copy.businessPills.map((label, index) => ({
    icon: businessPillIcons[index],
    label,
  }))

  const outcomes = copy.outcomes.map((item, index) => ({
    ...item,
    icon: outcomeIcons[index],
  }))

  const onboardingSteps = copy.onboardingSteps.map((step, index) => ({
    ...step,
    icon: onboardingStepIcons[index],
  }))

  const faqs = copy.faqs.map((item, index) => ({
    ...item,
    icon: faqIcons[index],
  }))

  useEffect(() => {
    if (window.location.hash !== '#book-demo') return

    window.requestAnimationFrame(() => {
      document.getElementById('book-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(event.currentTarget)
    const lead = {
      name: String(formData.get('name') ?? '').trim(),
      businessName: String(formData.get('businessName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await earlyAccessService.createLead(
        {
          fullName: lead.name,
          email: lead.email,
          whatsapp: lead.phone,
          notes: [
            'Business onboarding request',
            `Business name: ${lead.businessName}`,
            lead.phone ? `Phone: ${lead.phone}` : null,
            lead.notes ? `Notes: ${lead.notes}` : null,
          ].filter(Boolean).join('\n'),
          marketingConsent: true,
        },
        { source: 'business-onboarding-page' },
      )

      form.reset()
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit onboarding request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="screenshot-landing min-h-screen overflow-x-hidden bg-[#f6f7f8] text-[#242426]">
      <section className="border-b border-[#e1e4e8] px-4 pb-[38px] pt-[52px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[790px] flex-col items-center text-center">
          <LanguagePicker className="mb-[18px] text-[#687282]" />
          <p className="landing-soft-gold-border inline-flex min-h-[32px] items-center rounded-full border border-[#dcc070] bg-[#fffaf0] px-[18px] text-[12px] font-semibold uppercase leading-none tracking-[0.22em] text-[#a47713]">
            {copy.heroBadge}
          </p>

          <h1 className="mt-[24px] max-w-[760px] font-serif text-[38px] font-bold leading-[1.11] tracking-normal text-[#202023] sm:text-[44px]">
            {copy.heroTitleBefore}<span className="text-[#cfaa44]">{copy.heroTitleHighlight}</span>{copy.heroTitleAfter}
          </h1>

          <div className="mt-[22px] max-w-[630px] space-y-[18px] text-[17px] font-medium leading-[1.55] text-[#687282]">
            {copy.heroParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-[30px] grid w-full max-w-[700px] gap-[14px]">
            {heroRows.map((item) => {
              const Icon = item.icon

              return (
                <div key={String(item.text)} className="flex min-h-[55px] items-center gap-4 rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[21px] text-left text-[14px] font-medium leading-5 text-[#687282] shadow-[0_2px_4px_rgba(16,24,40,0.04)]">
                  <Icon className="size-[17px] shrink-0 text-[#caa747]" strokeWidth={1.9} aria-hidden="true" />
                  <span>{item.text}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-[28px] flex max-w-[800px] flex-wrap items-center justify-center gap-[10px]">
            {businessPills.map((item) => {
              const Icon = item.icon

              return (
                <span key={item.label} className="inline-flex min-h-[38px] items-center gap-[10px] rounded-full border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[13px] font-medium text-[#545b66]">
                  <Icon className="size-[15px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </span>
              )
            })}
          </div>

          <div className="mt-[26px] flex w-full max-w-[590px] flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#book-demo"
              className="inline-flex min-h-[54px] min-w-[240px] items-center justify-center rounded-[8px] bg-[#d1ad4a] px-8 text-[15px] font-bold text-[#121212] transition hover:bg-[#c29f3d]"
            >
              {copy.startOnboarding}
            </a>
            <Link
              to="/business/login"
              className="inline-flex min-h-[54px] min-w-[190px] items-center justify-center rounded-[8px] border border-[#dfe3e8] bg-[#ffffff] px-8 text-[15px] font-bold text-[#4f5866] shadow-[0_2px_4px_rgba(16,24,40,0.04)] transition hover:border-[#d1ad4a]"
            >
              {copy.businessLogin}
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[#e1e4e8] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1020px] text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">{copy.howHeading}</h2>
          <p className="mt-[14px] text-[15px] font-medium text-[#687282]">{copy.howLead}</p>

          <div className="mt-[24px] grid gap-[16px] md:grid-cols-3">
            {onboardingSteps.map((step, index) => (
              <article key={step.title} className="flex min-h-[162px] flex-col items-center rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[28px] py-[18px]">
                <div className="landing-soft-gold-border flex size-[36px] items-center justify-center rounded-full border border-[#dfc477] bg-[#fffaf0] text-[16px] font-semibold text-[#a47713]">
                  {index + 1}
                </div>
                <h3 className="mt-[15px] text-[15px] font-bold text-[#202023]">{step.title}</h3>
                <p className="mt-[11px] text-[13px] font-medium leading-[1.55] text-[#687282]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="business-tools" className="border-b border-[#e1e4e8] bg-[#ffffff] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">{copy.toolsHeading}</h2>
          <p className="mt-[14px] text-[15px] font-medium text-[#687282]">{copy.toolsLead}</p>

          <div className="mt-[24px] grid gap-[16px] md:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((item) => (
              <article key={item.title} className="min-h-[174px] rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[24px] py-[20px] text-left shadow-[0_2px_4px_rgba(16,24,40,0.04)]">
                <item.icon className="size-[20px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                <h3 className="mt-[16px] text-[15px] font-bold text-[#202023]">{item.title}</h3>
                <p className="mt-[10px] text-[13px] font-medium leading-[1.55] text-[#687282]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e1e4e8] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1060px] gap-[22px] lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="text-center lg:text-left">
            <p className="landing-soft-gold-border inline-flex min-h-[28px] items-center rounded-full border border-[#dcc070] bg-[#fffaf0] px-[16px] text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-[#a47713]">
              {copy.checklistBadge}
            </p>
            <h2 className="mt-[18px] font-serif text-[30px] font-bold leading-[1.12] text-[#202023]">
              {copy.checklistHeading}
            </h2>
            <div className="mt-[20px] grid gap-[10px]">
              {copy.proofPoints.map((point) => (
                <div key={point} className="flex min-h-[44px] items-center gap-3 rounded-[8px] border border-[#dfe3e8] bg-[#ffffff] px-4 text-left text-[13px] font-medium text-[#687282]">
                  <ShieldCheck className="size-[15px] shrink-0 text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                  {point}
                </div>
              ))}
            </div>
            <Button asChild className="mt-[22px] min-h-[48px] rounded-[8px] bg-[#d1ad4a] px-6 text-[#121212] hover:bg-[#c29f3d]">
              <Link to="/cost-calculator">
                <Calculator className="size-4" />
                {copy.costCalculator}
              </Link>
            </Button>
          </div>

          <form id="book-demo" className="rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[22px] py-[24px] shadow-[0_2px_4px_rgba(16,24,40,0.04)] sm:px-[30px]" onSubmit={handleSubmit}>
            <div className="mb-[22px] flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#a47713]">{copy.formBadge}</p>
                <h2 className="mt-[10px] font-serif text-[28px] font-bold leading-[1.12] text-[#202023]">
                  {copy.formHeading}
                </h2>
                <p className="mt-[12px] text-[13px] font-medium leading-[1.55] text-[#687282]">
                  {copy.formLead}
                </p>
              </div>
              <CalendarClock className="size-[28px] shrink-0 text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div className="grid gap-[14px] sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="demo-name" className="text-[12px] font-semibold text-[#687282]">{copy.nameLabel}</Label>
                <Input id="demo-name" name="name" required placeholder={copy.namePlaceholder} className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-business" className="text-[12px] font-semibold text-[#687282]">{copy.businessLabel}</Label>
                <Input id="demo-business" name="businessName" required placeholder={copy.businessPlaceholder} className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-email" className="text-[12px] font-semibold text-[#687282]">{copy.emailLabel}</Label>
                <Input id="demo-email" name="email" type="email" required placeholder={copy.emailPlaceholder} className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-phone" className="text-[12px] font-semibold text-[#687282]">{copy.phoneLabel}</Label>
                <Input id="demo-phone" name="phone" placeholder={copy.phonePlaceholder} className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="demo-notes" className="text-[12px] font-semibold text-[#687282]">{copy.notesLabel}</Label>
                <Textarea
                  id="demo-notes"
                  name="notes"
                  placeholder={copy.notesPlaceholder}
                  className="min-h-[104px] rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]"
                />
              </div>
            </div>

            <div className="mt-[22px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {submitted ? (
                <p className="min-w-0 text-sm font-bold leading-5 text-success sm:max-w-[260px]">
                  {copy.submittedMessage}
                </p>
              ) : submitError ? (
                <p className="min-w-0 text-sm font-bold leading-5 text-error sm:max-w-[260px]">
                  {submitError}
                </p>
              ) : (
                <p className="min-w-0 text-[13px] font-medium leading-5 text-[#687282] sm:max-w-[260px]">
                  {copy.helperText}
                </p>
              )}
              <Button
                type="submit"
                className="min-h-[44px] w-full shrink-0 rounded-[8px] bg-[#d1ad4a] px-6 text-[#121212] hover:bg-[#c29f3d] sm:w-auto sm:min-w-[172px]"
                isLoading={isSubmitting}
              >
                {copy.requestButton}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section id="faq" className="border-b border-[#e1e4e8] bg-[#ffffff] px-4 pb-[34px] pt-[38px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[700px]">
          <h2 className="text-center font-serif text-[30px] font-bold leading-none text-[#202023]">
            {copy.faqHeading}
          </h2>

          <div className="mt-[24px] space-y-[11px]">
            {faqs.map((item) => {
              const Icon = item.icon

              return (
                <details key={item.question} className="group rounded-[7px] border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[#2f3339]">
                  <summary className="flex min-h-[58px] cursor-pointer list-none items-center gap-[13px] text-[14px] font-bold [&::-webkit-details-marker]:hidden">
                    <Icon className="size-[15px] shrink-0 text-[#caa747]" strokeWidth={1.7} aria-hidden="true" />
                    <span className="flex-1">{item.question}</span>
                    <span className="text-[#9aa2af] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-[18px] pl-[28px] text-[13px] font-medium leading-[1.65] text-[#687282]">
                    {item.answer}
                  </p>
                </details>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
