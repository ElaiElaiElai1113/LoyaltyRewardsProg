import { zodResolver } from '@hookform/resolvers/zod'
import {
  BadgeCheck,
  BarChart3,
  Car,
  Coins,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Gift,
  Hotel,
  KeyRound,
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
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
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
const authPanelTitleClass = 'font-serif text-4xl tracking-tight text-[var(--foreground)] md:text-5xl'
const authPanelCopyClass = 'text-sm font-semibold text-[var(--on-surface-variant)]'

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
  const featureRows = [
    {
      icon: BarChart3,
      text: (
        <>
          Earn between <strong className="font-semibold text-[#28292b]">20% - 100%</strong> by simply spending at amazing businesses within our platform
        </>
      ),
    },
    {
      icon: ShoppingCart,
      text: 'Earn from purchasing almost any type of product or service from going to a restaurant or hotel to buying a car or home.',
    },
  ] as const

  const categoryPills = [
    { icon: Hotel, label: 'Restaurants & hotels' },
    { icon: Car, label: 'Cars & real estate' },
    { icon: Gift, label: '20% - 100% back' },
    { icon: Leaf, label: 'Any product or service' },
  ] as const

  const steps = [
    {
      title: 'Join',
      body: 'Sign up as a member and receive your $100k early adopter bonus rewards.',
    },
    {
      title: 'Spend',
      body: 'Shop, dine, and buy services at any business in our network.',
    },
    {
      title: 'Earn',
      body: 'Automatically earn 20%-100% back in rewards on every purchase.',
    },
    {
      title: 'Redeem',
      body: 'Use your rewards for travel, experiences, and more - free vacation every year.',
    },
  ] as const

  const faqs = [
    {
      icon: MapPin,
      question: 'Where can I use my rewards?',
      answer: 'You can use your rewards with partnered businesses inside the Medellin Rewards network. As the network grows, more places to earn and redeem will become available to members.',
    },
    {
      icon: Users,
      question: 'Can I have more than one rewards account?',
      answer: 'No. Each person can have one rewards account. Medellin Rewards uses ID verification to keep rewards fair, protect member value, and prevent duplicate accounts.',
    },
    {
      icon: BadgeCheck,
      question: 'Can I transfer rewards to another account?',
      answer: 'Rewards are tied to your verified member account and cannot be transferred. This helps protect your balance and keeps the program secure for every member.',
    },
    {
      icon: DollarSign,
      question: 'Can rewards be exchanged for money?',
      answer: 'No. Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within the Medellin Rewards program, not cash exchange.',
    },
  ] as const

  return (
    <main className="screenshot-landing min-h-screen overflow-x-hidden bg-[#f6f7f8] text-[#242426]">
      <header className="sticky top-0 z-40 flex min-h-[61px] items-center border-b border-[#e1e4e8] bg-[#ffffff] px-8">
        <div className="mx-auto flex w-full max-w-[1336px] items-center justify-between gap-4">
          <Link to="/landing-page" className="font-serif text-[23px] font-bold leading-none tracking-[-0.01em] text-[#202023]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
          </Link>
          <nav className="hidden items-center gap-[30px] text-[14px] font-medium leading-none text-[#687282] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#202023]">
              How it works
            </a>
            <Link to="/business" className="transition hover:text-[#202023]">
              Businesses
            </Link>
            <a href="#faq" className="transition hover:text-[#202023]">
              FAQ
            </a>
            <Link to="/invitation" className="font-semibold text-[#caa747] transition hover:text-[#a87916]">
              Join now
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#e1e4e8] px-4 pb-[38px] pt-[52px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[790px] flex-col items-center text-center">
          <p className="landing-soft-gold-border inline-flex min-h-[32px] items-center rounded-full border border-[#dcc070] bg-[#fffaf0] px-[18px] text-[12px] font-semibold uppercase leading-none tracking-[0.22em] text-[#a47713]">
            The world's highest paying rewards program
          </p>

          <h1 className="mt-[24px] max-w-[700px] font-serif text-[38px] font-bold leading-[1.11] tracking-normal text-[#202023] sm:text-[44px]">
            Earn a <span className="text-[#cfaa44]">free vacation</span> every year - doing what you already do
          </h1>

          <div className="mt-[22px] max-w-[610px] space-y-[18px] text-[17px] font-medium leading-[1.55] text-[#687282]">
            <p>
              Imagine being able to earn enough rewards every year for a free vacation by doing what you already do,
              with Medellin Rewards you can do exactly that!
            </p>
            <p>
              Medellin Rewards pays a minimum of 20% to a maximum of 100% in Rewards when you spend your money
              with the businesses that are within our network.
            </p>
          </div>

          <div className="mt-[30px] grid w-full max-w-[700px] gap-[14px]">
            {featureRows.map((item) => {
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
            {categoryPills.map((item) => {
              const Icon = item.icon

              return (
                <span key={item.label} className="inline-flex min-h-[38px] items-center gap-[10px] rounded-full border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[13px] font-medium text-[#545b66]">
                  <Icon className="size-[15px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </span>
              )
            })}
          </div>

          <Link
            to="/invitation"
            className="mt-[26px] inline-flex min-h-[54px] min-w-[278px] items-center justify-center rounded-[8px] bg-[#d1ad4a] px-8 text-[15px] font-bold text-[#121212] transition hover:bg-[#c29f3d]"
          >
            Join Medellin Rewards
          </Link>
        </div>
      </section>

      <section className="border-b border-[#e1e4e8] bg-[#ffffff] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">
            Early adopter monthly subscription
          </h2>

          <div className="landing-gold-border mt-[30px] w-full max-w-[352px] rounded-[10px] border-2 border-[#d1ad4a] bg-[#ffffff] px-[30px] pb-[22px] pt-[38px]">
            <p className="mx-auto -mt-[50px] flex h-[28px] w-[200px] items-center justify-center rounded-full bg-[#d1ad4a] text-[12px] font-bold uppercase tracking-[0.18em] text-[#202023]">
              Early adopter offer
            </p>
            <p className="mt-[22px] text-[15px] font-bold uppercase tracking-[0.22em] text-[#7a8291]">
              Monthly subscription
            </p>

            <div className="mt-[13px] rounded-[8px] bg-[#f8f9fb] px-4 py-[14px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#9aa2af]">$100,000 Bonus 100%</p>
              <p className="mt-[10px] text-[25px] font-bold leading-none text-[#d0a63d]">$100,000 in Rewards</p>
            </div>

            <Link
              to="/invitation"
              className="mt-[14px] flex min-h-[44px] w-full items-center justify-center rounded-[8px] bg-[#d1ad4a] text-[15px] font-bold text-[#121212] transition hover:bg-[#c29f3d]"
            >
              Join now
            </Link>

            <p className="mt-[14px] flex items-center justify-center gap-[5px] text-[12px] font-medium text-[#7a8291]">
              <FileText className="size-[13px]" strokeWidth={1.7} aria-hidden="true" />
              Member agreement applies
            </p>
          </div>

          <Link
            to="/reward-terms"
            className="mt-[22px] inline-flex min-h-[48px] items-center justify-center gap-[12px] rounded-[8px] border border-[#dfe3e8] bg-[#ffffff] px-[27px] text-[14px] font-semibold text-[#4f5866] shadow-[0_2px_4px_rgba(16,24,40,0.04)] transition hover:border-[#d1ad4a]"
          >
            <KeyRound className="size-[17px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
            View Agreement
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[#e1e4e8] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">How it works</h2>
          <p className="mt-[14px] text-[15px] font-medium text-[#687282]">Three simple steps to start earning rewards</p>

          <div className="mt-[24px] grid gap-[16px] md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="flex min-h-[132px] flex-col items-center rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[28px] py-[16px]">
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

      <section id="faq" className="border-b border-[#e1e4e8] px-4 pb-[34px] pt-[38px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[700px]">
          <h2 className="text-center font-serif text-[30px] font-bold leading-none text-[#202023]">
            Frequently asked questions
          </h2>

          <div className="mt-[24px] space-y-[11px]">
            {faqs.map((item) => {
              const Icon = item.icon

              return (
                <details key={item.question} className="group rounded-[7px] border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[#2f3339]">
                  <summary className="flex min-h-[58px] cursor-pointer list-none items-center gap-[13px] text-[14px] font-bold [&::-webkit-details-marker]:hidden">
                    <Icon className="size-[15px] shrink-0 text-[#caa747]" strokeWidth={1.7} aria-hidden="true" />
                    <span>{item.question}</span>
                  </summary>
                  <p className="pb-[18px] pl-[28px] pr-[10px] text-[13px] font-medium leading-[1.65] text-[#687282]">
                    {item.answer}
                  </p>
                </details>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="flex min-h-[86px] items-center bg-[#ffffff] px-8">
        <div className="mx-auto grid w-full max-w-[1336px] gap-4 text-center md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
          <p className="font-serif text-[20px] font-bold leading-none tracking-[-0.01em] text-[#202023]">
            Medellin <span className="text-[#c9a84c]">Rewards</span>
          </p>
          <p className="text-[12px] font-medium text-[#687282]">The world's highest paying rewards program</p>
          <nav className="flex flex-wrap items-center justify-center gap-[16px] text-[12px] font-medium text-[#687282] md:justify-end">
            <Link to="/reward-terms" className="transition hover:text-[#202023]">Member agreement</Link>
            <span className="text-[#c5cad2]">|</span>
            <Link to="/privacy" className="transition hover:text-[#202023]">Privacy policy</Link>
            <span className="text-[#c5cad2]">|</span>
            <Link to="/terms" className="transition hover:text-[#202023]">Contact</Link>
          </nav>
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
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthPortalShell activeTab="signin">
      <div className="mb-7 text-center">
        <p className="font-serif text-[18px] font-bold leading-none text-[#d1ad4a]">
          Medellin Rewards
        </p>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8f8f8f]">
          {t('Member Portal').toUpperCase()}
        </p>
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
          className="space-y-5"
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
              `${t('Sign in to my account')} ↗`
            )}
          </Button>

          <p className="text-center text-[11px] font-medium text-[#8aa0bc]">
            {t("Don't have an account?")}{' '}
            <Link to="/join" className="font-bold text-[#d1ad4a] transition hover:text-[#f0ca62]">
              {t('Join Medellin Rewards')}
            </Link>
          </p>
        </form>
      )}
    </AuthPortalShell>
  )
}
