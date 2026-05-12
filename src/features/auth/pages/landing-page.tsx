import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gift,
  Handshake,
  Play,
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
  'rounded-full border border-[var(--champagne)]/28 bg-[var(--cream)]/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--cream)]/86'

const landingFeatures = [
  {
    icon: WalletCards,
    title: 'Members earn rewards',
    body: 'Customers collect reward value from everyday spending at participating businesses.',
  },
  {
    icon: Store,
    title: 'Businesses get repeat visits',
    body: 'Owners create reward offers, invite customers with QR links, and keep redemption simple for staff.',
  },
  {
    icon: Handshake,
    title: 'Ambassadors share the network',
    body: 'Partners and promoters send customers through tracked links and help the circle grow.',
  },
]

const howItWorks = [
  {
    icon: QrCode,
    title: 'Scan or join',
    body: 'A customer joins from a QR code, partner link, or the public rewards page.',
  },
  {
    icon: TicketPercent,
    title: 'Shop and earn',
    body: 'Every qualifying purchase builds reward value tied to the customer account.',
  },
  {
    icon: Gift,
    title: 'Redeem in-store',
    body: 'Members claim rewards and staff validate them with simple redemption tools.',
  },
]

const businessProof = [
  'QR signup portals for checkout, tables, events, and partner desks',
  'Reward credits staff can validate in-store',
  'Partner referral links with owner reporting',
  'Food-cost calculator that shows real business impact',
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
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ef] text-[#15110d]">
      <header className="sticky top-0 z-50 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[0.8rem] bg-white/92 px-5 py-3 shadow-soft">
          <Link to="/" className="min-w-0 font-serif text-xl font-bold text-[var(--espresso)] sm:text-2xl">
            Medellin Rewards
          </Link>
          <nav className="hidden items-center gap-2 rounded-full bg-[#f3f1ed] px-3 py-2 lg:flex">
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#for-businesses', label: 'For businesses' },
              { href: '#rewards', label: 'Rewards' },
              { href: '#ambassadors', label: 'Ambassadors' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-bold text-[var(--primary-container)] transition hover:bg-white"
              >
                {t(item.label)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden rounded-full text-[var(--espresso)] sm:inline-flex">
              <Link to="/signin">{t('Sign In')}</Link>
            </Button>
            <Button asChild size="sm" className="shrink-0 rounded-full bg-[var(--espresso)] text-[var(--cream)] hover:bg-[var(--rose-brown)]">
              <Link to="/join">{t('Join free')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[var(--espresso)] px-4 py-10 text-[var(--cream)] sm:px-6 lg:px-8">
        <img src={heroImage} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-20 mix-blend-screen" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_88%,var(--rose-brown))_52%,color-mix(in_srgb,var(--espresso)_65%,transparent)_100%)]" />
        <div className="absolute right-0 top-0 hidden h-36 w-36 rounded-bl-[4.5rem] bg-[var(--champagne)]/62 lg:block" />

        <div className="relative mx-auto flex min-h-[calc(100svh-9rem)] max-w-7xl min-w-0 flex-col justify-center">
          <div className="max-w-[62rem] min-w-0 space-y-6">
            <Badge className="w-fit max-w-full whitespace-normal border-[var(--champagne)]/40 bg-[var(--cream)] px-5 py-2 text-[var(--espresso)] shadow-soft">
              {t("The world's highest paying Rewards Program!")}
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-full text-wrap font-serif text-[clamp(2.85rem,6vw,5.9rem)] font-semibold leading-[0.94] text-[var(--cream)]">
                <span className="block xl:inline">{t('Free vacations')}</span>{' '}
                <span className="block text-[var(--champagne)] xl:inline">{t('can start with')}</span>{' '}
                <span className="block xl:inline">{t('everyday spending')}.</span>
              </h1>
              <p className="max-w-[46rem] text-base font-semibold leading-8 text-[var(--cream)]/86 sm:text-lg">
                {t('Imagine going on a free vacation every year - just by earning Rewards doing things you already do. Medellin Rewards pays you a minimum of 20% and up to 100% in Rewards every time you spend at businesses within our network.')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-[var(--champagne)] text-[var(--espresso)] hover:bg-[var(--cream)]">
                <Link to="/join">
                  {t('Join Rewards Club')}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-[var(--champagne)]/35 bg-transparent text-[var(--cream)] hover:bg-[var(--cream)]/10 hover:text-[var(--cream)]">
                <Link to="/business">{t('For Businesses')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-[var(--champagne)]/35 bg-transparent text-[var(--cream)] hover:bg-[var(--cream)]/10 hover:text-[var(--cream)]">
                <a href="#how-it-works">
                  <Play className="size-4" />
                  {t('How it works')}
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={valuePillClass}>{t('Free to join')}</span>
              <span className={valuePillClass}>{t('Earn 20% to 100% back')}</span>
              <span className={valuePillClass}>{t('Redeem at local businesses')}</span>
            </div>
          </div>

          <div className="mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {landingFeatures.map((feature) => (
              <div key={feature.title} className="rounded-[1rem] border border-[var(--champagne)]/22 bg-[var(--espresso)]/58 p-5 shadow-soft backdrop-blur">
                <div className="mb-4 flex size-10 items-center justify-center rounded-[0.8rem] bg-[var(--champagne)]/16 text-[var(--champagne)]">
                  <feature.icon className="size-5" />
                </div>
                <h2 className="font-serif text-2xl leading-none text-[var(--cream)]">{t(feature.title)}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--cream)]/72">{t(feature.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-9">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary)]">{t('How it works')}</p>
            <h2 className="mt-3 font-serif text-5xl font-semibold leading-none text-[var(--espresso)]">
              {t('A simple rewards loop for customers and local businesses.')}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-[1.25rem] border border-[var(--primary)]/18 bg-white p-7 shadow-soft">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-[1rem] bg-[var(--champagne)]/28 text-[var(--primary-container)]">
                    <step.icon className="size-6" />
                  </div>
                  <span className="font-serif text-5xl leading-none text-[var(--champagne-strong)]">{index + 1}</span>
                </div>
                <h3 className="font-serif text-3xl text-[var(--espresso)]">{t(step.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">{t(step.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-businesses" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <Badge variant="accent" className="w-fit">{t('For businesses')}</Badge>
            <h2 className="font-serif text-5xl font-semibold leading-none text-[var(--espresso)]">
              {t('Bring customers back without making rewards feel like cash payouts.')}
            </h2>
            <p className="text-base font-semibold leading-7 text-[var(--muted-foreground)]">
              {t('Owners can launch QR signup links, track referrals, validate reward credits, and understand the real food-cost impact before choosing an offer.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-[var(--espresso)] text-[var(--cream)] hover:bg-[var(--rose-brown)]">
                <Link to="/business#book-demo">{t('Book Business Demo')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/business">{t('See calculator')}</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {businessProof.map((point) => (
              <div key={point} className="rounded-[1rem] border border-[var(--primary)]/16 bg-[var(--surface-container-lowest)] p-5">
                <BadgeCheck className="mb-4 size-6 text-[var(--primary)]" />
                <p className="text-sm font-bold leading-6 text-[var(--espresso)]">{t(point)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rewards" className="bg-[linear-gradient(135deg,var(--espresso),color-mix(in_srgb,var(--espresso)_78%,var(--rose-brown)))] px-4 py-16 text-[var(--cream)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--champagne)]">{t('Reward example')}</p>
              <h2 className="font-serif text-5xl font-semibold leading-none">
                {t('Customers see more value. Businesses manage the real cost.')}
              </h2>
              <p className="max-w-2xl text-sm font-semibold leading-7 text-[var(--cream)]/76">
                {t('Example: when a customer earns $250 in reward value, a business with 25% food cost may only feel $62.50 in real product cost.')}
              </p>
            </div>
            <div className="grid gap-3 rounded-[1rem] border border-[var(--champagne)]/24 bg-[var(--cream)]/8 p-5">
              {[
                ['Customer spend', '$1,000'],
                ['Reward value customers see', '$250'],
                ['Example real business cost', '$62.50'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-[0.8rem] bg-[var(--espresso)]/48 p-4">
                  <span className="text-sm font-bold text-[var(--cream)]/74">{t(label)}</span>
                  <span className="font-serif text-3xl text-[var(--champagne)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ambassadors" className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <UsersRound className="mx-auto mb-5 size-10 text-[var(--primary)]" />
          <h2 className="font-serif text-5xl font-semibold leading-none text-[var(--espresso)]">
            {t('Ready to join the rewards circle?')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[var(--muted-foreground)]">
            {t('Start as a member, explore participating businesses, or book a demo to launch rewards for your own business.')}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-[var(--espresso)] text-[var(--cream)] hover:bg-[var(--rose-brown)]">
              <Link to="/join">{t('Join Rewards Club')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/ambassadors">{t('Become an ambassador')}</Link>
            </Button>
          </div>
        </div>
      </section>
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
                <Link
                  to="/ambassadors"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
                >
                  <Sparkles className="size-4" />
                  {t('Become an ambassador')}
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

          {error ? <p className="relative z-10 mt-8 text-sm font-bold text-red-300">{error}</p> : null}
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

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

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
                            {signInForm.formState.errors.email.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signin-password" className="text-[var(--champagne)]">{t('Password')}</Label>
                        <Input id="signin-password" className={authInputClass} type="password" placeholder="Password" {...signInForm.register('password')} />
                        {signInForm.formState.errors.password ? (
                          <p className="text-xs font-bold text-red-500">
                            {signInForm.formState.errors.password.message}
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

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

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
                          {t('Check your email to verify your account, then sign in to start earning rewards.')}
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
                        <Label htmlFor="signup-verification-id" className="text-[var(--champagne)]">Verification ID number</Label>
                        <Input
                          id="signup-verification-id"
                          className={authInputClass}
                          placeholder="ID number"
                          {...signUpForm.register('verificationIdNumber')}
                        />
                        {signUpForm.formState.errors.verificationIdNumber ? (
                          <p className="text-xs font-bold text-red-500">
                            {signUpForm.formState.errors.verificationIdNumber.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="signup-verification-document" className="text-[var(--champagne)]">Photo or PDF of ID</Label>
                        <Input
                          id="signup-verification-document"
                          className={authInputClass}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(event) => setVerificationDocument(event.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs font-medium leading-5 text-[var(--cream)]/66">
                          Used by admins to verify one member account per person.
                        </p>
                      </div>

                      {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

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
