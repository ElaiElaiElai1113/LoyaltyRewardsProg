import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,193,111,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(143,104,34,0.12),transparent_32%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="gold-wash relative flex min-h-[42rem] flex-col justify-between overflow-hidden rounded-[2rem] px-8 py-10 text-on-surface shadow-panel md:px-12 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(183,138,43,0.12),transparent_26%)]" />
          <div className="relative z-10 space-y-8">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--tenant-accent-soft)] text-primary-container shadow-soft">
              <PortalIcon className="size-7" />
            </div>
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                {isAdminPortal ? 'Private admin access' : 'Private business access'}
              </p>
              <h1 className="font-serif text-5xl font-semibold leading-[0.9] tracking-[0.01em] text-primary-container md:text-6xl">
                {isAdminPortal ? 'Platform operations sign in.' : 'Business portal sign in.'}
              </h1>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-on-surface-variant md:text-lg">
                {isAdminPortal
                  ? 'Use this private entry for Medellin Rewards platform administration. Customer accounts do not sign in here.'
                  : 'Use this private entry for business owners and staff. Access is based on the role already assigned to the account by an admin.'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-primary-container/12 bg-[rgb(255_250_243_/_0.74)] p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-container">
                  Portal
                </p>
                <p className="mt-3 font-serif text-3xl text-primary">
                  {isAdminPortal ? 'Admin' : 'Business'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-primary-container/12 bg-[rgb(255_250_243_/_0.74)] p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-container">
                  Public member sign in
                </p>
                <Link className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline" to="/signin">
                  {t('Go to sign in')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[42rem] flex-col justify-center py-4">
          <div className="mb-6 flex justify-end">
            <LanguagePicker className="text-on-surface-variant" />
          </div>

          <div className="space-y-7">
            <div className="space-y-2 text-center">
              <h2 className="font-serif text-5xl tracking-tight text-primary-container">
                {isAdminPortal ? 'Staff Access' : 'Business Access'}
              </h2>
              <p className="text-sm font-medium text-on-surface-variant/80">
                {isAdminPortal ? 'Sign in to manage platform operations.' : 'Sign in to manage your business workspace.'}
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
                    <Label htmlFor="staff-reset-email">{t('Email Address')}</Label>
                    <Input id="staff-reset-email" placeholder="your@email.com" {...resetForm.register('email')} />
                  </div>

                  {error ? <p className="text-center text-sm font-bold text-red-500">{error}</p> : null}

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
                    <Label htmlFor="staff-signin-email">{t('Email Address')}</Label>
                    <Input id="staff-signin-email" placeholder="your@email.com" {...signInForm.register('email')} />
                    {signInForm.formState.errors.email ? (
                      <p className="text-xs font-bold text-red-500">{signInForm.formState.errors.email.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="staff-signin-password">{t('Password')}</Label>
                    <Input
                      id="staff-signin-password"
                      type="password"
                      placeholder="••••••••"
                      {...signInForm.register('password')}
                    />
                    {signInForm.formState.errors.password ? (
                      <p className="text-xs font-bold text-red-500">{signInForm.formState.errors.password.message}</p>
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

                  {error ? <p className="text-center text-sm font-bold text-red-500">{error}</p> : null}

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
        </section>
      </div>
    </div>
  )
}
