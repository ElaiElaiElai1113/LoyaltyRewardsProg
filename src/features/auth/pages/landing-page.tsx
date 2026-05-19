import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  Car,
  Coins,
  DollarSign,
  ExternalLink,
  FileText,
  Gift,
  Leaf,
  MapPin,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { authSchema, type AuthFormValues } from '@/types/forms'
import {
  landingLogo,
  landingAgreementLabel,
  landingFaqItems,
  landingHeroEyebrow,
  landingHeroHeadline,
  landingHeroInfoRows,
  landingHeroPills,
  landingHowItWorksLead,
  landingHowItWorksSteps,
  landingJoinButtonLabel,
  landingParagraphs,
  landingSubscription,
} from '../landing-content'

const portalAccessErrorKey = 'portalAccessError'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

const authPanelTitleClass = 'font-serif text-4xl tracking-tight text-[var(--foreground)] md:text-5xl'
const authPanelCopyClass = 'text-sm font-semibold text-[var(--on-surface-variant)]'
const authInputClass =
  'border-[var(--champagne)]/38 bg-[var(--espresso)]/58 text-[var(--cream)] placeholder:text-[var(--cream)]/62 focus-visible:ring-[var(--champagne)]/32'

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
  const { t } = useLanguage()

  const heroInfoIconByName = {
    chart: BarChart3,
    cart: ShoppingCart,
  } as const

  const heroPillIconByName = {
    building: Building2,
    car: Car,
    gift: Gift,
    leaf: Leaf,
  } as const

  const landingFaqIconByQuestion = {
    [landingFaqItems[0].question]: MapPin,
    [landingFaqItems[1].question]: Users,
    [landingFaqItems[2].question]: ArrowLeftRight,
    [landingFaqItems[3].question]: DollarSign,
  } as const

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f8] text-[#232326]">
      <header className="landing-header-figma flex h-[61px] items-center border-b border-[#dde1e6] bg-[#ffffff] px-8">
        <div className="mx-auto flex w-full max-w-none items-center justify-between">
          <Link to="/" className="font-serif text-[24px] font-semibold leading-none text-[#202023]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
            <span className="sr-only">{t(landingLogo)}</span>
          </Link>
          <nav className="hidden items-center gap-[27px] text-[14px] font-normal leading-none text-[#667083] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#202023]">
              {t('How it works')}
            </a>
            <a href="#businesses" className="transition hover:text-[#202023]">
              {t('Businesses')}
            </a>
            <a href="#faq" className="transition hover:text-[#202023]">
              {t('FAQ')}
            </a>
            <Link to="/early-access" className="text-[#c8a23d] transition hover:text-[#a77816]">
              {t('Join now')}
            </Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero-exact flex min-h-[777px] items-start justify-center px-4 pb-16 pt-[66px] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[820px] flex-col items-center text-center">
          <p className="mb-[22px] rounded-full border border-[#d9bd73] bg-[#fff9ed] px-[18px] py-[7px] text-[11px] font-medium uppercase leading-none tracking-[0.28em] text-[#9f730f]">
            {t(landingHeroEyebrow)}
          </p>

          <h1 className="max-w-[650px] font-serif text-[36px] font-bold leading-[1.18] tracking-normal text-[#202023] sm:text-[38px]">
            {t(landingHeroHeadline.beforeHighlight)}
            <span className="text-[#c8a23d]">{t(landingHeroHeadline.highlight)}</span>
            {t(landingHeroHeadline.afterHighlight)}
          </h1>

          <div className="mt-[21px] max-w-[582px] space-y-[18px] text-[17px] font-normal leading-[1.55] tracking-normal text-[#687386]">
            {landingParagraphs.map((paragraph) => (
              <p key={paragraph}>{t(paragraph)}</p>
            ))}
          </div>

          <div className="mt-[33px] grid w-full max-w-[672px] gap-3">
            {landingHeroInfoRows.map((row) => {
              const Icon = heroInfoIconByName[row.icon]

              return (
                <div key={row.text} className="flex min-h-[51px] items-center gap-3 rounded-xl border border-[#dde1e6] bg-[#ffffff] px-5 py-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.08)]">
                  <Icon className="size-4 shrink-0 text-[#c8a23d]" strokeWidth={1.75} aria-hidden="true" />
                  <p className="text-[14px] font-normal leading-[1.45] text-[#687386]">
                    {row.text === landingHeroInfoRows[0].text ? (
                      <>
                        {t('Earn between ')}
                        <span className="text-[#202023]">{t('20% - 100%')}</span>
                        {t(' by simply spending at amazing businesses within our platform')}
                      </>
                    ) : (
                      t(row.text)
                    )}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-[33px] flex w-full max-w-[820px] flex-wrap justify-center gap-[10px]">
            {landingHeroPills.map((pill) => {
              const Icon = heroPillIconByName[pill.icon]

              return (
                <span key={pill.label} className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-[#dfe3e8] bg-[#ffffff] px-[17px] text-[14px] font-normal text-[#505761] shadow-[0_1px_1px_rgba(16,24,40,0.03)]">
                  <Icon className="size-4 shrink-0 text-[#c8a23d]" strokeWidth={1.65} aria-hidden="true" />
                  {t(pill.label)}
                </span>
              )
            })}
          </div>

          <Link
            to="/early-access"
            className="mt-8 inline-flex min-h-[51px] min-w-[266px] items-center justify-center gap-1.5 rounded-lg bg-[#d3ae43] px-8 text-[15px] font-bold text-[#111111] shadow-none transition hover:bg-[#c49e34]"
          >
            {t(landingJoinButtonLabel)}
            <ExternalLink className="size-4 text-[#4d8ac7]" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section id="businesses" className="landing-subscription-figma border-t border-[#dde1e6] bg-[#ffffff] px-4 pb-12 pt-[55px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <h2 className="mx-auto font-serif text-[26px] font-semibold leading-none tracking-normal text-[#202023]">
            {t('Early adopter monthly subscription')}
          </h2>

          <article className="relative mt-[39px] w-full max-w-[340px] rounded-[0.7rem] border-2 border-[#d0a534] bg-[#ffffff] px-7 pb-[17px] pt-[61px] shadow-none">
            <div className="absolute left-1/2 top-0 flex h-[27px] min-w-[193px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#d4af43] px-5 text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-[#171108]">
              {t(landingSubscription.offerBadge)}
            </div>
            <p className="text-[14px] font-normal uppercase leading-none tracking-[0.32em] text-[#667083]">
              {t(landingSubscription.eyebrow)}
            </p>
            <div className="mx-auto mt-[17px] flex min-h-[82px] max-w-[280px] flex-col items-center justify-center rounded-[0.45rem] bg-[#f7f8fb] px-5 py-4">
              <p className="text-[11px] font-normal uppercase leading-none tracking-normal text-[#667083]">
                {t(landingSubscription.bonusLabel)}
              </p>
              <p className="mt-3 text-[24px] font-semibold leading-none tracking-normal text-[#d0a534]">
                {t(landingSubscription.rewardValue)}
              </p>
            </div>
            <Button asChild size="lg" className="mx-auto mt-5 min-h-[45px] w-full max-w-[280px] rounded-[0.45rem] bg-[#d4af43] text-[14px] font-semibold text-[#070707] shadow-none hover:bg-[#c6a238]">
              <Link to="/early-access">{t('Join now')}</Link>
            </Button>
            <div className="mt-[12px] flex items-center justify-center gap-1.5 text-[11px] text-[#667083]">
              <FileText className="size-3 text-[#667083]" aria-hidden="true" />
              <span>{t('Member agreement applies')}</span>
            </div>
          </article>

          <Button asChild variant="secondary" size="lg" className="mt-8 min-h-[50px] rounded-[0.45rem] border border-[#dde1e6] bg-[#ffffff] px-8 text-[14px] font-medium text-[#40506d] shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-[#ffffff]">
            <Link to="/reward-terms" aria-label="View Agreement">
              <FileText className="size-4 text-[#d0a534]" aria-hidden="true" />
              {t(landingAgreementLabel)}
            </Link>
          </Button>
        </div>
      </section>

      <section id="how-it-works" className="landing-how-it-works-figma border-t border-[#dde1e6] bg-[#f6f7f8] px-[32px] pb-[35px] pt-[55px]">
        <div className="mx-auto max-w-[1216px]">
          <div className="text-center">
            <h2 className="font-serif text-[26px] font-semibold leading-none tracking-normal text-[#202023]">
              {t('How it works')}
            </h2>
            <p className="mt-[17px] text-[14px] leading-none text-[#667083]">
              {t(landingHowItWorksLead)}
            </p>
          </div>

          <div className="mt-[35px] grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {landingHowItWorksSteps.map((step) => (
              <article key={step.number} className="flex h-[155px] flex-col items-center justify-center rounded-[0.7rem] border border-[#dde1e6] bg-[#fbfcfd] px-7 py-0 text-center shadow-none">
                <div className="mx-auto flex size-[34px] items-center justify-center rounded-full border border-[#d9bd73] bg-[#fff9ed] text-[15px] font-medium text-[#9f730f]">
                  {step.number}
                </div>
                <h3 className="mt-[15px] text-[15px] font-medium leading-none text-[#202023]">{t(step.title)}</h3>
                <p className="mt-[13px] max-w-[218px] text-[13px] leading-[1.55] text-[#667083]">{t(step.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="landing-faq-figma border-t border-[#dde1e6] bg-[#f6f7f8] px-4 pb-[49px] pt-[57px] sm:px-6">
        <div className="mx-auto max-w-[672px]">
          <div className="text-center">
            <h2 className="font-serif text-[26px] font-semibold leading-none tracking-normal text-[#202023]">
              {t('Frequently asked questions')}
            </h2>
          </div>

          <div className="mt-[35px] space-y-[11px]">
            {landingFaqItems.map((item) => {
              const FaqIcon = landingFaqIconByQuestion[item.question]

              return (
              <details key={item.question} className="group rounded-[0.45rem] border border-[#dde1e6] bg-[#ffffff] px-5 shadow-none">
                <summary className="flex min-h-[63px] cursor-pointer list-none items-center gap-3 text-[14px] font-medium leading-none text-[#202023]">
                  <FaqIcon className="size-4 shrink-0 text-[#c8a23d]" strokeWidth={1.8} aria-hidden="true" />
                  <span>{t(item.question)}</span>
                </summary>
                <p className="pb-5 pl-7 text-[13px] leading-[1.55] text-[#667083]">
                  {t(item.answer)}
                </p>
              </details>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="landing-footer-figma flex min-h-[108px] items-center border-t border-[#dde1e6] bg-[#ffffff] px-[32px] py-0">
        <div className="mx-auto grid w-full max-w-none gap-5 text-center lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:text-left">
          <p className="font-serif text-[18px] font-semibold leading-none text-[#202023]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
          </p>
          <p className="text-[12px] leading-none text-[#667083]">
            {t("The world's highest paying rewards program")}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-3 text-[12px] leading-none text-[#667083] lg:justify-end">
            <Link to="/reward-terms" className="transition hover:text-[#1a1a1a]">
              {t('Member agreement')}
            </Link>
            <span className="hidden text-[#d1d5db] sm:inline">·</span>
            <Link to="/privacy" className="transition hover:text-[#1a1a1a]">
              {t('Privacy policy')}
            </Link>
            <span className="hidden text-[#d1d5db] sm:inline">·</span>
            <Link to="/terms" className="transition hover:text-[#1a1a1a]">
              {t('Contact')}
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
export function AuthPage() {
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
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-[78rem] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.86fr)]">
        <section className="relative flex h-auto min-h-0 flex-col justify-center overflow-hidden rounded-[1.25rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-8 text-[var(--cream)] shadow-panel md:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[3rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 space-y-6">
            <Badge variant="default" className="w-fit border-[var(--champagne)]/55 bg-[linear-gradient(90deg,var(--cream),var(--champagne))] px-4 py-1.5 text-[var(--espresso)] shadow-soft">
              {t('Medellin Rewards')}
            </Badge>
            <div className="space-y-3">
              <h1 className="font-serif text-[clamp(2.25rem,4.2vw,3.5rem)] font-semibold leading-[0.96] text-[var(--cream)]">
                {t('Sign in to your member account.')}
              </h1>
              <p className="max-w-md text-sm font-medium leading-6 text-[var(--cream)]/82">
                {t('Track your rewards, gift-card value, and member activity in one verified account across the network.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Coins className="size-5 text-[var(--champagne)]" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--champagne)]">
                {t('20–100% back on eligible spending')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
              >
                {t('Back to landing page')}
              </Link>
            </div>
          </div>

          {error ? <p className="relative z-10 mt-8 text-sm font-bold text-red-300">{t(error)}</p> : null}
        </section>

        <section className="flex min-h-0 flex-col justify-center py-4">
          <div className="mb-6 flex justify-end gap-2">
            <ThemeToggle className="rounded-full border border-[var(--champagne)]/24 bg-[var(--espresso)]/35 text-[var(--champagne)] hover:bg-[var(--espresso)]/55 hover:text-[var(--cream)]" />
            <LanguagePicker className="text-on-surface-variant" />
          </div>
          <div className="space-y-5">
            <div className="space-y-1.5 text-center">
              <h2 className={authPanelTitleClass}>
                {t('Welcome Back')}
              </h2>
              <p className={authPanelCopyClass}>
                {t('Step back into your rewards ritual.')}
              </p>
            </div>

            <div className="relative mx-auto min-h-[25.5rem] max-w-md overflow-hidden rounded-[1.25rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
              <div className="absolute right-0 top-0 size-24 rounded-bl-[3rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
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
          </div>
        </section>
      </div>
    </div>
  )
}
