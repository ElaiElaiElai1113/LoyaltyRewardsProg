import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gift,
  QrCode,
  Repeat2,
  Store,
  TicketPercent,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import heroImage from '@/assets/medellinrewards-hero.webp'
import { Badge } from '@/components/ui/badge'
import { LanguagePicker } from '@/components/language-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { useRewards } from '@/hooks/use-customer-data'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { validateVerificationDocument } from '@/lib/member-verification'
import { formatPoints } from '@/lib/utils'
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

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/reward-terms', label: 'Reward Terms' },
  { to: '/verification-policy', label: 'Verification Policy' },
]

const landingFeatures = [
  {
    icon: Store,
    title: 'Earn across the network',
    body: 'Shop with participating local businesses and keep eligible reward value connected to one account.',
  },
  {
    icon: Gift,
    title: 'Redeem member perks',
    body: 'Use rewards for offers, gift-card value, experiences, and bigger travel-style perks over time.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified account protection',
    body: 'One verified member account per person helps protect reward value across the network.',
  },
]

const howItWorks = [
  {
    icon: QrCode,
    title: 'Subscribe to join',
    body: 'Create your account, verify once, and activate your membership before reward actions unlock.',
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
    title: 'Member subscription',
    body: 'Join once and keep rewards, gift cards, and member activity connected.',
  },
  {
    icon: Store,
    title: 'Participating local businesses',
    body: 'Earn from eligible spending with businesses in the Medellin Rewards network.',
  },
  {
    icon: Gift,
    title: 'Member perks and experiences',
    body: 'Redeem offers chosen by businesses, from everyday perks to bigger rewards over time.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified member account',
    body: 'Verification helps keep redemption value fair and protected for real members.',
  },
]

const trustPoints = [
  {
    title: 'Rewards are not cash payouts',
    body: 'Rewards are perks, credits, gift-card value, and experiences you redeem through Medellin Rewards.',
  },
  {
    title: 'Your rewards stay connected',
    body: 'Your member account keeps eligible value organized across participating businesses.',
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
  const rewards = useRewards()
  const availableRewards = rewards.data ?? []
  const featuredRewards = availableRewards.filter((reward) => reward.featured)
  const previewRewards = (featuredRewards.length > 0 ? featuredRewards : availableRewards).slice(0, 3)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffaf4] pb-24 text-[#21140d] sm:pb-0">
      <header className="sticky top-0 z-50 px-3 py-3 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[0.8rem] border border-[#ead8bd] bg-[#fffdf8]/95 px-4 py-3 shadow-soft sm:px-5">
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
              <Link to="/join">{t('Join Medellin Rewards')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate -mt-20 flex min-h-[calc(100svh-4.5rem)] items-end overflow-hidden bg-[#21140d] px-4 pb-7 pt-24 text-[#fff7ea] sm:min-h-[calc(100svh-7.5rem)] sm:px-6 sm:pb-12 sm:pt-32 lg:px-8">
        <img src={heroImage} alt="" className="absolute inset-0 -z-30 size-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgb(22_13_8/.96)_0%,rgb(22_13_8/.88)_42%,rgb(22_13_8/.42)_78%,rgb(22_13_8/.18)_100%)] sm:bg-[linear-gradient(90deg,rgb(22_13_8/.94)_0%,rgb(22_13_8/.84)_34%,rgb(22_13_8/.34)_67%,rgb(22_13_8/.1)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(22_13_8/.58)_0%,transparent_30%,rgb(22_13_8/.78)_100%)] sm:bg-[linear-gradient(180deg,rgb(22_13_8/.52)_0%,transparent_38%,rgb(22_13_8/.72)_100%)]" />

        <div className="mx-auto grid w-full max-w-7xl gap-5 sm:gap-8 lg:grid-cols-[minmax(0,0.94fr)_minmax(20rem,0.58fr)] lg:items-end">
          <div className="max-w-4xl space-y-5 sm:space-y-7">
            <Badge className="w-fit max-w-full justify-center whitespace-normal border-[#f2c978]/55 bg-[#fff7ea] px-3.5 py-1.5 text-center text-[0.62rem] font-extrabold uppercase leading-4 tracking-[0.1em] text-[#21140d] shadow-soft sm:px-5 sm:py-2 sm:text-xs sm:leading-5 sm:tracking-[0.12em]">
              {t('One membership for participating local businesses')}
            </Badge>
            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-4xl text-wrap font-serif text-[clamp(2.55rem,12vw,3.8rem)] font-semibold leading-[0.92] text-[#fff7ea] sm:text-[clamp(4rem,7vw,7.5rem)] sm:leading-[0.88]">
                {t('Earn rewards every time you shop locally.')}
              </h1>
              <p className="max-w-2xl text-sm font-semibold leading-6 text-[#f6ead8] sm:text-xl sm:leading-8">
                {t('Join Medellin Rewards to earn member value with participating local businesses, track rewards in one account, and redeem perks when you are ready.')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-auto min-h-12 w-full rounded-full bg-[#f2c978] px-4 py-3 text-sm font-extrabold leading-tight text-[#21140d] shadow-soft hover:bg-[#fff7ea] sm:h-[3.25rem] sm:w-auto sm:px-6 sm:py-0 sm:text-base">
                <Link to="/join">
                  {t('Join Medellin Rewards')}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-auto min-h-12 w-full rounded-full border-[#f2c978]/55 bg-[#fff4dd]/8 px-4 py-3 text-sm font-extrabold leading-tight text-[#fff7ea] hover:bg-[#fff4dd]/16 hover:text-[#fff7ea] sm:h-[3.25rem] sm:w-auto sm:px-6 sm:py-0 sm:text-base">
                <Link to="/rewards">{t('Browse Rewards')}</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-1">
            {landingFeatures.map((feature) => (
              <div key={feature.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-[0.9rem] border border-[#f2c978]/28 bg-[#120b07]/62 p-3 shadow-soft backdrop-blur-md sm:block sm:rounded-[1rem] sm:p-5">
                <div className="row-span-2 flex size-9 items-center justify-center rounded-[0.7rem] bg-[#f2c978]/18 text-[#f2c978] sm:mb-4 sm:size-10 sm:rounded-[0.8rem]">
                  <feature.icon className="size-5" />
                </div>
                <h2 className="font-serif text-xl leading-none text-[#fff7ea] sm:text-2xl">{t(feature.title)}</h2>
                <p className="line-clamp-2 text-xs font-semibold leading-5 text-[#ead9c2] sm:mt-3 sm:text-sm sm:leading-6">{t(feature.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] px-4 py-10 text-[#21140d] sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {proofStrip.map((item) => (
            <div key={item.title} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-[1rem] border border-[#d8b98c]/50 bg-[#fffaf4] p-4 shadow-soft sm:block sm:rounded-[1.25rem] sm:p-6">
              <div className="row-span-2 flex size-11 items-center justify-center rounded-[0.8rem] bg-[#f2c978]/24 text-[#5c3718] sm:mb-5 sm:size-12 sm:rounded-[0.9rem]">
                <item.icon className="size-5" />
              </div>
              <h2 className="font-serif text-2xl leading-none text-[#21140d] sm:text-3xl">{t(item.title)}</h2>
              <p className="text-sm font-semibold leading-6 text-[#6f4f3d] sm:mt-3">{t(item.body)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="example-rewards" className="bg-[#fffaf4] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-7 sm:space-y-9">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Member rewards marketplace')}</p>
              <h2 className="font-serif text-[clamp(2.45rem,10vw,5.75rem)] font-semibold leading-none text-[#21140d]">
                {t('Browse perks from the network before you join.')}
              </h2>
            </div>
            <p className="max-w-2xl text-base font-semibold leading-7 text-[#6f4f3d] sm:text-lg sm:leading-8">
              {t('See current member rewards, gift-card value, and partner offers. Your account must be verified before reward actions unlock.')}
            </p>
          </div>

          {rewards.isLoading ? (
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-5 shadow-soft sm:rounded-[1.5rem] sm:p-7">
                  <Skeleton className="h-14 w-14 rounded-[1rem]" />
                  <Skeleton className="mt-7 h-9 w-3/4" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-2/3" />
                  <Skeleton className="mt-6 h-9 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : previewRewards.length === 0 ? (
            <div className="rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-6 text-center shadow-soft sm:rounded-[1.5rem] sm:p-10">
              <Gift className="mx-auto size-12 text-[#9c6a22]" />
              <h3 className="mt-5 font-serif text-3xl leading-none text-[#21140d] sm:text-4xl">{t('New rewards are being added.')}</h3>
              <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#6f4f3d]">
                {t('Participating businesses can add member perks, gift-card value, and experiences as the network grows.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {previewRewards.map((reward) => (
                <div key={reward.id} className="flex min-h-[16.5rem] flex-col rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card sm:min-h-[19rem] sm:rounded-[1.5rem] sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4 sm:mb-7">
                    <div className="flex size-12 items-center justify-center rounded-[1rem] bg-[#f2c978]/24 text-[#5c3718] sm:size-14">
                      <Gift className="size-6" />
                    </div>
                    <span className="rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6f4f3d]">
                      {t(reward.category)}
                    </span>
                  </div>
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#9c6a22]">{t('Featured member reward')}</p>
                  <h3 className="font-serif text-3xl leading-none text-[#21140d] sm:text-4xl">{t(reward.title)}</h3>
                  <p className="mt-4 line-clamp-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(reward.description)}</p>
                  <p className="mt-auto rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#5c3718]">
                    {formatPoints(reward.pointsCost)} {t('points to redeem')}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="rounded-full bg-[#21140d] text-[#fff7ea] hover:bg-[#5e3327]">
              <Link to="/join">{t('Join Medellin Rewards')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-[#9c6a22]/35 bg-[#fffdf8] text-[#21140d] hover:bg-[#efe6d8]">
              <Link to="/rewards">{t('Browse Rewards')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#fffdf8] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-9">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('How it works')}</p>
            <h2 className="mt-3 font-serif text-[clamp(2.45rem,10vw,5.25rem)] font-semibold leading-none text-[#21140d]">
              {t('Join, shop, and redeem without learning a complicated points system.')}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-5 shadow-soft sm:p-7">
                <div className="mb-5 flex items-center justify-between sm:mb-6">
                  <div className="flex size-11 items-center justify-center rounded-[0.9rem] bg-[#f2c978]/28 text-[#5c3718] sm:size-12 sm:rounded-[1rem]">
                    <step.icon className="size-6" />
                  </div>
                  <span className="font-serif text-4xl leading-none text-[#b67718] sm:text-5xl">{index + 1}</span>
                </div>
                <h3 className="font-serif text-3xl leading-none text-[#21140d]">{t(step.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(step.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-join" className="bg-[#fffaf4] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Why it works')}</p>
            <h2 className="font-serif text-[clamp(2.45rem,10vw,5.25rem)] font-semibold leading-none text-[#21140d]">
              {t('Clear rewards, simple redemption, one member account.')}
            </h2>
            <p className="max-w-xl text-base font-semibold leading-7 text-[#6f4f3d] sm:text-lg sm:leading-8">
              {t('Medellin Rewards helps members understand value, keep rewards organized, and redeem perks across participating businesses.')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <div key={point.title} className="rounded-[1rem] border border-[#d8b98c]/50 bg-[#fffaf4] p-4 shadow-soft sm:p-5">
                <BadgeCheck className="mb-4 size-6 text-[#9c6a22]" />
                <h3 className="font-serif text-2xl leading-none text-[#21140d]">{t(point.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(point.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#21140d] px-4 py-12 text-[#fff7ea] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <UsersRound className="mx-auto mb-5 size-10 text-[#f2c978]" />
          <h2 className="font-serif text-[clamp(2.45rem,10vw,5.25rem)] font-semibold leading-none text-[#fff7ea]">
            {t('Ready to join Medellin Rewards?')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#ead9c2]">
            {t('Create your member account, activate your subscription, browse available rewards, and keep your reward value connected across the network.')}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="rounded-full bg-[#f2c978] text-[#21140d] hover:bg-[#fff7ea]">
              <Link to="/join">{t('Join Medellin Rewards')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-[#f2c978]/45 bg-[#fff4dd]/8 text-[#fff7ea] hover:bg-[#fff4dd]/16 hover:text-[#fff7ea]">
              <Link to="/rewards">{t('Browse Rewards')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#ead8bd] bg-[#fffdf8] px-4 py-8 text-[#6f4f3d] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm font-semibold md:flex-row md:items-center">
          <span className="font-serif text-xl font-bold text-[#21140d]">Medellin Rewards</span>
          <nav className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link key={link.to} to={link.to} className="transition hover:text-[#21140d]">
                {t(link.label)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#d8b98c]/55 bg-[#fffdf8]/96 px-3 py-3 shadow-[0_-18px_42px_-30px_rgb(122_73_38_/_0.38)] backdrop-blur sm:hidden">
        <div className="mx-auto grid w-full max-w-md grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-2">
          <Link
            to="/join"
            className="flex min-h-11 min-w-0 items-center justify-center rounded-full bg-[#21140d] px-2.5 py-2 text-center text-[0.68rem] font-bold leading-tight text-[#fff7ea] transition hover:bg-[#5e3327]"
          >
            {t('Join Medellin Rewards')}
          </Link>
          <Link
            to="/rewards"
            className="flex min-h-11 min-w-0 items-center justify-center rounded-full border border-[#9c6a22]/35 bg-[#fffaf4] px-2.5 py-2 text-center text-[0.68rem] font-bold leading-tight text-[#21140d] transition hover:bg-[#efe6d8]"
          >
            {t('Browse Rewards')}
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
                {t('Travel-style rewards')}<br />
                <span className="text-[var(--champagne)]">{t('can start with')}</span><br />
                {t('everyday spending')}.
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/88">
                {t('Imagine using rewards toward travel-style perks over time by earning Rewards on things you already do. Medellin Rewards offers a minimum of 20% and up to 100% in Rewards every time you spend at businesses within our network.')}
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
