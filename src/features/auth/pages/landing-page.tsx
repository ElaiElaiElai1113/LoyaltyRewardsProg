import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CalendarClock, Gift, Repeat2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { authSchema, type AuthFormValues } from '@/types/forms'

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
  const [error, setError] = useState<string | null>(null)
  const [showStaffLogin, setShowStaffLogin] = useState(false)
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

  const toggleStaffLogin = () => {
    setShowStaffLogin((current) => {
      const next = !current
      if (next) {
        const currentRole = signInForm.getValues('role')
        if (currentRole === 'customer') {
          signInForm.setValue('role', 'business-owner', { shouldDirty: true })
        }
      } else {
        signInForm.setValue('role', 'customer', { shouldDirty: true })
      }
      return next
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface px-4 py-4 md:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative flex h-full max-h-[calc(100vh-2rem)] min-h-[42rem] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-primary-container/20 bg-[#120d0b] px-8 py-10 text-on-surface shadow-card md:px-12 lg:px-14">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(244,168,79,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(244,168,79,0.045)_1px,transparent_1px)] bg-[length:40px_40px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(244,168,79,0.22),transparent_28rem),radial-gradient(circle_at_86%_18%,rgba(123,216,207,0.12),transparent_24rem),linear-gradient(145deg,rgba(244,168,79,0.08),transparent_45%)]" />
          <div className="hud-scanline" />

          <div className="relative z-10 space-y-8">
            <Badge variant="accent" className="border-primary-container/35 bg-primary-container/12 px-5 py-2 text-primary-container">
              {t('Multi-business rewards platform')}
            </Badge>
            <div className="max-w-3xl space-y-6">
              <h1 className="font-serif text-5xl font-black uppercase leading-[0.94] tracking-[0.01em] text-primary md:text-6xl xl:text-[5.25rem]">
                {t('Medellin Rewards.')}<br />
                {t('Earn across')}<br />
                {t('the network')}.
              </h1>
              <p className="max-w-xl text-base font-medium leading-relaxed text-on-surface-variant md:text-lg">
                {t('Earn and redeem rewards across local businesses while owners track loyalty, QR signups, and partner referrals from one platform.')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="inline-flex h-11 items-center rounded border border-primary-container bg-primary-container px-6 text-xs font-bold uppercase tracking-[0.08em] text-on-primary shadow-[0_0_20px_rgba(244,168,79,0.18)] transition hover:bg-primary-fixed"
                >
                  {t('Explore Businesses')}
                </Link>
                <Link
                  to="/for-businesses#book-demo"
                  className="inline-flex h-11 items-center gap-2 rounded border border-secondary-container bg-secondary-container px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#2d1a06] shadow-[0_0_20px_rgba(216,162,58,0.18)] transition hover:bg-secondary-fixed"
                >
                  <Building2 className="size-4" />
                  {t('Book Demo')}
                </Link>
                <Link
                  to="/rewards"
                  className="inline-flex h-11 items-center rounded border border-primary-container/35 bg-primary-container/8 px-6 text-xs font-bold uppercase tracking-[0.08em] text-primary-container transition hover:bg-primary-container/14"
                >
                  {t('View Rewards')}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Repeat2,
                  title: t('Earn Points'),
                  body: t('Collect points automatically when you buy from partner businesses.'),
                },
                {
                  icon: Gift,
                  title: t('Redeem Rewards'),
                  body: t('Use your points for perks, reward credits, and partner offers.'),
                },
                {
                  icon: CalendarClock,
                  title: t('Book Demo'),
                  body: t('Businesses can launch QR signups, partner referrals, and reward credit workflows without a custom build.'),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-lg border border-primary-container/15 bg-[#1a120e]/72 p-4 backdrop-blur transition-all hover:border-primary-container/35 hover:bg-[#211713]/80"
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded border border-secondary-container/35 bg-secondary-container/10 text-secondary-container transition-all group-hover:bg-secondary-container/15">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold uppercase tracking-[0.03em] text-primary">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{item.body}</p>
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-7">
            <div className="flex justify-center">
              <TabsList className="w-full max-w-md">
                <TabsTrigger value="signin">{t('Sign In')}</TabsTrigger>
                <TabsTrigger value="signup">{t('Register')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signin" className="outline-none">
              <div className="space-y-7">
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">
                    {t('Welcome Back')}
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    {t('Sign in to check your balance and redeem rewards.')}
                  </p>
                </div>

                <div className="mx-auto min-h-[25.5rem] max-w-md rounded-[1.5rem] border border-outline-variant/20 bg-surface-low p-8">
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
                        <h3 className="font-serif text-3xl tracking-tight text-primary">
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
                        className="h-12 w-full font-bold tracking-wide"
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
                            await signIn({
                              ...values,
                              role: showStaffLogin ? values.role : 'customer',
                            })
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

                      {showStaffLogin ? (
                        <div className="grid gap-3">
                          <Label htmlFor="signin-role">{t('Staff Role')}</Label>
                          <Controller
                            control={signInForm.control}
                            name="role"
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="signin-role" className="rounded-xl h-12">
                                  <SelectValue placeholder={t('Select a staff role')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="business-owner">{t('Business Owner')}</SelectItem>
                                  <SelectItem value="business-staff">Business Staff</SelectItem>
                                  <SelectItem value="platform-admin">{t('Platform Admin')}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      ) : null}

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full font-bold tracking-wide"
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

                      <button
                        type="button"
                        className="block w-full text-center text-sm font-medium text-on-surface-variant/60 transition hover:text-primary"
                        onClick={toggleStaffLogin}
                      >
                        {showStaffLogin ? t('Customer login <-') : t('Staff login ->')}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="outline-none">
              <div className="space-y-7">
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">
                    {t('Create Account')}
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    {t('Join the rewards program and start earning.')}
                  </p>
                </div>

                <div className="mx-auto flex min-h-[25.5rem] max-w-md flex-col justify-center rounded-[1.5rem] border border-outline-variant/20 bg-surface-low p-8">
                  {signUpComplete ? (
                    <div className="space-y-6 text-center">
                      <div className="space-y-3">
                        <h3 className="font-serif text-3xl tracking-tight text-primary">{t('Welcome aboard!')}</h3>
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
                          {t('Create your free rewards account and start earning points today.')}
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
                        className="h-12 w-full font-bold tracking-wide"
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
