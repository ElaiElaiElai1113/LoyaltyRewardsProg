import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Gift, HeartHandshake, Sparkles, TicketPercent, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import heroImage from '@/assets/hero.png'
import { Badge } from '@/components/ui/badge'
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

const benefits = [
  {
    icon: WalletCards,
    title: 'Earn rewards',
    body: 'Collect points and credits when you shop with participating local businesses.',
  },
  {
    icon: TicketPercent,
    title: 'Unlock perks',
    body: 'Find member offers, rewards, gift cards, and promotions in one place.',
  },
  {
    icon: HeartHandshake,
    title: 'Share invites',
    body: 'Invite friends and track rewards as the network grows around you.',
  },
]

const joinInputClass =
  'border-[var(--primary)]/22 bg-[var(--cream)]/84 text-[var(--espresso)] shadow-none placeholder:text-[var(--espresso)]/50 focus-visible:ring-[var(--primary)]/25'
const joinLabelClass = 'text-[var(--espresso)]/70'

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
    <main className="relative isolate min-h-screen overflow-x-hidden bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--rose-brown)_16%,transparent),transparent_30%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_28%,transparent),transparent_32%)]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-3rem)] w-full min-w-0 max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-stretch">
        <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_74%,var(--rose-brown))_62%,color-mix(in_srgb,var(--espresso)_58%,var(--rose-brown))_100%)] px-4 py-7 text-[var(--cream)] shadow-panel sm:px-8 lg:px-10">
          <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover opacity-18 mix-blend-screen" />
          <div className="absolute inset-0 bg-[var(--espresso)]/35" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 flex h-full min-w-0 flex-col justify-between gap-8">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Badge className="border-[var(--champagne)]/30 bg-white/10 text-[var(--cream)]">
                {t('Join the Rewards Club')}
              </Badge>
              <Link to="/signin" className="text-sm font-bold text-[var(--cream)]/72 transition hover:text-[var(--cream)]">
                {t('Sign in')}
              </Link>
            </div>

            <div className="min-w-0 max-w-3xl space-y-5">
              <h1 className="max-w-full text-wrap break-words font-serif text-[clamp(2.35rem,9.7vw,3rem)] font-semibold leading-[0.94] tracking-[0.01em] sm:text-[clamp(3rem,7vw,6.8rem)] sm:leading-[0.92]">
                {t('Rewards for the places you already enjoy.')}
              </h1>
              <p className="max-w-2xl break-words text-base font-medium leading-7 text-[var(--cream)]/84 sm:text-lg">
                {t('Create your account, verify once, and activate your member subscription to keep rewards connected across participating businesses.')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="min-w-0 rounded-full bg-[var(--champagne)] px-5 text-[var(--espresso)] hover:bg-[var(--cream)]">
                  <a href="#join-form">{t('Create account')}</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-0 rounded-full border-[var(--champagne)]/40 bg-white/5 px-5 text-[var(--cream)] hover:bg-white/10">
                  <Link to="/rewards">{t('Browse rewards')}</Link>
                </Button>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="min-w-0 rounded-[1rem] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <benefit.icon className="size-5 text-[var(--champagne)]" />
                  <h2 className="mt-3 font-serif text-xl leading-tight text-[var(--cream)]">{t(benefit.title)}</h2>
                  <p className="mt-2 break-words text-xs font-medium leading-5 text-[var(--cream)]/74">{t(benefit.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="join-form" className="flex w-full min-w-0 max-w-full items-center">
          <div className="w-full min-w-0 rounded-[1.75rem] border border-[var(--primary)]/22 bg-[linear-gradient(145deg,#fff8ec_0%,#f6dfc7_100%)] p-6 text-[var(--espresso)] shadow-panel sm:p-8">
            {signUpComplete ? (
              <div className="space-y-7 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[1.35rem] bg-[var(--primary)]/12 text-[var(--primary)]">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl leading-tight text-[var(--espresso)]">{t('Welcome to the Rewards Club.')}</h2>
                  <p className="mx-auto max-w-md text-sm font-medium leading-6 text-[var(--espresso)]/72">
                    {t('Your account request is saved. Check your email if confirmation is required, then sign in. Reward actions may stay locked until admin approval.')}
                  </p>
                  {signUpWarning ? (
                    <p className="mx-auto max-w-md text-sm font-bold leading-6 text-warning">
                      {signUpWarning}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="rounded-full bg-[var(--espresso)] text-[var(--cream)] hover:bg-[var(--rose-brown)]">
                    <Link to="/signin">{t('Go to sign in')}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-[var(--espresso)]/20 bg-[var(--cream)]/40 text-[var(--espresso)] hover:bg-[var(--cream)]/70">
                    <Link to="/rewards">{t('View rewards')}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-6"
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
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)]">
                    <Sparkles className="size-6" />
                  </div>
                  <h2 className="font-serif text-3xl text-[var(--espresso)]">{t('Create your member account')}</h2>
                  <p className="text-sm font-medium leading-6 text-[var(--espresso)]/72">
                    {t('Membership is subscription-based. Create your account first, then activate membership when your account is ready.')}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--primary)]/18 bg-[var(--cream)]/55 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-[0.85rem] bg-[var(--primary)]/12 text-[var(--primary)]">
                      <BadgeCheck className="size-5" />
                    </div>
                    <h3 className="font-serif text-2xl leading-none text-[var(--espresso)]">
                      {t('Why we verify members')}
                    </h3>
                  </div>
                  <div className="grid gap-2 text-xs font-semibold leading-5 text-[var(--espresso)]/70">
                    <p>{t('One account per person keeps rewards fair across the network.')}</p>
                    <p>{t('Verification protects reward value before members earn or redeem.')}</p>
                    <p>{t('Admins review submissions, and your ID is used only for verification.')}</p>
                  </div>
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
                    className={joinInputClass}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => setVerificationDocument(event.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs font-medium leading-5 text-[var(--espresso)]/62">
                    {t('Used only to verify one member account per person before rewards can be earned or redeemed.')}
                  </p>
                </div>

                {error ? (
                  <div className="rounded-[1rem] border border-error/20 bg-error/10 p-4 text-sm font-bold text-error">
                    {t(error)}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-full bg-[var(--espresso)] text-[var(--cream)] shadow-soft hover:bg-[var(--rose-brown)]"
                  isLoading={form.formState.isSubmitting}
                >
                  <Gift className="size-4" />
                  {t('Join the Rewards Club')}
                </Button>

                <p className="rounded-[1rem] border border-[var(--primary)]/16 bg-[var(--cream)]/45 p-3 text-center text-xs font-semibold leading-5 text-[var(--espresso)]/68">
                  {t('After signup, your account may need admin approval before reward actions unlock.')}
                </p>

                <p className="text-center text-xs font-medium text-[var(--espresso)]/62">
                  {t('Already a member?')} <Link to="/signin" className="font-bold text-[var(--primary)] hover:underline">{t('Sign in')}</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
