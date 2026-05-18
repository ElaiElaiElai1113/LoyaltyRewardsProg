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
import { validateVerificationDocument } from '@/lib/member-verification'
import { memberSignUpSchema, type MemberSignUpFormValues } from '@/types/forms'

const defaultValues: MemberSignUpFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
  verificationIdNumber: '',
}

const joinInputClass =
  'h-12 rounded-2xl border-neutral-300 bg-white px-4 text-sm text-black shadow-none placeholder:text-neutral-500 focus-visible:border-black focus-visible:ring-black/10'
const joinFileInputClass =
  `${joinInputClass} cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white file:transition hover:file:bg-neutral-700`
const joinLabelClass = 'text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-neutral-600'

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
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)

  const form = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues,
  })

  if (profile && !signUpComplete) {
    return <Navigate replace to={homePathForRole(profile.role)} />
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-4 py-6 text-black sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1fr)] lg:items-center">
        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-600">
                {t('Medellin Rewards')}
              </p>
              <Link to="/signin" className="rounded-full px-4 py-2 text-sm font-bold text-black transition hover:bg-white">
                {t('Sign in')}
              </Link>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-none sm:text-5xl">
                {t('Create your member account')}
              </h1>
              <p className="max-w-xl text-lg font-semibold leading-7 text-neutral-700">
                {t('Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.')}
              </p>
            </div>

            <div className="grid gap-3 text-sm font-bold text-neutral-700">
              <p>{t('Earn between 20% - 100% by simply spending at amazing businesses within our platform')}</p>
              <p>{t('After signup, your account may need admin approval before reward actions unlock.')}</p>
            </div>
          </div>
        </section>

        <section id="join-form" className="w-full">
          <div className="w-full rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            {signUpComplete ? (
              <div className="space-y-7 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-neutral-100 text-black">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-black leading-tight text-black">{t('Welcome to the Rewards Club.')}</h2>
                  <p className="mx-auto max-w-md text-sm font-semibold leading-6 text-neutral-700">
                    {t('Your account request is saved. Check your email if confirmation is required, then sign in. Reward actions may stay locked until admin approval.')}
                  </p>
                  {signUpWarning ? (
                    <p className="mx-auto max-w-md text-sm font-bold leading-6 text-warning">
                      {signUpWarning}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="rounded-full bg-black text-white hover:bg-neutral-700">
                    <Link to="/signin">{t('Go to sign in')}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-neutral-300 bg-white text-black hover:bg-neutral-100">
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
                    const documentFile = verificationDocument
                    const documentError = validateVerificationDocument(documentFile)
                    if (documentError || !documentFile) {
                      setError(t(documentError ?? 'Upload a photo or PDF of your ID for account verification.'))
                      return
                    }

                    const result = await signUp({ ...values, role: 'customer', verificationDocument: documentFile })
                    setSignUpWarning(result.warning ?? null)
                    form.reset(defaultValues)
                    setVerificationDocument(null)
                    setSignUpComplete(true)
                  } catch (submissionError) {
                    if (
                      submissionError instanceof Error &&
                      submissionError.message.includes('profile could not be loaded')
                    ) {
                      form.reset(defaultValues)
                      setVerificationDocument(null)
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
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-neutral-600">{t('Member signup')}</p>
                  <h2 className="text-3xl font-black leading-tight text-black">{t('Create your member account')}</h2>
                  <p className="text-sm font-semibold leading-6 text-neutral-700">
                    {t('Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.')}
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

                <div className="grid gap-3">
                  <Label htmlFor="join-verification-id" className={joinLabelClass}>{t('Verification ID number')}</Label>
                  <Input
                    id="join-verification-id"
                    className={joinInputClass}
                    placeholder={t('ID number')}
                    {...form.register('verificationIdNumber')}
                  />
                  {form.formState.errors.verificationIdNumber ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.verificationIdNumber.message ?? '')}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-verification-document" className={joinLabelClass}>{t('Photo or PDF of ID')}</Label>
                  <Input
                    id="join-verification-document"
                    className={joinFileInputClass}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => setVerificationDocument(event.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs font-medium leading-5 text-neutral-600">
                    {t('Used only to verify one member account per person before rewards can be earned or redeemed.')}
                  </p>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm font-bold text-error">
                    {t(error)}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full bg-black text-white hover:bg-neutral-700"
                  isLoading={form.formState.isSubmitting}
                >
                  <Gift className="size-4" />
                  {t('Join and earn points')}
                </Button>

                <p className="text-center text-xs font-medium text-neutral-600">
                  {t('Already a member?')} <Link to="/signin" className="font-bold text-black hover:underline">{t('Sign in')}</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
