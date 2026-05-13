import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gift,
  QrCode,
  Repeat2,
  Sparkles,
  Store,
  TicketPercent,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import heroImage from '@/assets/hero.png'
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

const valuePillClass =
  'max-w-full rounded-full border border-[#d9b365]/38 bg-[#fff4dd]/12 px-4 py-2 text-center text-xs font-bold uppercase leading-4 tracking-[0.14em] text-[#fff4dd]'

const landingFeatures = [
  {
    icon: WalletCards,
    title: 'Join free',
    body: 'Create your member account and keep your rewards connected in one place.',
  },
  {
    icon: Store,
    title: 'Shop at participating businesses',
    body: 'Spend with local businesses in the Medellin Rewards network and earn rewards as you go.',
  },
  {
    icon: Gift,
    title: 'Redeem your rewards',
    body: 'Use your rewards for member perks and offers, with bigger travel-style rewards possible over time.',
  },
]

const howItWorks = [
  {
    icon: QrCode,
    title: 'Join free',
    body: 'Create your free account once and keep your rewards connected in one place.',
  },
  {
    icon: TicketPercent,
    title: 'Shop and earn',
    body: 'Spend at participating local businesses and collect rewards on eligible purchases.',
  },
  {
    icon: Gift,
    title: 'Redeem rewards',
    body: 'Use your rewards through Medellin Rewards when you are ready to claim an offer.',
  },
]

const proofStrip = [
  {
    icon: WalletCards,
    title: 'Free member account',
    body: 'Join once and keep your rewards connected.',
  },
  {
    icon: Store,
    title: 'Earn at participating businesses',
    body: 'Shop locally and collect rewards on eligible purchases.',
  },
  {
    icon: Gift,
    title: 'Redeem through Medellin Rewards',
    body: 'Claim member offers through a simple rewards flow.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified member account',
    body: 'One account per person helps protect your reward value.',
  },
]

const exampleRewards = [
  {
    icon: Store,
    label: 'Example drink reward',
    title: 'Coffee or drink perk',
    body: 'A member shops locally, earns rewards, and redeems for a simple cafe-style perk.',
  },
  {
    icon: Gift,
    label: 'Example food reward',
    title: 'Pastry or meal offer',
    body: 'Everyday purchases can build toward small offers members understand right away.',
  },
  {
    icon: Sparkles,
    label: 'Example bigger reward',
    title: 'Travel-style value',
    body: 'Consistent local spending can build toward bigger rewards over time.',
  },
]

const trustPoints = [
  {
    title: 'Rewards are not cash payouts',
    body: 'Rewards are member perks and offers you redeem through Medellin Rewards.',
  },
  {
    title: 'Your rewards stay connected',
    body: 'Your member account keeps eligible rewards together across participating locations.',
  },
  {
    title: 'Redemptions stay simple',
    body: 'Claim a reward when you are ready and follow the redemption steps in your account.',
  },
  {
    title: 'ID verification protects reward value',
    body: 'One verified member account per person helps protect the program for everyone.',
  },
]

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
    <main className="min-h-screen overflow-x-hidden bg-[#fffaf4] pb-24 text-[#21140d] sm:pb-0">
      <header className="sticky top-0 z-50 px-3 py-4 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[0.8rem] border border-[#ead8bd] bg-[#fffdf8]/96 px-4 py-3 shadow-soft sm:px-5">
          <Link to="/" className="min-w-0 truncate font-serif text-xl font-bold text-[#21140d] sm:text-2xl">
            Medellin Rewards
          </Link>
          <nav className="hidden items-center gap-2 rounded-full bg-[#efe6d8] px-3 py-2 lg:flex">
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#example-rewards', label: 'Rewards' },
              { href: '#why-join', label: 'Why join' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-bold text-[#3b2618] transition hover:bg-[#fffaf4] hover:text-[#21140d]"
              >
                {t(item.label)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden rounded-full text-[#21140d] hover:bg-[#efe6d8] sm:inline-flex">
              <Link to="/signin">{t('Sign In')}</Link>
            </Button>
            <Button asChild size="sm" className="hidden shrink-0 rounded-full bg-[#21140d] text-[#fff7ea] hover:bg-[#5e3327] sm:inline-flex">
              <Link to="/join">{t('Join free')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#21140d] px-4 py-8 text-[#fff7ea] sm:px-6 lg:px-8">
        <img src={heroImage} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-24 saturate-75" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgb(33_20_13/.96)_0%,rgb(43_27_18/.94)_54%,rgb(33_20_13/.86)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-[linear-gradient(180deg,transparent,rgb(33_20_13/.92))]" />
        <div className="absolute right-0 top-0 hidden h-36 w-36 rounded-bl-[4.5rem] bg-[#d9b365]/68 lg:block" />

        <div className="relative mx-auto flex max-w-7xl min-w-0 flex-col justify-center">
          <div className="w-full max-w-[22rem] min-w-0 space-y-6 sm:max-w-[62rem]">
            <Badge className="w-fit max-w-full justify-center whitespace-normal border-[#d9b365]/50 bg-[#fff7ea] px-5 py-2 text-center leading-5 text-[#21140d] shadow-soft">
              {t('Free to join. Earn when you shop locally.')}
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-full text-wrap font-serif text-[clamp(2.55rem,11vw,5.9rem)] font-semibold leading-[0.94] text-[#fff7ea] sm:text-[clamp(2.85rem,6vw,5.9rem)]">
                <span className="block xl:inline">{t('Earn rewards')}</span>{' '}
                <span className="block text-[#f2c978] xl:inline">{t('every time')}</span>{' '}
                <span className="block xl:inline">{t('you shop locally')}.</span>
              </h1>
              <p className="max-w-full text-base font-semibold leading-8 text-[#f6ead8] sm:max-w-[46rem] sm:text-lg">
                {t('Join free, shop at participating businesses, and collect rewards you can redeem through Medellin Rewards. Everyday shopping can build toward bigger perks, including travel-style rewards over time.')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-[#f2c978] text-[#21140d] hover:bg-[#fff7ea]">
                <Link to="/join">
                  {t('Join Rewards Club')}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-[#d9b365]/48 bg-[#fff4dd]/6 text-[#fff7ea] hover:bg-[#fff4dd]/14 hover:text-[#fff7ea]">
                <Link to="/rewards">{t('Browse rewards')}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={valuePillClass}>{t('Free to join')}</span>
              <span className={valuePillClass}>{t('Earn 20% to 100% back')}</span>
              <span className={valuePillClass}>{t('Redeem through Medellin Rewards')}</span>
            </div>
            <p className="max-w-[42rem] text-sm font-semibold leading-6 text-[#e9d8bf]">
              {t('Rewards are offer-based, not cash payouts. Your verified member account keeps reward value connected to you.')}
            </p>
          </div>

          <div className="mt-8 grid w-full max-w-[22rem] gap-4 sm:max-w-5xl md:grid-cols-3">
            {landingFeatures.map((feature) => (
              <div key={feature.title} className="rounded-[1rem] border border-[#d9b365]/32 bg-[#180f0a]/72 p-5 shadow-soft backdrop-blur">
                <div className="mb-4 flex size-10 items-center justify-center rounded-[0.8rem] bg-[#f2c978]/18 text-[#f2c978]">
                  <feature.icon className="size-5" />
                </div>
                <h2 className="font-serif text-2xl leading-none text-[#fff7ea]">{t(feature.title)}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#e9d8bf]">{t(feature.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] px-4 py-8 text-[#21140d] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {proofStrip.map((item) => (
            <div key={item.title} className="rounded-[1rem] border border-[#d8b98c]/50 bg-[#fffaf4] p-5 shadow-soft">
              <div className="mb-4 flex size-10 items-center justify-center rounded-[0.8rem] bg-[#f2c978]/24 text-[#5c3718]">
                <item.icon className="size-5" />
              </div>
              <h2 className="font-serif text-2xl leading-none text-[#21140d]">{t(item.title)}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(item.body)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="example-rewards" className="bg-[#fffaf4] px-4 py-14 text-[#21140d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Example rewards')}</p>
              <h2 className="font-serif text-5xl font-semibold leading-none text-[#21140d]">
                {t('Example rewards members could unlock.')}
              </h2>
            </div>
            <p className="max-w-2xl text-base font-semibold leading-7 text-[#6f4f3d]">
              {t('These examples show how the value can feel to a member. Live offers depend on the rewards available in Medellin Rewards.')}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {exampleRewards.map((reward) => (
              <div key={reward.title} className="rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-6 shadow-soft">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-[1rem] bg-[#f2c978]/24 text-[#5c3718]">
                    <reward.icon className="size-6" />
                  </div>
                  <span className="rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6f4f3d]">
                    {t(reward.label)}
                  </span>
                </div>
                <h3 className="font-serif text-3xl leading-none text-[#21140d]">{t(reward.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(reward.body)}</p>
                <p className="mt-5 rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#5c3718]">
                  {t('Shop locally -> earn rewards -> redeem value')}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-[#21140d] text-[#fff7ea] hover:bg-[#5e3327]">
              <Link to="/join">{t('Join Rewards Club')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-[#9c6a22]/35 bg-[#fffdf8] text-[#21140d] hover:bg-[#efe6d8]">
              <Link to="/rewards">{t('Browse rewards')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#fffaf4] px-4 py-14 text-[#21140d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-9">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('How it works')}</p>
            <h2 className="mt-3 font-serif text-5xl font-semibold leading-none text-[#21140d]">
              {t('Join, shop, and redeem without learning a complicated points system.')}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-7 shadow-soft">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-[1rem] bg-[#f2c978]/28 text-[#5c3718]">
                    <step.icon className="size-6" />
                  </div>
                  <span className="font-serif text-5xl leading-none text-[#b67718]">{index + 1}</span>
                </div>
                <h3 className="font-serif text-3xl text-[#21140d]">{t(step.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(step.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-join" className="bg-[#fffdf8] px-4 py-14 text-[#21140d] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Why it works')}</p>
            <h2 className="font-serif text-5xl font-semibold leading-none text-[#21140d]">
              {t('Clear rewards, simple redemption, one member account.')}
            </h2>
            <p className="max-w-xl text-base font-semibold leading-7 text-[#6f4f3d]">
              {t('Medellin Rewards is built so members can understand the value, keep rewards organized, and redeem without a complicated points system.')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <div key={point.title} className="rounded-[1rem] border border-[#d8b98c]/50 bg-[#fffaf4] p-5 shadow-soft">
                <BadgeCheck className="mb-4 size-6 text-[#9c6a22]" />
                <h3 className="font-serif text-2xl leading-none text-[#21140d]">{t(point.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(point.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf4] px-4 py-14 text-[#21140d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <UsersRound className="mx-auto mb-5 size-10 text-[#9c6a22]" />
          <h2 className="font-serif text-5xl font-semibold leading-none text-[#21140d]">
            {t('Ready to join the rewards circle?')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#6f4f3d]">
            {t('Create your free member account, browse available rewards, and keep your reward value connected in one place.')}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-[#21140d] text-[#fff7ea] hover:bg-[#5e3327]">
              <Link to="/join">{t('Join Rewards Club')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-[#9c6a22]/35 bg-[#fffdf8] text-[#21140d] hover:bg-[#efe6d8]">
              <Link to="/rewards">{t('Browse rewards')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#d8b98c]/55 bg-[#fffdf8]/96 px-3 py-3 shadow-[0_-18px_42px_-30px_rgb(122_73_38_/_0.38)] backdrop-blur sm:hidden">
        <div className="mx-auto grid w-full max-w-md grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <Link
            to="/join"
            className="flex h-9 min-w-0 items-center justify-center rounded-full bg-[#21140d] px-2 text-center text-[0.7rem] font-bold text-[#fff7ea] transition hover:bg-[#5e3327]"
          >
            {t('Join free')}
          </Link>
          <Link
            to="/rewards"
            className="flex h-9 min-w-0 items-center justify-center rounded-full border border-[#9c6a22]/35 bg-[#fffaf4] px-2 text-center text-[0.7rem] font-bold text-[#21140d] transition hover:bg-[#efe6d8]"
          >
            {t('Browse rewards')}
          </Link>
        </div>
      </div>
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
        <section className="relative flex h-auto min-h-0 flex-col justify-center overflow-hidden rounded-[1.6rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-6 text-[var(--cream)] shadow-panel md:px-8 lg:px-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />
          <div className="hidden" />

          <div className="relative z-10 space-y-4">
            <Badge variant="default" className="w-fit border-[var(--champagne)]/55 bg-[linear-gradient(90deg,var(--cream),var(--champagne))] px-4 py-1.5 text-[var(--espresso)] shadow-soft">
              {t("The world's highest paying Rewards Program!")}
            </Badge>
            <div className="max-w-3xl space-y-3">
              <h1 className="font-serif text-[clamp(2.35rem,4.4vw,4rem)] font-semibold leading-[0.92] tracking-[0.01em] text-[var(--cream)]">
                {t('Free vacations')}<br />
                <span className="text-[var(--champagne)]">{t('can start with')}</span><br />
                {t('everyday spending')}.
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/88">
                {t('Imagine going on a free vacation every year - just by earning Rewards doing things you already do. Medellin Rewards pays you a minimum of 20% and up to 100% in Rewards every time you spend at businesses within our network.')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/join"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--champagne)]/45 bg-[var(--champagne)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--espresso)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--cream)]"
                >
                  {t('Join Rewards Club')}
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
                >
                  {t('Browse shops')}
                </Link>
                <Link
                  to="/rewards"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
                >
                  <Gift className="size-4" />
                  {t('View rewards')}
                </Link>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--blush)]/20 bg-[var(--espresso)]/48 p-4 text-[var(--cream)] shadow-soft backdrop-blur">
              <div className="max-w-2xl space-y-1.5">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[var(--blush)]">
                  {t('Featured rewards circle')}
                </p>
                <h2 className="font-serif text-3xl font-semibold leading-none text-[var(--cream)]">
                  {t('Earn from what you already do')}
                </h2>
                <p className="text-xs font-medium leading-5 text-[var(--cream)]/78">
                  {t('The video will explain the program in a simple way, then members can explore where their everyday spending turns into Rewards.')}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.75rem),1fr))] gap-2.5">
                {[
                  { icon: Gift, title: t('20% to 100% back'), body: t('Earn a minimum of 20% and up to 100% in Rewards when you spend within the network.') },
                  { icon: Repeat2, title: t('Member bonus'), body: t('Keep rewards connected across visits, referrals, and participating local businesses.') },
                  { icon: CalendarClock, title: t('More ways to earn'), body: t('Members will earn from everyday spending now, with lower Rewards on big purchases planned for the future.') },
                ].map((item) => (
                  <div key={item.title} className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-3 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
                    <div className="mb-2.5 flex size-8 items-center justify-center rounded-[0.7rem] bg-[var(--champagne)]/18 text-[var(--champagne)]">
                      <item.icon className="size-4" />
                    </div>
                    <h2 className="font-serif text-lg leading-none text-[var(--cream)]">{item.title}</h2>
                    <p className="mt-1.5 text-xs font-semibold leading-4 text-[var(--cream)]/74">{item.body}</p>
                  </div>
                ))}
              </div>
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

                <div className="relative mx-auto min-h-[25.5rem] max-w-md overflow-hidden rounded-[1.75rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
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

                <div className="relative mx-auto flex min-h-[25.5rem] max-w-md flex-col justify-center overflow-hidden rounded-[1.75rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
                  <div className="absolute right-0 top-0 size-24 rounded-bl-[3.5rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
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
                          {t('Create your free account to earn points, unlock perks, and move through the circle with ease.')}
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
