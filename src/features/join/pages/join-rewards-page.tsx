import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, BadgeCheck, Check, Gift, HeartHandshake, ShieldCheck, TicketPercent, Upload, WalletCards } from 'lucide-react'
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
    title: 'Earn 20-100% back',
    body: 'Spend at participating businesses and earn reward points based on each offer.',
  },
  {
    icon: TicketPercent,
    title: 'Every visit counts',
    body: 'Coffee, meals, services, and local shopping can all turn into points.',
  },
  {
    icon: HeartHandshake,
    title: 'Redeem locally',
    body: 'Use your reward points for partner perks, credits, gift cards, and offers.',
  },
]

const joinInputClass =
  'h-11 rounded-xl border-[#d9b98e] bg-[#fffaf2] px-3.5 text-sm text-[#24190f] shadow-none placeholder:text-[#8b735f] focus-visible:border-[#9c6a22] focus-visible:ring-[#9c6a22]/18'
const joinFileInputClass =
  `${joinInputClass} cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[#273f3b] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#fffaf2] file:transition hover:file:bg-[#1e312e]`
const joinLabelClass = 'text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#6f4f3d]'

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
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#f8eee2] px-3 py-3 text-[#24190f] sm:px-5 sm:py-5 lg:px-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_4%,rgb(244_216_204/.46),transparent_28%),radial-gradient(circle_at_92%_16%,rgb(132_158_146/.24),transparent_26%),linear-gradient(180deg,#fffaf4_0%,#f8eee2_42%,#f0dcc4_100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-1.5rem)] w-full min-w-0 max-w-7xl grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(410px,500px)] lg:items-stretch">
        <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[1.4rem] bg-[#24150e] px-5 py-5 text-[#fff7ea] shadow-panel sm:rounded-[1.75rem] sm:px-8 sm:py-7 lg:px-10">
          <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover opacity-32 saturate-[.9]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(31_17_10/.92)_0%,rgb(31_17_10/.76)_48%,rgb(31_17_10/.46)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgb(39_63_59/.78),transparent)]" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[linear-gradient(90deg,#84a092,#f2c978,#d99c84)]" />

          <div className="relative z-10 flex h-full min-w-0 flex-col justify-between gap-8">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Badge className="border-[#f2c978]/36 bg-[#fff7ea]/10 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#fff7ea]">
                {t('Reward points club')}
              </Badge>
              <Link to="/signin" className="rounded-full px-3 py-2 text-sm font-bold text-[#fff7ea]/72 transition hover:bg-[#fff7ea]/10 hover:text-[#fff7ea]">
                {t('Sign in')}
              </Link>
            </div>

            <div className="min-w-0 max-w-3xl space-y-5">
              <p className="flex w-fit items-center gap-2 rounded-full border border-[#84a092]/34 bg-[#84a092]/16 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#d8ede4]">
                <ShieldCheck className="size-4" />
                {t('20-100% back in reward points')}
              </p>
              <h1 className="max-w-3xl text-wrap break-words font-serif text-[clamp(2.55rem,9.2vw,4rem)] font-semibold leading-[0.9] sm:text-[clamp(4rem,7vw,6.6rem)]">
                {t('Spend $X locally. Get 20-100% back in reward points.')}
              </h1>
              <p className="max-w-xl break-words text-base font-semibold leading-7 text-[#fff7ea]/84 sm:text-lg">
                {t('Create your account, verify once, and turn eligible purchases into reward points across participating businesses.')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="min-w-0 rounded-full bg-[#f2c978] px-5 text-[#21140d] hover:bg-[#fff7ea]">
                  <a href="#join-form">
                    {t('Start earning points')}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-0 rounded-full border-[#fff7ea]/30 bg-[#fff7ea]/8 px-5 text-[#fff7ea] hover:bg-[#fff7ea]/14 hover:text-[#fff7ea]">
                  <Link to="/rewards">{t('Browse rewards')}</Link>
                </Button>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 rounded-[1.1rem] border border-[#fff7ea]/14 bg-[#fff7ea]/8 p-2 backdrop-blur md:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="min-w-0 rounded-[0.9rem] p-3">
                  <div className="flex items-center gap-2">
                    <benefit.icon className="size-4 text-[#f2c978]" />
                    <h2 className="font-serif text-lg leading-tight text-[#fff7ea]">{t(benefit.title)}</h2>
                  </div>
                  <p className="mt-1.5 break-words text-xs font-medium leading-5 text-[#fff7ea]/70">{t(benefit.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="join-form" className="flex w-full min-w-0 max-w-full items-center">
          <div className="w-full min-w-0 rounded-[1.4rem] border border-[#ddb886] bg-[#fff7ec] p-5 text-[#24190f] shadow-panel sm:rounded-[1.75rem] sm:p-6 lg:p-7">
            {signUpComplete ? (
              <div className="space-y-7 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[1.2rem] bg-[#273f3b]/10 text-[#273f3b]">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl leading-tight text-[#24190f]">{t('Welcome to the Rewards Club.')}</h2>
                  <p className="mx-auto max-w-md text-sm font-medium leading-6 text-[#6f4f3d]">
                    {t('Your account request is saved. Check your email if confirmation is required, then sign in. Reward actions may stay locked until admin approval.')}
                  </p>
                  {signUpWarning ? (
                    <p className="mx-auto max-w-md text-sm font-bold leading-6 text-warning">
                      {signUpWarning}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="rounded-full bg-[#273f3b] text-[#fff7ea] hover:bg-[#1e312e]">
                    <Link to="/signin">{t('Go to sign in')}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-[#9c6a22]/24 bg-[#fffaf2] text-[#24190f] hover:bg-[#f3e5d3]">
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
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#273f3b]/10 text-[#273f3b]">
                      <BadgeCheck className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9c6a22]">{t('Member signup')}</p>
                      <h2 className="font-serif text-3xl leading-tight text-[#24190f]">{t('Create your member account')}</h2>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-6 text-[#6f4f3d]">
                    {t('Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.')}
                  </p>
                </div>

                <div className="rounded-[1rem] border border-[#84a092]/34 bg-[#edf4ef] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[#273f3b]" />
                    <h3 className="font-serif text-xl leading-none text-[#273f3b]">{t('Why we verify members')}</h3>
                  </div>
                  <div className="grid gap-2 text-xs font-semibold leading-5 text-[#36504b]">
                    <p className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0" />{t('One account per person keeps rewards fair across the network.')}</p>
                    <p className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0" />{t('Your ID is used only for verification and admin review.')}</p>
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
                    className={joinFileInputClass}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => setVerificationDocument(event.target.files?.[0] ?? null)}
                  />
                  <p className="flex items-start gap-2 text-xs font-medium leading-5 text-[#6f4f3d]">
                    <Upload className="mt-0.5 size-3.5 shrink-0 text-[#273f3b]" />
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
                  className="h-12 w-full rounded-full bg-[#21140d] text-[#fff7ea] shadow-soft hover:bg-[#273f3b]"
                  isLoading={form.formState.isSubmitting}
                >
                  <Gift className="size-4" />
                  {t('Join and earn points')}
                </Button>

                <p className="rounded-xl border border-[#ddb886] bg-[#fffaf2] p-3 text-center text-xs font-semibold leading-5 text-[#6f4f3d]">
                  {t('After signup, your account may need admin approval before reward actions unlock.')}
                </p>

                <p className="text-center text-xs font-medium text-[#6f4f3d]">
                  {t('Already a member?')} <Link to="/signin" className="font-bold text-[#273f3b] hover:underline">{t('Sign in')}</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
