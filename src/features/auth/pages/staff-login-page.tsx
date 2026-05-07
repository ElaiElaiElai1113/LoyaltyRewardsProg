import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { authSchema, type AuthFormValues } from '@/types/forms'

type StaffPortal = 'admin' | 'business'
const portalAccessErrorKey = 'portalAccessError'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'business-owner',
}

function LoadingSpinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z" />
    </svg>
  )
}

export function StaffLoginPage({ portal }: { portal: StaffPortal }) {
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
    defaultValues: {
      ...defaultValues,
      role: portal === 'admin' ? 'platform-admin' : 'business-owner',
    },
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  const isAdminPortal = portal === 'admin'
  const portalHome = isAdminPortal ? '/admin/portal' : '/business/dashboard'
  const portalIcon = isAdminPortal ? ShieldCheck : Building2
  const PortalIcon = portalIcon

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface px-4 py-4 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--rose-brown)_18%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--espresso)_28%,transparent),transparent_32%)]" />
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[74rem] flex-col justify-center gap-5">
        <div className="absolute right-4 top-4 flex items-center gap-2 md:right-8 lg:right-10">
          <ThemeToggle className="rounded-full border border-[var(--champagne)]/24 bg-[var(--espresso)]/35 text-[var(--champagne)] hover:bg-[var(--espresso)]/55 hover:text-[var(--cream)]" />
          <LanguagePicker className="text-on-surface-variant" />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="font-serif text-4xl tracking-tight text-[var(--champagne)] md:text-5xl">
            {isAdminPortal ? 'Staff Access' : 'Business Access'}
          </h2>
          <p className="text-sm font-medium text-[var(--champagne)]/80">
            {isAdminPortal ? 'Sign in to manage platform operations.' : 'Sign in to manage your business workspace.'}
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(27rem,0.72fr)]">
        <section className="relative flex min-h-[31rem] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-6 text-[var(--cream)] shadow-panel md:px-8 lg:px-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />
          <div className="relative z-10 space-y-7">
            <div className="flex size-14 items-center justify-center rounded-full border border-[var(--champagne)]/28 bg-[var(--champagne)]/16 text-[var(--champagne)] shadow-soft">
              <PortalIcon className="size-7" />
            </div>
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
                {isAdminPortal ? 'Private admin access' : 'Private business access'}
              </p>
              <h1 className="font-serif text-[clamp(2.35rem,4.4vw,4rem)] font-semibold leading-[0.92] tracking-[0.01em] text-[var(--cream)]">
                {isAdminPortal ? (
                  <>
                    Platform operations <span className="text-[var(--champagne)]">sign in.</span>
                  </>
                ) : (
                  <>
                    Business portal <span className="text-[var(--champagne)]">sign in.</span>
                  </>
                )}
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/88">
                {isAdminPortal
                  ? 'Use this private entry for Medellin Rewards platform administration. Customer accounts do not sign in here.'
                  : 'Use this private entry for business owners and staff. Access is based on the role already assigned to the account by an admin.'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-4 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                  Portal
                </p>
                <p className="mt-3 font-serif text-3xl text-[var(--cream)]">
                  {isAdminPortal ? 'Admin' : 'Business'}
                </p>
              </div>
              <div className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-4 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                  Public member sign in
                </p>
                <Link className="mt-3 inline-flex text-sm font-semibold text-[var(--cream)] hover:text-[var(--champagne)]" to="/signin">
                  {t('Go to sign in')}
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
                    <Label htmlFor="staff-reset-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                    <Input id="staff-reset-email" className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 text-[var(--cream)]" placeholder="your@email.com" {...resetForm.register('email')} />
                  </div>

                  {error ? <p className="text-center text-sm font-bold text-red-500">{error}</p> : null}

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
                        await signIn({
                          ...values,
                          role: isAdminPortal ? 'platform-admin' : values.role,
                        })
                        const redirect = searchParams.get('redirect')
                        navigate(redirect || portalHome)
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
                    <p className="text-center text-sm font-bold text-success">{resetSuccessMessage}</p>
                  ) : null}

                  <div className="grid gap-3">
                    <Label htmlFor="staff-signin-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                    <Input id="staff-signin-email" className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 text-[var(--cream)]" placeholder="your@email.com" {...signInForm.register('email')} />
                    {signInForm.formState.errors.email ? (
                      <p className="text-xs font-bold text-red-500">{signInForm.formState.errors.email.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="staff-signin-password" className="text-[var(--champagne)]">{t('Password')}</Label>
                    <Input
                      id="staff-signin-password"
                      className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 text-[var(--cream)]"
                      type="password"
                      placeholder="••••••••"
                      {...signInForm.register('password')}
                    />
                    {signInForm.formState.errors.password ? (
                      <p className="text-xs font-bold text-red-500">{signInForm.formState.errors.password.message}</p>
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

                  {error ? <p className="text-center text-sm font-bold text-red-500">{error}</p> : null}

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
        </section>
        </div>
      </div>
    </div>
  )
}
