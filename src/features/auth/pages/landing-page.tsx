import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowUpRight,
  BadgePercent,
  CarFront,
  ChevronRight,
  CirclePercent,
  Coins,
  FileText,
  Hotel,
  Landmark,
  Sparkles,
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
  landingAgreementLabel,
  landingCategoryTags,
  landingEyebrow,
  landingFaqItems,
  landingHeadline,
  landingHighlights,
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
  const categoryIcons = [Hotel, CarFront, CirclePercent, Sparkles] as const

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f9fafb] text-[#1a1a1a]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
          <Link to="/" className="font-serif text-xl font-semibold tracking-[0.04em] text-[#1a1a1a]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-[#6b7280] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#1a1a1a]">
              {t('How it works')}
            </a>
            <Link to="/for-businesses" className="transition hover:text-[#1a1a1a]">
              {t('For businesses')}
            </Link>
            <a href="#faq" className="transition hover:text-[#1a1a1a]">
              {t('FAQ')}
            </a>
            <Link to="/join" className="font-medium text-[#c9a84c] transition hover:text-[#a07820]">
              {t('Join now')}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguagePicker compact className="hidden text-[#6b7280] sm:flex" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="border-b border-[#e5e7eb] px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pt-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 text-center">
          <Badge className="max-w-full rounded-full border-[#c9a84c]/40 bg-[#c9a84c]/12 px-4 py-2 text-[10px] font-medium tracking-[0.18em] text-[#a07820] sm:px-5 sm:text-[11px] sm:tracking-[0.22em]">
            {t(landingEyebrow)}
          </Badge>

          <div className="w-full max-w-[min(92vw,72rem)] space-y-5">
            <h1 className="mx-auto max-w-[18ch] text-balance font-serif text-[clamp(3rem,7vw,6.25rem)] font-semibold leading-[0.96] tracking-[-0.03em] text-[#1a1a1a]">
              {t(landingHeadline)}
            </h1>
            <div className="mx-auto max-w-[min(92vw,60rem)] space-y-4 text-[clamp(1.05rem,2vw,1.8rem)] leading-[1.55] text-[#6b7280]">
              {landingParagraphs.map((paragraph) => (
                <p key={paragraph} className="mx-auto max-w-[34ch] text-pretty">
                  {t(paragraph)}
                </p>
              ))}
            </div>
          </div>

          <div className="w-full max-w-[min(92vw,56rem)] space-y-3 pt-3">
            {landingHighlights.map((highlight, index) => {
              const HighlightIcon = index === 0 ? BadgePercent : Landmark
              return (
                <div
                  key={highlight}
                  className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-4 text-left shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:px-5"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-[#c9a84c]">
                    <HighlightIcon className="size-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm leading-6 text-[#6b7280] sm:text-[15px]">
                    {t(highlight)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex w-full max-w-[min(94vw,64rem)] flex-wrap items-center justify-center gap-3 pt-1">
            {landingCategoryTags.map((tag, index) => {
              const TagIcon = categoryIcons[index]
              return (
                <div
                  key={tag}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 text-[13px] text-[#555] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <TagIcon className="size-3.5 text-[#c9a84c]" aria-hidden="true" />
                  <span>{t(tag)}</span>
                </div>
              )
            })}
          </div>

          <Button asChild size="lg" className="mt-2 h-auto rounded-lg bg-[#c9a84c] px-10 py-3.5 text-[15px] font-semibold text-[#1a1000] shadow-none hover:bg-[#b99534]">
            <Link to="/join">
              {t(landingJoinButtonLabel)}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
          <div className="space-y-2">
            <h2 className="mx-auto max-w-[18ch] text-balance font-serif text-[clamp(2.1rem,4.4vw,4.1rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-[#1a1a1a]">
              {t('Early adopter monthly subscription')}
            </h2>
          </div>

          <article className="relative w-full max-w-[680px] rounded-[1.55rem] border-[4px] border-[#cda640] bg-white px-6 pb-12 pt-16 shadow-none sm:px-10 sm:pb-14 sm:pt-18">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d1af49] px-9 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a1000] sm:px-10 sm:text-[11px]">
              {t(landingSubscription.offerBadge)}
            </div>
            <p className="text-[clamp(1.15rem,2vw,1.9rem)] font-medium uppercase tracking-[0.22em] text-[#6b7280]">
              {t(landingSubscription.eyebrow)}
            </p>
            <div className="mx-auto mt-6 max-w-[560px] rounded-[1.2rem] bg-[#f7f8fb] px-5 py-8 sm:px-8 sm:py-9">
              <p className="text-[clamp(1rem,1.5vw,1.1rem)] uppercase tracking-[0.04em] text-[#6b7280]">
                {t(landingSubscription.bonusLabel)}
              </p>
              <p className="mx-auto mt-5 max-w-[14ch] text-balance text-[clamp(2.2rem,4.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[#cda640]">
                {t(landingSubscription.rewardValue)}
              </p>
            </div>
            <Button asChild size="lg" className="mx-auto mt-9 h-16 w-full max-w-[560px] rounded-[1rem] bg-[#d1af49] text-[clamp(1.15rem,2vw,1.5rem)] font-semibold text-[#1a1000] shadow-none hover:bg-[#b99534]">
              <Link to="/join">{t('Join now')}</Link>
            </Button>
            <div className="mt-6 flex items-center justify-center gap-2 text-[clamp(1rem,1.5vw,1.15rem)] text-[#6b7280]">
              <FileText className="size-4 text-[#6b7280]" aria-hidden="true" />
              <span>{t('Member agreement applies')}</span>
            </div>
          </article>

          <Button asChild variant="secondary" size="lg" className="mt-2 h-15 rounded-[1rem] border-[#d8dde7] bg-white px-10 text-[clamp(1.05rem,1.8vw,1.35rem)] font-medium text-[#566173] shadow-[0_14px_28px_-24px_rgba(30,41,59,0.28)] hover:bg-[#fafbfd]">
            <Link to="/reward-terms">
              <FileText className="size-5 text-[#cda640]" aria-hidden="true" />
              {t(landingAgreementLabel)}
            </Link>
          </Button>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-[#e5e7eb] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-[#1a1a1a] sm:text-[2.5rem]">
              {t('How it works')}
            </h2>
            <p className="mt-3 text-sm text-[#6b7280] sm:text-base">
              {t(landingHowItWorksLead)}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {landingHowItWorksSteps.map((step) => (
              <article key={step.number} className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-6 text-center shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="mx-auto flex size-9 items-center justify-center rounded-full border border-[#c9a84c]/50 bg-[#c9a84c]/10 text-sm font-semibold text-[#a07820]">
                  {step.number}
                </div>
                <h3 className="mt-4 text-[15px] font-medium text-[#1a1a1a]">{t(step.title)}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7280]">{t(step.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-[#e5e7eb] bg-[#f9fafb] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-[#1a1a1a] sm:text-[2.5rem]">
              {t('Frequently asked questions')}
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {landingFaqItems.map((item) => (
              <details key={item.question} className="group rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[#1a1a1a] sm:text-[15px]">
                  <span>{t(item.question)}</span>
                  <ChevronRight className="size-4 shrink-0 text-[#c9a84c] transition group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="pt-4 text-sm leading-6 text-[#6b7280]">
                  {t(item.answer)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e5e7eb] bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-center sm:text-left lg:flex-row lg:items-center lg:justify-between">
          <p className="font-serif text-lg font-semibold text-[#1a1a1a]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
          </p>
          <p className="text-xs text-[#6b7280]">
            {t("The world's highest paying rewards program")}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#6b7280] lg:justify-end">
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
