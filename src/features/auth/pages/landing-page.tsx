import { zodResolver } from '@hookform/resolvers/zod'
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Coins,
  DollarSign,
  Eye,
  EyeOff,
  MapPin,
  Play,
  ShoppingCart,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { BrandLogo } from '@/components/brand-logo'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import {
  REWARDME_TEST_ACCOUNTS,
  REWARDME_TEST_PASSWORD,
  shouldShowRewardMeTestCredentials,
  type RewardMeTestAccount,
} from '@/features/auth/rewardme-test-accounts'
import {
  WONDERTOWN_TEST_ACCOUNTS,
  WONDERTOWN_TEST_PASSWORD,
} from '@/features/auth/wondertown-test-accounts'
import { platformBrand } from '@/features/platform/platform-brand'
import { usePlatformDocumentBrand } from '@/features/platform/use-platform-document-brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useTenant } from '@/hooks/use-tenant'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage, type Language } from '@/lib/language'
import { getHomePathForRole } from '@/lib/role-routes'
import {
  getRequestedRoleForPortal,
  getSignInPortal,
  SIGN_IN_PORTALS,
  type SignInPortal,
} from '@/lib/sign-in-portals'
import { authSchema, type AuthFormValues } from '@/types/forms'

const portalAccessErrorKey = 'portalAccessError'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

const authInputClass =
  'h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35'
const authLabelClass = 'text-[12px] font-semibold text-[#8f8f8f]'
const authErrorClass = 'text-center text-xs font-bold text-red-400'

const featureCardIcons = [Users, BarChart3, ShoppingCart] as const
const faqIcons = [MapPin, Users, BadgeCheck, DollarSign] as const
const signInPortalIcons = {
  admin: ShieldCheck,
  business: BriefcaseBusiness,
  customer: UserRound,
} satisfies Record<SignInPortal, typeof ShieldCheck>

const landingCopy: Record<Exclude<Language, 'tl'>, {
  nav: {
    howItWorks: string
    businesses: string
    faq: string
    joinNow: string
  }
  video: {
    ariaLabel: string
    label: string
    script: string
  }
  hero: {
    eyebrow: string
    firstAccent: string
    middle: string
    secondAccent: string
    secondLine: string
    bodyPrefix: string
    bodySuffix: string
    bodyAccent: string
    subcopy: string
    pills: string[]
    cta: string
  }
  featureCards: Array<{
    title: string
    body: string
  }>
  membership: {
    eyebrow: string
    headingPrefix: string
    headingAccent: string
    featuredBadge: string
    plans: Array<{
      title: string
      body: string
      bullets: string[]
      cta: string
      to: string
      featured: boolean
    }>
  }
  steps: {
    eyebrow: string
    headingPrefix: string
    headingAccent: string
    items: Array<{
      title: string
      body: string
    }>
  }
  faq: {
    heading: string
    items: Array<{
      question: string
      answer: string
    }>
  }
  businessCta: {
    title: string
    body: string
    cta: string
  }
  footer: {
    tagline: string
    quickLinks: string
  }
}> = {
  en: {
    nav: {
      howItWorks: 'How it works',
      businesses: 'Businesses',
      faq: 'FAQ',
      joinNow: 'Join now',
    },
    video: {
      ariaLabel: 'Play landing page video',
      label: 'Hero video - 16:9 - autoplay',
      script: 'Script idea: a member spending, earning, and redeeming rewards toward a trip - same beats as the reward walkthrough on the sign-up flow.',
    },
    hero: {
      eyebrow: '{programName}',
      firstAccent: 'Earn',
      middle: 'Amazing',
      secondAccent: 'Rewards',
      secondLine: 'While Supporting Local Businesses',
      bodyPrefix: "Every time you shop, dine, or spend at a business in our network, you're supporting a local business and earning",
      bodySuffix: '.',
      bodyAccent: 'Rewards',
      subcopy: 'Join free and earn 10% back automatically - or upgrade to earn between 20% and 100% back - every time you spend with the businesses in our network.',
      pills: ['Everyday spending', '20% - 100% back', 'Any business, anywhere'],
      cta: 'Join {programName}',
    },
    featureCards: [
      {
        title: 'Support the local businesses every time you spend.',
        body: '',
      },
      {
        title: 'Earn between 20% - 100% back',
        body: 'Simply spending at amazing businesses within our platform.',
      },
      {
        title: 'Earn from almost any purchase',
        body: 'Restaurants, hotels, coffee shops, salons, cars, real estate, and more.',
      },
    ],
    membership: {
      eyebrow: 'Membership',
      headingPrefix: 'Choose How You',
      headingAccent: 'Earn',
      featuredBadge: 'Works out to be free',
      plans: [
        {
          title: 'Free membership',
          body: '',
          bullets: ['No cost to join', 'Earn 10% back automatically on every purchase'],
          cta: 'Join Free',
          to: '/join',
          featured: false,
        },
        {
          title: 'Regular Membership',
          body: 'Cost $100,000 COP and earn $100,000 COP in Rewards',
          bullets: [
            'Earn minimum 20% - 100% back on almost all purchases',
            'Earn $40,000 COP in Rewards for every member your refer that joins',
            'Earn a minimum of $200,000 COP in Rewards for referring a business that joins.',
          ],
          cta: 'Upgrade',
          to: '/join',
          featured: true,
        },
      ],
    },
    steps: {
      eyebrow: 'How it works',
      headingPrefix: 'Three steps to start',
      headingAccent: 'earning',
      items: [
        {
          title: 'Join',
          body: 'Sign up as a member - free, in under a minute.',
        },
        {
          title: 'Spend & Earn',
          body: 'Shop, dine, and buy at any business in our network. Earn 10% back for free, or 20-100% back on our paid tier.',
        },
        {
          title: 'Redeem',
          body: 'Use your Rewards to purchase your dream vacation, or anything available in our Rewards Store.',
        },
      ],
    },
    faq: {
      heading: 'Frequently asked questions',
      items: [
        {
          question: 'Where can I use my Rewards?',
          answer: 'You can use your Rewards with many partnered businesses, either by going to the Rewards Store or by messaging us for more options.',
        },
        {
          question: 'Can I have more than one Rewards account?',
          answer: 'No, each person can have one Rewards account, tied to your full name, email, and phone number.',
        },
        {
          question: 'Can I transfer Rewards to another account?',
          answer: 'Rewards are tied to your member account and must be used and cannot be transferred.',
        },
        {
          question: 'Can Rewards be exchanged for money?',
          answer: 'No, Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within the {programName} Program - not cash exchange.',
        },
      ],
    },
    businessCta: {
      title: "Don't see one of your favorite businesses?",
      body: 'Refer them to us and if they join you will earn Rewards!',
      cta: 'Suggest a business',
    },
    footer: {
      tagline: 'Earn Amazing Rewards While Supporting Local Businesses.',
      quickLinks: 'Quick links',
    },
  },
  es: {
    nav: {
      howItWorks: 'Como funciona',
      businesses: 'Negocios',
      faq: 'Preguntas frecuentes',
      joinNow: 'Unirme ahora',
    },
    video: {
      ariaLabel: 'Reproducir video de la pagina principal',
      label: 'Video principal - 16:9 - autoplay',
      script: 'Idea del guion: un miembro compra, gana y canjea recompensas para un viaje, siguiendo los mismos pasos del recorrido de registro.',
    },
    hero: {
      eyebrow: '{programName}',
      firstAccent: 'Gana',
      middle: 'Recompensas',
      secondAccent: 'Increibles',
      secondLine: 'Mientras Apoyas Negocios Locales',
      bodyPrefix: 'Cada vez que compras, comes o gastas en un negocio de nuestra red, apoyas a un negocio local y ganas',
      bodySuffix: '.',
      bodyAccent: 'Recompensas',
      subcopy: 'Unete gratis y gana 10% de vuelta automaticamente, o mejora tu membresia para ganar entre 20% y 100% de vuelta cada vez que compres con los negocios de nuestra red.',
      pills: ['Compras diarias', '20% - 100% de vuelta', 'Cualquier negocio, en cualquier lugar'],
      cta: 'Unirme a {programName}',
    },
    featureCards: [
      {
        title: 'Apoya negocios locales cada vez que compras.',
        body: '',
      },
      {
        title: 'Gana entre 20% - 100% de vuelta',
        body: 'Simplemente comprando en negocios increibles dentro de nuestra plataforma.',
      },
      {
        title: 'Gana con casi cualquier compra',
        body: 'Restaurantes, hoteles, cafes, salones, carros, bienes raices y mas.',
      },
    ],
    membership: {
      eyebrow: 'Membresia',
      headingPrefix: 'Elige Como',
      headingAccent: 'Ganar',
      featuredBadge: 'Puede salir gratis',
      plans: [
        {
          title: 'Membresia gratis',
          body: '',
          bullets: ['No cuesta unirse', 'Gana 10% de vuelta automaticamente en cada compra'],
          cta: 'Unirme Gratis',
          to: '/join',
          featured: false,
        },
        {
          title: 'Membresia Regular',
          body: 'Cuesta $100,000 COP y recibes $100,000 COP en Recompensas',
          bullets: [
            'Gana minimo 20% - 100% de vuelta en casi todas las compras',
            'Gana $40,000 COP en Recompensas por cada miembro referido que se una',
            'Gana minimo $200,000 COP en Recompensas por referir un negocio que se una.',
          ],
          cta: 'Mejorar',
          to: '/join',
          featured: true,
        },
      ],
    },
    steps: {
      eyebrow: 'Como funciona',
      headingPrefix: 'Tres pasos para empezar a',
      headingAccent: 'ganar',
      items: [
        {
          title: 'Unete',
          body: 'Registrate como miembro gratis, en menos de un minuto.',
        },
        {
          title: 'Compra y Gana',
          body: 'Compra, come y gasta en cualquier negocio de nuestra red. Gana 10% de vuelta gratis, o 20-100% de vuelta con nuestra membresia paga.',
        },
        {
          title: 'Canjea',
          body: 'Usa tus Recompensas para comprar el viaje de tus suenos o cualquier cosa disponible en nuestra tienda de Recompensas.',
        },
      ],
    },
    faq: {
      heading: 'Preguntas frecuentes',
      items: [
        {
          question: 'Donde puedo usar mis Recompensas?',
          answer: 'Puedes usar tus Recompensas con muchos negocios aliados, entrando a la tienda de Recompensas o escribiendonos para mas opciones.',
        },
        {
          question: 'Puedo tener mas de una cuenta de Recompensas?',
          answer: 'No, cada persona puede tener una sola cuenta de Recompensas, conectada a su nombre completo, email y telefono.',
        },
        {
          question: 'Puedo transferir Recompensas a otra cuenta?',
          answer: 'Las Recompensas estan conectadas a tu cuenta de miembro, deben usarse desde esa cuenta y no se pueden transferir.',
        },
        {
          question: 'Las Recompensas se pueden cambiar por dinero?',
          answer: 'No, las Recompensas son para beneficios de miembros, compras, viajes, experiencias y ofertas aliadas dentro de {programName}, no para cambio por efectivo.',
        },
      ],
    },
    businessCta: {
      title: 'No ves uno de tus negocios favoritos?',
      body: 'Refierelo a nosotros y si se une ganaras Recompensas!',
      cta: 'Sugerir un negocio',
    },
    footer: {
      tagline: 'Gana Recompensas Increibles Mientras Apoyas Negocios Locales.',
      quickLinks: 'Enlaces rapidos',
    },
  },
}

function LoadingSpinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z"
      />
    </svg>
  )
}

export function LandingPage() {
  const { language } = useLanguage()
  const { program } = useTenant()
  const baseCopy = landingCopy[language === 'tl' ? 'en' : language]
  const copy = JSON.parse(
    JSON.stringify(baseCopy).replaceAll('{programName}', program.name),
  ) as typeof baseCopy
  const featureCards = copy.featureCards.map((item, index) => ({
    ...item,
    icon: featureCardIcons[index]!,
  }))
  const faqs = copy.faq.items.map((item, index) => ({
    ...item,
    icon: faqIcons[index]!,
  }))

  return (
    <main className="screenshot-landing min-h-screen overflow-x-hidden bg-[#ffffff] text-[#1f2023]">
      <header className="sticky top-0 z-40 flex min-h-[62px] items-center border-b border-[#eeeeee] bg-[#ffffff]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4">
          <Link to="/landing-page" className="inline-flex min-w-0 items-center gap-[8px]">
            <BrandLogo markClassName="h-7" />
            <span className="text-[13px] font-extrabold tracking-normal text-[#202126]">
              {program.name}
            </span>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
          <nav className="hidden items-center gap-[28px] text-[12px] font-semibold leading-none text-[#4f545d] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#202023]">
              {copy.nav.howItWorks}
            </a>
            <Link to="/business" className="transition hover:text-[#202023]">
              {copy.nav.businesses}
            </Link>
            <a href="#faq" className="transition hover:text-[#202023]">
              {copy.nav.faq}
            </a>
            <LanguagePicker className="text-[#4f545d]" compact />
            <Link
              to="/join"
              className="inline-flex min-h-[32px] items-center justify-center rounded-full bg-[#c9a546] px-[20px] text-[12px] font-bold text-[#ffffff] shadow-[0_8px_20px_rgba(201,165,70,0.24)] transition hover:bg-[#b58f32]"
            >
              {copy.nav.joinNow}
            </Link>
          </nav>
          <LanguagePicker className="text-[#4f545d] md:hidden" compact />
          </div>
        </div>
      </header>

      <section className="px-4 pb-[52px] pt-[78px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-[900px]">
            <div className="relative aspect-video overflow-hidden rounded-[14px] bg-[#000000] shadow-[0_24px_45px_rgba(15,15,18,0.22)]">
              <button
                type="button"
                className="absolute left-1/2 top-1/2 flex size-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#c7a347] text-[#ffffff] shadow-[0_0_0_14px_rgba(199,163,71,0.22)] transition hover:bg-[#d2b158]"
                aria-label={copy.video.ariaLabel}
              >
                <Play className="ml-1 size-[22px]" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <p className="absolute bottom-[20px] left-[22px] text-[11px] font-semibold text-[#ffffff]">
                {copy.video.label}
              </p>
              <span className="absolute bottom-[18px] right-[18px] rounded-[4px] bg-[#c7a347] px-[8px] py-[3px] text-[10px] font-bold text-[#111111]">
                0:20-0:30
              </span>
            </div>
            <p className="mx-auto mt-[14px] max-w-[620px] text-center text-[11px] font-medium leading-[1.6] text-[#8a8d94]">
              {copy.video.script}
            </p>
          </div>

          <div className="mx-auto mt-[86px] flex max-w-[760px] flex-col items-center text-center">
            <p className="inline-flex min-h-[22px] items-center rounded-full bg-[#f5ecd6] px-[12px] text-[10px] font-bold uppercase tracking-[0.14em] text-[#b78f34]">
              {copy.hero.eyebrow}
            </p>

            <h1 className="mt-[22px] max-w-[760px] text-[42px] font-extrabold leading-[0.96] tracking-normal text-[#202126] sm:text-[60px]">
              <span className="text-[#c5a142]">{copy.hero.firstAccent}</span> {copy.hero.middle}{' '}
              <span className="text-[#c5a142]">{copy.hero.secondAccent}</span>
              <br />
              {copy.hero.secondLine}
            </h1>

            <div className="mt-[28px] max-w-[560px] space-y-[19px] text-[14px] font-medium leading-[1.65] text-[#6f747d]">
              <p>
                {copy.hero.bodyPrefix} <span className="font-semibold text-[#c5a142]">{copy.hero.bodyAccent}</span>{copy.hero.bodySuffix}
              </p>
              <p className="text-[12px] leading-[1.7] text-[#8c9198]">
                {copy.hero.subcopy}
              </p>
            </div>

            <div className="mt-[27px] flex flex-wrap justify-center gap-[12px]">
              {copy.hero.pills.map((label) => (
                <span
                  key={label}
                  className="inline-flex min-h-[31px] items-center rounded-full bg-[#f0f0f0] px-[19px] text-[11px] font-bold text-[#4d5158]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-[48px] grid gap-[26px] md:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="min-h-[204px] rounded-[8px] border border-[#dedfe3] bg-[#ffffff] px-[28px] py-[32px] shadow-[0_1px_2px_rgba(16,24,40,0.02)]">
                  <Icon className="size-[21px] text-[#c5a142]" strokeWidth={1.8} aria-hidden="true" />
                  <h3 className="mt-[27px] text-[13px] font-medium leading-[1.55] text-[#3d424a]">{item.title}</h3>
                  {item.body ? <p className="mt-[8px] text-[12px] font-medium leading-[1.6] text-[#737780]">{item.body}</p> : null}
                </article>
              )
            })}
          </div>

          <div className="mt-[74px] flex justify-center">
            <Link
              to="/join"
              className="inline-flex min-h-[54px] min-w-[260px] items-center justify-center rounded-full bg-[#c9a546] px-8 text-[13px] font-bold text-[#ffffff] shadow-[0_12px_24px_rgba(201,165,70,0.22)] transition hover:bg-[#b58f32]"
            >
              {copy.hero.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f8f8] px-4 py-[72px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[960px]">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a546]">{copy.membership.eyebrow}</p>
            <h2 className="mt-[18px] text-[39px] font-extrabold leading-tight text-[#202126]">
              {copy.membership.headingPrefix} <span className="text-[#c5a142]">{copy.membership.headingAccent}</span>
            </h2>
          </div>

          <div className="mt-[38px] grid gap-[24px] md:grid-cols-2">
            {copy.membership.plans.map((plan) => (
              <article
                key={plan.title}
                className={`flex min-h-[390px] flex-col rounded-[14px] bg-[#ffffff] px-[28px] pb-[24px] pt-[30px] ${
                  plan.featured
                    ? 'border-2 border-[#9f7b19] shadow-[0_16px_35px_rgba(42,35,18,0.08)]'
                    : 'border border-[#dedfe3]'
                }`}
              >
                {plan.featured ? (
                  <div className="mb-[18px] flex justify-end">
                    <span className="rounded-full bg-[#c9a546] px-[11px] py-[5px] text-[9px] font-bold uppercase text-[#ffffff]">
                      {copy.membership.featuredBadge}
                    </span>
                  </div>
                ) : null}
                <h3 className="text-[22px] font-extrabold text-[#202126]">{plan.title}</h3>
                {plan.body ? <p className="mt-[8px] text-[13px] font-medium leading-[1.6] text-[#6f747d]">{plan.body}</p> : null}

                <ul className="mt-[16px] flex flex-1 flex-col gap-[12px]">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-[10px] text-[12px] font-medium leading-[1.6] text-[#464b54]">
                      <Check className="mt-[2px] size-[14px] shrink-0 text-[#9b812e]" strokeWidth={2} aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.to}
                  className={`mt-[22px] inline-flex min-h-[48px] items-center justify-center rounded-[7px] text-[12px] font-bold transition ${
                    plan.featured
                      ? 'bg-[#c9a546] text-[#ffffff] shadow-[0_10px_22px_rgba(201,165,70,0.22)] hover:bg-[#b58f32]'
                      : 'border border-[#c9a546] bg-[#ffffff] text-[#c9a546] hover:bg-[#fff8e5]'
                  }`}
                >
                  {plan.cta} {'->'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-[86px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a546]">{copy.steps.eyebrow}</p>
            <h2 className="mt-[18px] font-serif text-[43px] font-bold leading-tight text-[#202126]">
              {copy.steps.headingPrefix} <span className="text-[#c5a142]">{copy.steps.headingAccent}</span>
            </h2>
          </div>

          <div className="mt-[64px] grid gap-[42px] md:grid-cols-3">
            {copy.steps.items.map((step, index) => (
              <article key={step.title} className="min-h-[138px]">
                <p className="text-[18px] font-medium text-[#c5a142]">{index + 1}</p>
                <h3 className="mt-[24px] text-[13px] font-extrabold text-[#202126]">{step.title}</h3>
                <p className="mt-[16px] text-[12px] font-medium leading-[1.8] text-[#858990]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f8f8f8] px-4 py-[90px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[700px]">
          <h2 className="text-center text-[40px] font-extrabold leading-tight text-[#202126]">
            {copy.faq.heading}
          </h2>

          <div className="mt-[54px] space-y-[16px]">
            {faqs.map((item) => {
              const Icon = item.icon

              return (
                <details key={item.question} open className="group rounded-[10px] border border-[#dedfe3] bg-[#ffffff] px-[22px] py-[18px] text-[#202126]">
                  <summary className="flex cursor-pointer list-none items-center gap-[10px] text-[13px] font-extrabold [&::-webkit-details-marker]:hidden">
                    <Icon className="size-[14px] shrink-0 text-[#c5a142]" strokeWidth={2} aria-hidden="true" />
                    <span className="flex-1">{item.question}</span>
                    <ChevronDown className="size-[14px] shrink-0 text-[#92969d] transition group-open:rotate-180" strokeWidth={2} aria-hidden="true" />
                  </summary>
                  <p className="mt-[14px] pl-[24px] text-[12px] font-medium leading-[1.7] text-[#747982]">
                    {item.answer}
                  </p>
                </details>
              )
            })}
          </div>
        </div>
      </section>

      <section id="business-cta" className="px-4 py-[88px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-[22px] rounded-[26px] border border-[#dedfe3] bg-[#ffffff] px-[34px] py-[46px] shadow-[0_16px_40px_rgba(16,24,40,0.08)] md:flex-row md:items-center md:justify-between md:px-[60px]">
          <div>
            <h2 className="text-[26px] font-extrabold leading-tight text-[#202126]">{copy.businessCta.title}</h2>
            <p className="mt-[14px] text-[14px] font-medium text-[#6f747d]">{copy.businessCta.body}</p>
          </div>
          <Link
            to="/business#book-demo"
            className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-[#c9a546] px-[28px] text-[12px] font-bold text-[#ffffff] shadow-[0_10px_22px_rgba(201,165,70,0.22)] transition hover:bg-[#b58f32]"
          >
            {copy.businessCta.cta} {'->'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#eeeeee] bg-[#ffffff] px-4 py-[44px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div>
            <div className="inline-flex items-center gap-[8px]">
              <BrandLogo markClassName="h-7" />
              <span className="text-[13px] font-extrabold tracking-normal text-[#202126]">
                {program.name}
              </span>
            </div>
            <p className="mt-[28px] max-w-[260px] text-[12px] font-medium leading-[1.7] text-[#8a8d94]">
              {copy.footer.tagline}
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
export function LegacyAuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const storedError = sessionStorage.getItem(portalAccessErrorKey)
    if (storedError) {
      sessionStorage.removeItem(portalAccessErrorKey)
    }
    return storedError
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface px-4 py-4 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--rose-brown)_18%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--espresso)_28%,transparent),transparent_32%)]" />
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[74rem] flex-col justify-center gap-5">
        <div className="relative z-10 ml-auto flex items-center gap-2 md:absolute md:right-8 md:top-4 lg:right-10">
          <ThemeToggle className="rounded-full border border-[var(--champagne)]/24 bg-[var(--espresso)]/35 text-[var(--champagne)] hover:bg-[var(--espresso)]/55 hover:text-[var(--cream)]" />
          <LanguagePicker className="text-on-surface-variant" />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl md:text-5xl">
            {t('Member Access')}
          </h2>
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">
            {t('Sign in to manage your member rewards.')}
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(27rem,0.72fr)]">
          <section className="relative flex min-h-[31rem] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-6 text-[var(--cream)] shadow-panel md:px-8 lg:px-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 space-y-7">
            <div className="flex size-14 items-center justify-center rounded-full border border-[var(--champagne)]/28 bg-[var(--champagne)]/16 text-[var(--champagne)] shadow-soft">
              <Coins className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
                {t('Private member access')}
              </p>
              <h1 className="font-serif text-[clamp(2.35rem,4.4vw,4rem)] font-semibold leading-[0.92] tracking-[0.01em] text-[var(--cream)]">
                {t('Member portal')}{' '}
                <span className="text-[var(--champagne)]">{t('sign in.')}</span>
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/88">
                {t('Track your rewards, gift-card value, and member activity in one verified account across the network.')}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-4 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                {t('Portal')}
              </p>
              <p className="mt-3 font-serif text-3xl text-[var(--cream)]">
                {t('Member')}
              </p>
            </div>
            <div className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-4 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                {t('Create account')}
              </p>
              <Link
                to="/join"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--cream)] hover:text-[var(--champagne)]"
              >
                {t('Join now')}
              </Link>
            </div>
          </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col py-0">
            <div className="relative flex min-h-[31rem] w-full flex-col justify-center overflow-hidden rounded-[1.6rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
              <div className="absolute right-0 top-0 size-24 rounded-bl-[3.5rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />
              <div className="relative z-10">
                {showForgotPassword ? (
                  <form
                    className="space-y-6"
                    onSubmit={resetForm.handleSubmit(async (values) => {
                      try {
                        setError(null)
                        setResetSuccessMessage(null)
                        await authService.resetPassword(values.email.trim())
                        setResetSuccessMessage(t('Check your email for a password reset link.'))
                        setShowForgotPassword(false)
                        resetForm.reset({ email: '' })
                      } catch (submissionError) {
                        setError(
                          submissionError instanceof Error
                            ? submissionError.message
                            : t('Unable to send reset link.'),
                        )
                      }
                    })}
                  >
                    <div className="space-y-2 text-center">
                      <h3 className="font-serif text-4xl tracking-tight text-[var(--champagne)]">
                        {t('Reset Password')}
                      </h3>
                      <p className="text-sm font-medium text-[var(--cream)]/74">
                        {t("Enter your email and we'll send you a reset link.")}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="reset-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                      <Input id="reset-email" className={authInputClass} placeholder="your@email.com" {...resetForm.register('email')} />
                    </div>

                    {error ? <p className="text-sm font-bold text-red-500 text-center">{t(error)}</p> : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]"
                      disabled={resetForm.formState.isSubmitting}
                    >
                      {resetForm.formState.isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <LoadingSpinner />
                          {t('Send reset link')}
                        </span>
                      ) : (
                        t('Send reset link')
                      )}
                    </Button>

                    <button
                      type="button"
                      className="block w-full text-center text-sm font-medium text-[var(--champagne)]/75 transition hover:text-[var(--champagne)]"
                      onClick={() => {
                        setError(null)
                        setShowForgotPassword(false)
                      }}
                    >
                      {t('Back to sign in')}
                    </button>
                  </form>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={signInForm.handleSubmit(
                      async (values) => {
                        try {
                          setError(null)
                          setResetSuccessMessage(null)
                          await signIn({ ...values, role: 'customer' })
                          const redirect = searchParams.get('redirect')
                          if (redirect) {
                            navigate(redirect)
                          }
                        } catch (submissionError) {
                          setError(
                            submissionError instanceof Error
                              ? submissionError.message
                              : t('Unable to sign in.'),
                          )
                        }
                      },
                      () => {
                        setError(t('Enter a valid email address and password to sign in.'))
                      },
                    )}
                  >
                    {resetSuccessMessage ? (
                      <p className="text-sm font-bold text-success text-center">{resetSuccessMessage}</p>
                    ) : null}

                    <div className="grid gap-3">
                      <Label htmlFor="signin-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                      <Input id="signin-email" className={authInputClass} placeholder="your@email.com" {...signInForm.register('email')} />
                      {signInForm.formState.errors.email ? (
                        <p className="text-xs font-bold text-red-500">
                          {t(signInForm.formState.errors.email.message ?? '')}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signin-password" className="text-[var(--champagne)]">{t('Password')}</Label>
                      <Input id="signin-password" className={authInputClass} type="password" placeholder="Password" {...signInForm.register('password')} />
                      {signInForm.formState.errors.password ? (
                        <p className="text-xs font-bold text-red-500">
                          {t(signInForm.formState.errors.password.message ?? '')}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-[var(--champagne)]/75 transition hover:text-[var(--champagne)]"
                        onClick={() => {
                          setError(null)
                          resetForm.setValue('email', signInForm.getValues('email'))
                          setShowForgotPassword(true)
                        }}
                      >
                        {t('Forgot password?')}
                      </button>
                    </div>

                    {error ? <p className="text-sm font-bold text-red-500 text-center">{t(error)}</p> : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]"
                      disabled={signInForm.formState.isSubmitting}
                    >
                      {signInForm.formState.isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <LoadingSpinner />
                          {t('Signing in...')}
                        </span>
                      ) : (
                        t('Sign In')
                      )}
                    </Button>

                    <p className="text-center text-sm font-medium text-[var(--cream)]/72">
                      {t('Need a member account?')}{' '}
                      <Link to="/join" className="font-bold text-[var(--champagne)] transition hover:text-[var(--cream)]">
                        {t('Join now')}
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
        </section>
      </div>
    </div>
    </div>
  )
}

export function CompactAuthPage() {
  const { program } = useTenant()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [selectedPortal, setSelectedPortal] = useState<SignInPortal>(() =>
    getSignInPortal(searchParams.get('portal')),
  )
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const storedError = sessionStorage.getItem(portalAccessErrorKey)
    if (storedError) {
      sessionStorage.removeItem(portalAccessErrorKey)
    }
    return storedError
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)
  const [activeQuickPortal, setActiveQuickPortal] = useState<SignInPortal | null>(null)

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  const signInTestAccount = async (account: RewardMeTestAccount, password: string) => {
    const accountPortal = getSignInPortal(account.portal)
    const values: AuthFormValues = {
      ...defaultValues,
      email: account.email,
      password,
      role: account.role,
    }
    setError(null)
    setResetSuccessMessage(null)
    setSelectedPortal(accountPortal)
    signInForm.reset(values)

    try {
      const profile = await signIn(values)
      navigate(getHomePathForRole(profile.role))
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t('Unable to sign in.'),
      )
    }
  }

  const selectPortal = (portal: SignInPortal) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('portal', portal)
    setSearchParams(nextSearchParams, { replace: true })
    setSelectedPortal(portal)
    signInForm.setValue('role', getRequestedRoleForPortal(portal))
    signInForm.clearErrors()
    setError(null)
    setResetSuccessMessage(null)
  }

  const selectedPortalDetails = SIGN_IN_PORTALS.find(({ id }) => id === selectedPortal) ?? SIGN_IN_PORTALS[2]
  const quickTestAccounts = program.slug === 'pinas'
    ? REWARDME_TEST_ACCOUNTS
    : program.slug === 'wondertown'
      ? WONDERTOWN_TEST_ACCOUNTS
      : null
  const quickTestPassword = program.slug === 'wondertown'
    ? WONDERTOWN_TEST_PASSWORD
    : REWARDME_TEST_PASSWORD
  const showQuickTestSignIn = Boolean(
    quickTestAccounts && shouldShowRewardMeTestCredentials(),
  )
  usePlatformDocumentBrand(selectedPortal === 'admin')

  if (showQuickTestSignIn && quickTestAccounts) {
    return (
      <AuthPortalShell showTabs={false} showUtilityControls={false}>
        <div className="text-center">
          <p className="font-serif text-[20px] font-bold leading-none text-[#d1ad4a]">
            {program.name}
          </p>
          <h1 className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8f8f8f]">
            {t('Sign In').toUpperCase()}
          </h1>
          <p className="mx-auto mt-4 max-w-[18rem] text-[13px] font-medium leading-5 text-[#8f8f8f]">
            {t('Choose your account type. Your assigned role is verified when you sign in.')}
          </p>
        </div>

        <div
          aria-label="Choose sign-in account type"
          className="mt-7 grid gap-3"
          role="group"
        >
          {SIGN_IN_PORTALS.map((portal) => {
            const accountPortal = portal.id === 'customer' ? 'member' : portal.id
            const account = quickTestAccounts.find(({ portal: value }) => value === accountPortal)
            if (!account) return null

            const Icon = signInPortalIcons[portal.id]
            const isSigningIn = activeQuickPortal === portal.id

            return (
              <button
                aria-label={t('Sign in as {role}', { role: t(portal.label) })}
                className="flex min-h-[74px] w-full items-center gap-4 rounded-[10px] border border-[#d1ad4a]/55 bg-[var(--background)]/45 px-5 py-4 text-left text-[var(--foreground)] shadow-sm transition hover:border-[#d1ad4a] hover:bg-[#d1ad4a] hover:text-[#080808] disabled:cursor-wait disabled:opacity-65"
                data-testid={`quick-sign-in-${portal.id}`}
                disabled={activeQuickPortal !== null}
                key={portal.id}
                onClick={() => {
                  setActiveQuickPortal(portal.id)
                  void signInTestAccount(account, quickTestPassword).finally(() => {
                    setActiveQuickPortal(null)
                  })
                }}
                type="button"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-current/20 bg-current/5">
                  {isSigningIn ? <LoadingSpinner /> : <Icon className="size-5" aria-hidden="true" />}
                </span>
                <span className="text-[16px] font-bold">
                  {isSigningIn
                    ? t('Signing in...')
                    : t('Sign in as {role}', { role: t(portal.label) })}
                </span>
              </button>
            )
          })}
        </div>

        {error ? <p className={`${authErrorClass} mt-5`}>{t(error)}</p> : null}
      </AuthPortalShell>
    )
  }

  return (
    <AuthPortalShell activeTab="signin">
      <div className="mb-7 text-center">
        <p className="font-serif text-[18px] font-bold leading-none text-[#d1ad4a]">
          {selectedPortal === 'admin' ? platformBrand.name : program.name}
        </p>
        <h1 className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8f8f8f]">
          {t('Sign In').toUpperCase()}
        </h1>
        <p className="mt-3 text-[11px] font-medium leading-4 text-[#8f8f8f]">
          {t('Choose your account type. Your assigned role is verified when you sign in.')}
        </p>
      </div>

      <div
        aria-label="Choose sign-in account type"
        className="mb-6 grid gap-2 sm:grid-cols-3"
        role="group"
      >
        {SIGN_IN_PORTALS.map((portal) => {
          const Icon = signInPortalIcons[portal.id]
          const isSelected = selectedPortal === portal.id

          return (
            <button
              aria-label={t('Sign in as {role}', { role: t(portal.label) })}
              aria-pressed={isSelected}
              className={`flex min-h-[72px] items-center gap-3 rounded-[8px] border px-3 py-3 text-left transition sm:flex-col sm:justify-center sm:gap-1.5 sm:text-center ${
                isSelected
                  ? 'border-[#d1ad4a] bg-[#d1ad4a] text-[#080808] shadow-[0_8px_20px_rgba(209,173,74,0.18)]'
                  : 'border-[#d1ad4a]/35 bg-[var(--background)]/40 text-[var(--foreground)] hover:border-[#d1ad4a] hover:text-[#d1ad4a]'
              }`}
              data-testid={`sign-in-portal-${portal.id}`}
              key={portal.id}
              onClick={() => selectPortal(portal.id)}
              type="button"
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[12px] font-bold">
                  {t('Sign in as {role}', { role: t(portal.label) })}
                </span>
                <span className={`mt-0.5 block text-[9px] leading-3 ${isSelected ? 'text-[#080808]/70' : 'text-[#8f8f8f]'}`}>
                  {t(portal.description)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {showForgotPassword ? (
        <form
          className="space-y-5"
          onSubmit={resetForm.handleSubmit(async (values) => {
            try {
              setError(null)
              setResetSuccessMessage(null)
              await authService.resetPassword(values.email.trim())
              setResetSuccessMessage(t('Check your email for a password reset link.'))
              setShowForgotPassword(false)
              resetForm.reset({ email: '' })
            } catch (submissionError) {
              setError(
                submissionError instanceof Error
                  ? submissionError.message
                  : t('Unable to send reset link.'),
              )
            }
          })}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-serif text-[22px] font-bold text-[#d1ad4a]">{t('Reset Password')}</h1>
            <p className="text-[12px] font-medium leading-5 text-[#8f8f8f]">
              {t("Enter your email and we'll send you a reset link.")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reset-email" className={authLabelClass}>{t('Email address')}</Label>
            <Input id="reset-email" className={authInputClass} placeholder="your@email.com" {...resetForm.register('email')} />
          </div>

          {error ? <p className={authErrorClass}>{t(error)}</p> : null}

          <Button
            type="submit"
            size="lg"
            className="h-[46px] w-full rounded-[6px] bg-[#d1ad4a] text-[14px] font-bold tracking-[0.04em] text-[#080808] hover:bg-[#c5a141]"
            disabled={resetForm.formState.isSubmitting}
          >
            {resetForm.formState.isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                {t('Send reset link')}
              </span>
            ) : (
              t('Send reset link')
            )}
          </Button>

          <button
            type="button"
            className="block w-full text-center text-[12px] font-semibold text-[#d1ad4a] transition hover:text-[#f0ca62]"
            onClick={() => {
              setError(null)
              setShowForgotPassword(false)
            }}
          >
            {t('Back to sign in')}
          </button>
        </form>
      ) : (
        <form
          aria-label={t('Sign in as {role}', { role: t(selectedPortalDetails.label) })}
          className="space-y-5"
          onSubmit={signInForm.handleSubmit(
            async (values) => {
              try {
                setError(null)
                setResetSuccessMessage(null)
                const profile = await signIn({
                  ...values,
                  role: getRequestedRoleForPortal(selectedPortal),
                })
                const redirect = searchParams.get('redirect')
                navigate(redirect || getHomePathForRole(profile.role))
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t('Unable to sign in.'),
                )
              }
            },
            () => {
              setError(t('Enter a valid email address and password to sign in.'))
            },
          )}
        >
          {resetSuccessMessage ? (
            <p className="text-center text-xs font-bold text-success">{resetSuccessMessage}</p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="signin-email" className={authLabelClass}>{t('Email address')}</Label>
            <Input id="signin-email" className={authInputClass} placeholder="your@email.com" {...signInForm.register('email')} />
            {signInForm.formState.errors.email ? (
              <p className="text-xs font-bold text-red-400">
                {t(signInForm.formState.errors.email.message ?? '')}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signin-password" className={authLabelClass}>{t('Password')}</Label>
            <div className="relative">
              <Input
                id="signin-password"
                className={`${authInputClass} pr-10`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...signInForm.register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-[#6b7280] transition hover:text-[#111827]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {signInForm.formState.errors.password ? (
              <p className="text-xs font-bold text-red-400">
                {t(signInForm.formState.errors.password.message ?? '')}
              </p>
            ) : null}
            <button
              type="button"
              className="justify-self-end text-[12px] font-semibold text-[#d1ad4a] transition hover:text-[#f0ca62]"
              onClick={() => {
                setError(null)
                resetForm.setValue('email', signInForm.getValues('email'))
                setShowForgotPassword(true)
              }}
            >
              {t('Forgot password?')}
            </button>
          </div>

          {error ? <p className={authErrorClass}>{t(error)}</p> : null}

          <Button
            type="submit"
            size="lg"
            className="h-[46px] w-full rounded-[6px] bg-[#d1ad4a] text-[14px] font-bold tracking-[0.04em] text-[#080808] hover:bg-[#c5a141]"
            disabled={signInForm.formState.isSubmitting}
          >
            {signInForm.formState.isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                {t('Signing in...')}
              </span>
            ) : (
              `${t('Sign in as {role}', { role: t(selectedPortalDetails.label) })} ↗`
            )}
          </Button>

          <p className="text-center text-[11px] font-medium text-[#8aa0bc]">
            {t("Don't have an account?")}{' '}
            <Link to="/join" className="font-bold text-[#d1ad4a] transition hover:text-[#f0ca62]">
              {t('Join {program}', { program: program.name })}
            </Link>
          </p>

        </form>
      )}
    </AuthPortalShell>
  )
}

export function AuthPage() {
  return <CompactAuthPage />
}
