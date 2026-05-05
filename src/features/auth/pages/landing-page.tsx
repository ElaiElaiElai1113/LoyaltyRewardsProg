import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CalendarClock, Gift, Repeat2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const signUpForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,193,111,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(143,104,34,0.12),transparent_32%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="warm-hero relative flex h-full min-h-[42rem] flex-col justify-between overflow-hidden rounded-[2rem] px-8 pb-14 pt-10 shadow-panel md:px-12 md:pb-16 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,239,197,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,204,102,0.1),transparent_28%)]" />
          <div className="hidden" />

          <div className="relative z-10 space-y-8">
            <Badge variant="accent" className="w-fit border-white/20 bg-white/10 px-5 py-2 text-white">
              {t('Golden rewards circle')}
            </Badge>
            <div className="max-w-3xl space-y-6">
              <h1 className="font-serif text-5xl font-semibold leading-[0.88] tracking-[0.01em] text-[#ffe8b4] md:text-6xl xl:text-[5.3rem]">
                {t('A rewards ritual')}<br />
                {t('worth coming')}<br />
                {t('back for')}.
              </h1>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-[#f8dfb2] md:text-lg">
                {t('Discover local favorites, collect beautiful little wins, and redeem perks across the Medellin Rewards circle with a member experience that feels warm, premium, and personal.')}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/shop"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f3c96f] px-7 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#21160c] shadow-soft transition hover:-translate-y-0.5 hover:bg-[#ffd987]"
                >
                  {t('Explore the circle')}
                </Link>
                <Link
                  to="/for-businesses#book-demo"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-white/18"
                >
                  <Building2 className="size-4" />
                  {t('For businesses')}
                </Link>
                <Link
                  to="/rewards"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f3c96f]/30 bg-[#4d3216] px-7 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#ffe8b4] transition hover:-translate-y-0.5 hover:bg-[#5f3d19]"
                >
                  {t('View rewards')}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 pb-2 sm:grid-cols-3 lg:gap-5">
              {[
                {
                  icon: Repeat2,
                  title: t('Collect Golden Moments'),
                  body: t('Earn points naturally each time you order from the partner circle.'),
                },
                {
                  icon: Gift,
                  title: t('Trade Them for Delights'),
                  body: t('Turn points into indulgent perks, credit, and limited offers.'),
                },
                {
                  icon: CalendarClock,
                  title: t('Grow with Grace'),
                  body: t('Businesses can launch QR signups, referrals, and credit flows without losing warmth.'),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-[1.5rem] border border-white/16 bg-[#3a2717]/88 p-5 text-white shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#f3c96f]/35 hover:bg-[#422c19]/94 md:p-6"
                >
                  <div className="mb-5 flex size-11 items-center justify-center rounded-full border border-[#f3c96f]/35 bg-[#f3c96f]/12 text-[#f3c96f] transition-all group-hover:bg-[#f3c96f]/18">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl leading-none tracking-[0.02em] text-[#ffe8b4]">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#e9c996]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="relative z-10 mt-8 text-sm font-bold text-red-300">{error}</p> : null}
        </section>

        <section className="flex min-h-[42rem] flex-col justify-center py-4">
          <div className="mb-6 flex justify-end">
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
                  <h2 className="font-serif text-4xl tracking-tight text-primary-container md:text-5xl">
                    {t('Welcome Back')}
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    {t('Step back into your rewards ritual.')}
                  </p>
                </div>

                <div className="gold-frame mx-auto min-h-[25.5rem] max-w-md rounded-[1.75rem] p-8">
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
                            signUpForm.reset(defaultValues)
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
                        <h3 className="font-serif text-4xl tracking-tight text-primary">
                          {t('Reset Password')}
                        </h3>
                        <p className="text-sm font-medium text-on-surface-variant/80">
                          {t("Enter your email and we'll send you a reset link.")}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="reset-email">{t('Email Address')}</Label>
                        <Input id="reset-email" placeholder="your@email.com" {...resetForm.register('email')} />
                      </div>

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full font-bold tracking-[0.12em] uppercase"
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
                        className="block w-full text-center text-sm font-medium text-on-surface-variant/75 transition hover:text-primary"
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
                        <Label htmlFor="signin-email">{t('Email Address')}</Label>
                        <Input id="signin-email" placeholder="your@email.com" {...signInForm.register('email')} />
                        {signInForm.formState.errors.email ? (
                          <p className="text-xs font-bold text-red-500">
                            {signInForm.formState.errors.email.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signin-password">{t('Password')}</Label>
                        <Input id="signin-password" type="password" placeholder="••••••••" {...signInForm.register('password')} />
                        {signInForm.formState.errors.password ? (
                          <p className="text-xs font-bold text-red-500">
                            {signInForm.formState.errors.password.message}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="text-left text-sm font-medium text-on-surface-variant/75 transition hover:text-primary"
                          onClick={() => {
                            setError(null)
                            resetForm.setValue('email', signInForm.getValues('email'))
                            setShowForgotPassword(true)
                          }}
                        >
                          {t('Forgot password?')}
                        </button>
                      </div>

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full font-bold tracking-[0.12em] uppercase"
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
            </TabsContent>

            <TabsContent value="signup" className="outline-none">
              <div className="space-y-5">
                <div className="space-y-1.5 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary-container md:text-5xl">
                    {t('Create Account')}
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    {t('Join the circle and start collecting delights.')}
                  </p>
                </div>

                <div className="gold-frame mx-auto flex min-h-[25.5rem] max-w-md flex-col justify-center rounded-[1.75rem] p-8">
                  {signUpComplete ? (
                    <div className="space-y-6 text-center">
                      <div className="space-y-3">
                        <h3 className="font-serif text-4xl tracking-tight text-primary">{t('Welcome aboard!')}</h3>
                        <p className="text-sm font-medium leading-relaxed text-on-surface-variant/80">
                          {t('Check your email to verify your account, then sign in to start earning rewards.')}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="text-sm font-bold text-primary transition hover:text-primary/80"
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
                          await signUp(values)
                          setSignUpComplete(true)
                          signUpForm.reset(defaultValues)
                        } catch (submissionError) {
                          setError(
                            submissionError instanceof Error
                              ? submissionError.message
                              : t('Unable to create the account.'),
                          )
                        }
                      })}
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-on-surface-variant/80">
                          {t('Create your free account to earn points, unlock perks, and move through the circle with ease.')}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-name">{t('Full Name')}</Label>
                        <Input id="signup-name" placeholder={t('Your name')} {...signUpForm.register('fullName')} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-email">{t('Email Address')}</Label>
                        <Input id="signup-email" placeholder="your@email.com" {...signUpForm.register('email')} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-password">{t('Password')}</Label>
                        <Input id="signup-password" type="password" placeholder="••••••••" {...signUpForm.register('password')} />
                      </div>

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full font-bold tracking-[0.12em] uppercase"
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
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
