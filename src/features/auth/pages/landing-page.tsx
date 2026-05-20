import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  Coins,
  DollarSign,
  ExternalLink,
  Gift,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
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
  landingClientHero,
  landingLogo,
  landingEarlySubscriberBenefits,
  landingFaqItems,
  landingMembershipAdvantages,
  landingRewardsSteps,
  landingWhyJoinItems,
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

  const landingFaqIconByQuestion = {
    [landingFaqItems[0].question]: MapPin,
    [landingFaqItems[1].question]: Users,
    [landingFaqItems[2].question]: ArrowLeftRight,
    [landingFaqItems[3].question]: DollarSign,
  } as const

  const whyJoinIcons = [ShoppingCart, Users, Sparkles] as const
  const earlyBenefitIcons = [BadgeCheck, Gift, Sparkles, ArrowRight] as const
  const membershipIcons = [ShieldCheck, Coins, BadgeCheck] as const

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f8] text-[#232326]">
      <header className="landing-header-figma sticky top-0 z-40 flex min-h-[61px] items-center border-b border-[#dde1e6] bg-[#ffffff]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4">
          <Link to="/landing-page" className="font-serif text-[24px] font-semibold leading-none text-[#202023]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
            <span className="sr-only">{t(landingLogo)}</span>
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] font-medium leading-none text-[#667083] lg:flex">
            <a href="#why-join" className="transition hover:text-[#202023]">
              {t('Why join')}
            </a>
            <a href="#early-benefits" className="transition hover:text-[#202023]">
              {t('Early benefits')}
            </a>
            <a href="#rewards-system" className="transition hover:text-[#202023]">
              {t('Rewards system')}
            </a>
            <a href="#membership" className="transition hover:text-[#202023]">
              {t('Membership')}
            </a>
            <a href="#faq" className="transition hover:text-[#202023]">
              {t('FAQ')}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguagePicker className="hidden text-[#667083] sm:flex" compact />
            <Link to="/early-access" className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#d3ae43] px-4 text-[13px] font-bold text-[#111111] transition hover:bg-[#c49e34]">
              {t('Join early')}
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero-exact flex min-h-[690px] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:items-center">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-[#d9bd73] bg-[#fff9ed] px-4 py-2 text-[11px] font-semibold uppercase leading-none tracking-[0.18em] text-[#9f730f]">
              {t(landingClientHero.eyebrow)}
            </p>
            <h1 className="max-w-[720px] font-serif text-[34px] font-semibold leading-[1.12] tracking-normal text-[#202023] sm:text-[44px] lg:text-[52px]">
              {t(landingClientHero.headline)}
            </h1>
            <p className="mt-5 max-w-[660px] text-[17px] leading-8 text-[#5d6676]">
              {t(landingClientHero.body)}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/early-access"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-lg bg-[#d3ae43] px-6 text-[15px] font-bold text-[#111111] transition hover:bg-[#c49e34]"
              >
                {t(landingClientHero.primaryCta)}
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#rewards-system"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-lg border border-[#d6dbe2] bg-white px-6 text-[15px] font-semibold text-[#40506d] transition hover:border-[#c8a23d]"
              >
                {t(landingClientHero.secondaryCta)}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="rounded-[0.8rem] border border-[#dde1e6] bg-white p-6 shadow-[0_14px_45px_rgba(16,24,40,0.08)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#667083]">
              {t('Early subscriber summary')}
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[0.55rem] bg-[#f7f8fb] p-5">
                <p className="text-[28px] font-semibold leading-none text-[#d0a534]">20% - 100%</p>
                <p className="mt-2 text-[13px] leading-5 text-[#5d6676]">
                  {t('Rewards on eligible spending, depending on the offer.')}
                </p>
              </div>
              <div className="rounded-[0.55rem] bg-[#f7f8fb] p-5">
                <p className="text-[18px] font-semibold leading-none text-[#202023]">
                  {t('Early access before public launch')}
                </p>
                <p className="mt-2 text-[13px] leading-5 text-[#5d6676]">
                  {t('Join before the wider launch and receive first updates as the network opens.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-join" className="border-t border-[#dde1e6] bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9f730f]">{t('Why join')}</p>
            <h2 className="mt-3 font-serif text-[30px] font-semibold leading-tight text-[#202023]">{t('Why people should join')}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#667083]">{t('Medellin Rewards is built for members who want everyday spending to create more usable value over time.')}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {landingWhyJoinItems.map((item, index) => {
              const Icon = whyJoinIcons[index]

              return (
                <article key={item.title} className="rounded-[0.7rem] border border-[#dde1e6] bg-[#fbfcfd] p-6">
                  <Icon className="size-5 text-[#c8a23d]" aria-hidden="true" />
                  <h3 className="mt-4 text-[16px] font-semibold text-[#202023]">{t(item.title)}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#667083]">{t(item.body)}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="early-benefits" className="landing-subscription-figma border-t border-[#dde1e6] bg-[#f6f7f8] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9f730f]">{t('Early benefits')}</p>
              <h2 className="mt-3 font-serif text-[30px] font-semibold leading-tight text-[#202023]">{t('Early subscriber benefits')}</h2>
              <p className="mt-3 text-[15px] leading-7 text-[#667083]">{t('Subscribers join before the public launch and receive early access to updates, launch offers, and first reward opportunities.')}</p>
            </div>
            <Button asChild size="lg" className="min-h-[45px] rounded-[0.45rem] bg-[#d4af43] text-[14px] font-semibold text-[#070707] shadow-none hover:bg-[#c6a238]">
              <Link to="/early-access">{t('Join early')}</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {landingEarlySubscriberBenefits.map((item, index) => {
              const Icon = earlyBenefitIcons[index]

              return (
                <article key={item.title} className="rounded-[0.7rem] border border-[#dde1e6] bg-white p-6">
                  <Icon className="size-5 text-[#c8a23d]" aria-hidden="true" />
                  <h3 className="mt-4 text-[15px] font-semibold leading-5 text-[#202023]">{t(item.title)}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#667083]">{t(item.body)}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="rewards-system" className="landing-how-it-works-figma border-t border-[#dde1e6] bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9f730f]">{t('Rewards system')}</p>
            <h2 className="mt-3 font-serif text-[30px] font-semibold leading-tight text-[#202023]">{t('How the rewards system works')}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#667083]">{t('The program connects eligible purchases to rewards that can be redeemed through the Medellin Rewards network.')}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {landingRewardsSteps.map((step, index) => (
              <article key={step.title} className="rounded-[0.7rem] border border-[#dde1e6] bg-[#fbfcfd] p-6">
                <div className="flex size-[34px] items-center justify-center rounded-full border border-[#d9bd73] bg-[#fff9ed] text-[15px] font-medium text-[#9f730f]">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold leading-5 text-[#202023]">{t(step.title)}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#667083]">{t(step.body)}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 rounded-[0.45rem] border border-[#dde1e6] bg-[#f7f8fb] px-4 py-3 text-[13px] leading-6 text-[#667083]">
            {t('Rewards are program credits and offers, not automatic cash payouts.')}
          </p>
        </div>
      </section>

      <section id="membership" className="border-t border-[#dde1e6] bg-[#f6f7f8] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9f730f]">{t('Membership')}</p>
            <h2 className="mt-3 font-serif text-[30px] font-semibold leading-tight text-[#202023]">{t('Membership advantages')}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#667083]">{t('Membership is the account layer that helps unlock, track, and protect reward value.')}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {landingMembershipAdvantages.map((item, index) => {
              const Icon = membershipIcons[index]

              return (
                <article key={item.title} className="rounded-[0.7rem] border border-[#dde1e6] bg-white p-6">
                  <Icon className="size-5 text-[#c8a23d]" aria-hidden="true" />
                  <h3 className="mt-4 text-[16px] font-semibold text-[#202023]">{t(item.title)}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#667083]">{t(item.body)}</p>
                </article>
              )
            })}
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
            <Link to="/early-access" className="font-semibold text-[#c8a23d] transition hover:text-[#a77816]">
              {t('Join early')}
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
