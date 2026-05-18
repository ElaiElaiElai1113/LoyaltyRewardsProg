import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, Coins } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { validateVerificationDocument } from '@/lib/member-verification'
import { authSchema, memberSignUpSchema, type AuthFormValues, type MemberSignUpFormValues } from '@/types/forms'
import {
  landingAgreementLabel,
  landingBody,
  landingBusinessNote,
  landingFaqItems,
  landingJoinButtonLabel,
  landingLogo,
  landingOfferLines,
  landingTagline,
  landingTags,
} from '../landing-content'

const portalAccessErrorKey = 'portalAccessError'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

const signUpDefaultValues: MemberSignUpFormValues = {
  fullName: '',
  email: '',
  password: '',
  verificationIdNumber: '',
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-16 text-black">
      <header className="sticky top-0 z-50 px-3 py-3 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-sm sm:px-5">
          <Link to="/" className="min-w-0 truncate text-xl font-black sm:text-2xl">
            {landingLogo}
          </Link>
          <nav className="hidden items-center gap-1 rounded-full bg-neutral-100 px-2 py-1.5 lg:flex">
            <a href="#rewards" className="rounded-full px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-white hover:text-black">
              {t('Rewards')}
            </a>
            <a href="#offer" className="rounded-full px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-white hover:text-black">
              {t('Offer')}
            </a>
            <a href="#faq" className="rounded-full px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-white hover:text-black">
              {t('FAQ')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguagePicker compact className="hidden text-black sm:flex" />
            <Link to="/signin" className="hidden rounded-full px-4 py-2 text-sm font-bold text-black transition hover:bg-neutral-100 sm:inline-flex">
              {t('Sign In')}
            </Link>
            <Link
              to="/join"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-black px-5 text-sm font-bold text-white transition hover:bg-neutral-700"
            >
              {t(landingJoinButtonLabel)}
            </Link>
          </div>
        </div>
        </header>

      <section className="px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div className="max-w-4xl space-y-7">
            <Badge className="w-fit max-w-full justify-center whitespace-normal border-neutral-300 bg-white px-4 py-2 text-center text-xs font-extrabold uppercase leading-5 text-black shadow-sm">
              {t(landingLogo)}
            </Badge>
            <div className="space-y-5">
              <h1 className="text-wrap text-5xl font-black leading-none sm:text-6xl lg:text-7xl">
                {t(landingTagline)}
              </h1>
              <p className="max-w-3xl text-2xl font-semibold leading-snug sm:text-3xl">
                {t(landingBody)}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/join"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-black px-8 text-base font-extrabold text-white shadow-sm transition hover:bg-neutral-700"
              >
                {t(landingJoinButtonLabel)}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link
                to="/reward-terms"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-black bg-white px-8 text-base font-extrabold text-black transition hover:bg-neutral-100"
              >
                {t(landingAgreementLabel)}
              </Link>
            </div>
          </div>

          <aside id="offer" className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-4">
              {landingOfferLines.map((line) => (
                <div key={line} className="flex items-start gap-3 border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <p className="text-3xl font-black leading-none sm:text-4xl">{t(line)}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="rewards" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {landingTags.map((tag) => (
            <article key={tag} className="flex min-h-56 items-end rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-8">
              <p className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">{t(tag)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-[0.4fr_1fr] md:p-8">
          <h2 className="text-5xl font-black leading-none sm:text-6xl">{t('FAQ')}</h2>
          <div className="grid gap-3">
            {landingFaqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-xl font-black leading-snug sm:text-2xl">{t(item.question)}</span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-2xl font-black leading-none text-white transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-neutral-700 sm:text-lg">
                  {t(item.answer)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-8">
          <p className="max-w-3xl text-lg font-bold leading-7 sm:text-xl">{t(landingBusinessNote)}</p>
        </div>
      </section>

    </main>
  )
}
export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
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
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [signUpWarning, setSignUpWarning] = useState<string | null>(null)
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const signUpForm = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues: signUpDefaultValues,
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  const handleTabChange = (value: string) => {
    const nextTab = value === 'signup' ? 'signup' : 'signin'
    setActiveTab(nextTab)
    setError(null)
    setResetSuccessMessage(null)
    setShowForgotPassword(false)

    if (nextTab === 'signin') {
      setSignUpComplete(false)
    }
  }

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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-5">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="signin" className="min-w-0 px-4">{t('Sign In')}</TabsTrigger>
                <TabsTrigger value="signup" className="min-w-0 px-4">{t('Register')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signin" className="outline-none">
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
                          if (
                            submissionError instanceof Error &&
                            submissionError.message.includes('profile could not be loaded')
                          ) {
                            setSignUpComplete(true)
                            signUpForm.reset(signUpDefaultValues)
                            return
                          }

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

                    </form>
                  )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="outline-none">
              <div className="space-y-5">
                <div className="space-y-1.5 text-center">
                  <h2 className={authPanelTitleClass}>
                    {t('Create Account')}
                  </h2>
                  <p className={authPanelCopyClass}>
                    {t('Join the circle and start collecting delights.')}
                  </p>
                </div>

                <div className="relative mx-auto flex min-h-[25.5rem] max-w-md flex-col justify-center overflow-hidden rounded-[1.25rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
                  <div className="absolute right-0 top-0 size-24 rounded-bl-[3rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
                  <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />
                  <div className="relative z-10">
                  {signUpComplete ? (
                    <div className="space-y-6 text-center">
                      <div className="space-y-3">
                        <h3 className="font-serif text-4xl tracking-tight text-[var(--champagne)]">{t('Welcome aboard!')}</h3>
                        <p className="text-sm font-medium leading-relaxed text-[var(--cream)]/76">
                          {t('Your account request is saved. Check your email if confirmation is required, then sign in. Reward actions may stay locked until admin approval.')}
                        </p>
                        {signUpWarning ? (
                          <p className="text-sm font-bold leading-relaxed text-[var(--champagne)]">
                            {signUpWarning}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="text-sm font-bold text-[var(--champagne)] transition hover:text-[var(--cream)]"
                        onClick={() => {
                          setSignUpComplete(false)
                          setActiveTab('signin')
                          setError(null)
                        }}
                      >
                        {t('Go to sign in ->')}
                      </button>
                    </div>
                  ) : (
                    <form
                      className="space-y-6"
                      onSubmit={signUpForm.handleSubmit(async (values) => {
                        try {
                          setError(null)
                          const documentFile = verificationDocument
                          const documentError = validateVerificationDocument(documentFile)
                          if (documentError || !documentFile) {
                            setError(documentError ?? 'Upload a photo or PDF of your ID for account verification.')
                            return
                          }

                          const result = await signUp({ ...values, verificationDocument: documentFile })
                          setSignUpWarning(result.warning ?? null)
                          setSignUpComplete(true)
                          signUpForm.reset(signUpDefaultValues)
                          setVerificationDocument(null)
                        } catch (submissionError) {
                          if (
                            submissionError instanceof Error &&
                            submissionError.message.includes('profile could not be loaded')
                          ) {
                            setSignUpComplete(true)
                            signUpForm.reset(signUpDefaultValues)
                            setVerificationDocument(null)
                            return
                          }

                          setError(
                            submissionError instanceof Error
                              ? submissionError.message
                              : t('Unable to create the account.'),
                          )
                        }
                      })}
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[var(--cream)]/76">
                          {t('Create your account, verify once, and activate your membership to earn points, unlock perks, and move through the circle with ease.')}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-name" className="text-[var(--champagne)]">{t('Full Name')}</Label>
                        <Input id="signup-name" className={authInputClass} placeholder={t('Your name')} {...signUpForm.register('fullName')} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                        <Input id="signup-email" className={authInputClass} placeholder="your@email.com" {...signUpForm.register('email')} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-password" className="text-[var(--champagne)]">{t('Password')}</Label>
                        <Input id="signup-password" className={authInputClass} type="password" placeholder="Password" {...signUpForm.register('password')} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-verification-id" className="text-[var(--champagne)]">{t('Verification ID number')}</Label>
                        <Input
                          id="signup-verification-id"
                          className={authInputClass}
                          placeholder={t('ID number')}
                          {...signUpForm.register('verificationIdNumber')}
                        />
                        {signUpForm.formState.errors.verificationIdNumber ? (
                          <p className="text-xs font-bold text-red-500">
                            {t(signUpForm.formState.errors.verificationIdNumber.message ?? '')}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-verification-document" className="text-[var(--champagne)]">{t('Photo or PDF of ID')}</Label>
                        <Input
                          id="signup-verification-document"
                          className={authInputClass}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(event) => setVerificationDocument(event.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs font-medium leading-5 text-[var(--cream)]/66">
                          {t('Used by admins to verify one member account per person.')}
                        </p>
                      </div>

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{t(error)}</p> : null}

                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]"
                        disabled={signUpForm.formState.isSubmitting}
                      >
                        {signUpForm.formState.isSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <LoadingSpinner />
                            {t('Creating account...')}
                          </span>
                        ) : (
                          t('Create Account')
                        )}
                      </Button>
                    </form>
                  )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
