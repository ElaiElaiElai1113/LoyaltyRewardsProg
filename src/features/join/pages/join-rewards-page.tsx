import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Gift } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { memberSignUpSchema, type MemberSignUpFormValues } from '@/types/forms'

const defaultValues: MemberSignUpFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

const joinInputClass =
  'h-12 rounded-2xl border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] shadow-none placeholder:text-[var(--muted-foreground)] focus-visible:border-primary focus-visible:ring-primary/15'
const joinLabelClass = 'text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[var(--muted-foreground)]'

function homePathForRole(role: string) {
  if (role === 'platform-admin') return '/admin/portal'
  if (role === 'business-owner' || role === 'business-staff') return '/business/dashboard'
  return '/dashboard'
}

export function JoinRewardsPage() {
  const { profile, signUp } = useAuth()
  const { t } = useLanguage()
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [signUpWarning, setSignUpWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues,
  })

  if (profile && !signUpComplete) {
    return <Navigate replace to={homePathForRole(profile.role)} />
  }

  return (
    <main className="soft-luxe-shell min-h-screen overflow-x-hidden px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1fr)] lg:items-center">
        <section className="gold-frame rounded-3xl p-6 shadow-soft sm:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                {t('Medellin Rewards')}
              </p>
              <Link to="/" className="rounded-full px-4 py-2 text-sm font-bold text-primary transition hover:bg-[var(--muted)]">
                {t('Back to landing page')}
              </Link>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-none sm:text-5xl">
                {t('Create your member account')}
              </h1>
              <p className="max-w-xl text-lg font-semibold leading-7 text-[var(--muted-foreground)]">
                {t('Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.')}
              </p>
            </div>

            <div className="grid gap-3 text-sm font-bold text-[var(--muted-foreground)]">
              <p>{t('Earn between 20% - 100% by simply spending at amazing businesses within our platform')}</p>
              <p>{t('After signup, your account may need admin approval before reward actions unlock.')}</p>
            </div>
          </div>
        </section>

        <section id="join-form" className="w-full">
          <div className="luxe-card w-full rounded-3xl p-5 shadow-soft sm:p-7">
            {signUpComplete ? (
              <div className="space-y-7 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-black leading-tight text-[var(--foreground)]">{t('Welcome to the Rewards Club.')}</h2>
                  <p className="mx-auto max-w-md text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                    {t('Your account is created. Sign in, then verify your ID from your profile to unlock earning, redemption, memberships, gift cards, and QR rewards.')}
                  </p>
                  {signUpWarning ? (
                    <p className="mx-auto max-w-md text-sm font-bold leading-6 text-warning">
                      {signUpWarning}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary-container">
                    <Link to="/signin">{t('Go to sign in')}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-primary/30 bg-[var(--card)] text-primary hover:bg-[var(--muted)]">
                    <Link to="/rewards">{t('View rewards')}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setError(null)
                    const result = await signUp({ ...values, role: 'customer' })
                    setSignUpWarning(result.warning ?? null)
                    form.reset(defaultValues)
                    setSignUpComplete(true)
                  } catch (submissionError) {
                    if (
                      submissionError instanceof Error &&
                      submissionError.message.includes('profile could not be loaded')
                    ) {
                      form.reset(defaultValues)
                      setSignUpComplete(true)
                      return
                    }

                    setError(
                      submissionError instanceof Error
                        ? t(submissionError.message)
                        : t('Unable to create the account.'),
                    )
                  }
                })}
              >
                <div className="space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{t('Member signup')}</p>
                  <h2 className="text-3xl font-black leading-tight text-[var(--foreground)]">{t('Create your member account')}</h2>
                  <p className="text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                    {t('Account created. Verification unlocks rewards.')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-name" className={joinLabelClass}>{t('Full name')}</Label>
                  <Input id="join-name" className={joinInputClass} placeholder={t('Your name')} {...form.register('fullName')} />
                  {form.formState.errors.fullName ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.fullName.message ?? '')}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-email" className={joinLabelClass}>{t('Email address')}</Label>
                  <Input id="join-email" className={joinInputClass} type="email" placeholder="your@email.com" {...form.register('email')} />
                  {form.formState.errors.email ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.email.message ?? '')}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-password" className={joinLabelClass}>{t('Password')}</Label>
                  <Input id="join-password" className={joinInputClass} type="password" placeholder={t('Password')} {...form.register('password')} />
                  {form.formState.errors.password ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.password.message ?? '')}</p>
                  ) : null}
                </div>

                {error ? (
                  <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm font-bold text-error">
                    {t(error)}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary-container"
                  isLoading={form.formState.isSubmitting}
                >
                  <Gift className="size-4" />
                  {t('Join and earn points')}
                </Button>

                <p className="text-center text-xs font-medium text-[var(--muted-foreground)]">
                  {t('Already a member?')} <Link to="/signin" className="font-bold text-primary hover:underline">{t('Sign in')}</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
