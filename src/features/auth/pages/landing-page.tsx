import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Coins,
  Gift,
  QrCode,
  Store,
  UsersRound,
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

// TODO: replace placeholders with final copy (price, math, founder, FAQ answers).
const PRICE = '$XX' // monthly price placeholder
const PRICE_UNIT = '/mo'
const EXAMPLE_SPEND = '$200'
const EXAMPLE_RETURN = '$40+'
const EXAMPLE_THREE_MONTH_NET = '$XX' // 3-month net of dues placeholder
const EXAMPLE_THREE_MONTH_DUES = '$XX' // dues across 3 months placeholder

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#rewards', label: 'Rewards' },
  { href: '#faq', label: 'FAQ' },
]

const punchCardComparison = [
  {
    old: 'Stamps stay with one café',
    new: 'One membership across the network',
  },
  {
    old: '"10th coffee free"',
    new: 'Real reward value (20–100%) on every visit',
  },
  {
    old: 'Lose the card, lose the rewards',
    new: 'Every reward lives in your verified account',
  },
]

const howItWorks = [
  {
    icon: QrCode,
    title: 'Subscribe and verify',
    body: 'Create your account and verify once with a photo of your ID. One account per person — that is what keeps reward value real instead of getting drained by duplicates.',
  },
  {
    icon: Store,
    title: 'Shop and earn',
    body: 'Spend at participating local businesses. Eligible purchases earn rewards at the rate the business sets (20–100%).',
  },
  {
    icon: Gift,
    title: 'Redeem when ready',
    body: 'Use your rewards through Medellin Rewards whenever you want to claim a perk, credit, or gift-card value.',
  },
]

const pricingBullets = [
  'One verified membership across the network',
  'Earn 20–100% in rewards on eligible spending',
  'Rewards stay connected across every participating business',
  'Member perks, gift-card value, and experiences',
  'English and Español, in one account',
  'Cancel anytime',
]

const faqEntries = [
  {
    question: 'Is this another scammy points program?',
    answer:
      'No. Every reward is tied to a real participating business and an honest math model. We show you the rates, the example math, and what redemptions are available before you join. [TODO: tighten with founder voice.]',
  },
  {
    question: "What if I don't spend enough locally to make it worth it?",
    answer: `At ${EXAMPLE_SPEND}/month in eligible spending you already cover the membership and have rewards left over. Lower spending months still earn rewards — the membership just becomes less efficient. [TODO: add concrete breakeven math.]`,
  },
  {
    question: 'Can I cancel?',
    answer: 'Yes. Cancel anytime from your account. No long-term contract.',
  },
  {
    question: 'Why do you need to verify my ID?',
    answer:
      'One verified account per person is what keeps reward value protected for real members. Verification is a quick photo or PDF of an ID, used only by admins to confirm the account.',
  },
  {
    question: 'Which businesses are participating? When do more get added?',
    answer:
      'The partner roster grows weekly as we onboard local cafés, restaurants, and shops in Medellín. Members get early access to new partners as they launch. [TODO: insert current partner count or list.]',
  },
  {
    question: 'Is this only in Medellín?',
    answer:
      'For now, yes. Medellin Rewards is built around the local network here. Expansion is planned, but we want the experience to be excellent in one city first.',
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const { t } = useLanguage()
  return (
    <details className="group rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffdf8] p-5 shadow-soft transition open:bg-[#fffaf4] sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-serif text-xl leading-snug text-[#21140d] sm:text-2xl">
        <span>{t(question)}</span>
        <ChevronDown
          className="size-5 shrink-0 text-[#9c6a22] transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-4 text-sm font-semibold leading-7 text-[#6f4f3d] sm:text-base">{t(answer)}</p>
    </details>
  )
}

export function LandingPage() {
  const { t } = useLanguage()
  const rewards = useRewards()
  const availableRewards = rewards.data ?? []
  const featuredRewards = availableRewards.filter((reward) => reward.featured)
  const previewRewards = (featuredRewards.length > 0 ? featuredRewards : availableRewards).slice(0, 3)

  const sampleRewardTiles = [
    {
      title: 'Sample · 30% back at a partner café',
      category: 'Café',
      points: '—',
      description: 'Illustrative example of a rewards tile while we onboard partners. Real partner perks appear here as the network grows.',
    },
    {
      title: 'Sample · Restaurant credit',
      category: 'Restaurant',
      points: '—',
      description: 'Illustrative example of redeemable credit at a participating local restaurant.',
    },
    {
      title: 'Sample · Member-only experience',
      category: 'Experience',
      points: '—',
      description: 'Illustrative example of a curated member experience — tours, classes, or partner events.',
    },
  ]

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffaf4] pb-24 text-[#21140d] sm:pb-0">
      <header className="sticky top-0 z-50 px-3 py-3 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[1.25rem] border border-[#ead8bd] bg-[#fffdf8]/95 px-4 py-3 shadow-soft sm:px-5">
          <Link to="/" className="min-w-0 truncate font-serif text-xl font-bold text-[#21140d] sm:text-2xl">
            Medellin Rewards
          </Link>
          <nav className="hidden items-center gap-1 rounded-full bg-[#efe6d8] px-2 py-1.5 lg:flex">
            {navLinks.map((item) => (
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
            <LanguagePicker compact className="hidden text-[#21140d] sm:flex" />
            <Button asChild variant="ghost" size="sm" className="hidden rounded-full text-[#21140d] hover:bg-[#efe6d8] sm:inline-flex">
              <Link to="/signin">{t('Sign In')}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden shrink-0 rounded-full bg-[#f2c978] text-[#21140d] hover:bg-[#fff7ea] sm:inline-flex"
            >
              <Link to="/join">{`${t('Join')} — ${PRICE}${PRICE_UNIT}`}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate -mt-20 flex min-h-[calc(100svh-4.5rem)] items-end overflow-hidden bg-[#21140d] px-4 pb-7 pt-24 text-[#fff7ea] sm:min-h-[calc(100svh-7.5rem)] sm:px-6 sm:pb-12 sm:pt-32 lg:px-8">
        <img src={heroImage} alt="" className="absolute inset-0 -z-30 size-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgb(22_13_8/.96)_0%,rgb(22_13_8/.88)_42%,rgb(22_13_8/.42)_78%,rgb(22_13_8/.18)_100%)] sm:bg-[linear-gradient(90deg,rgb(22_13_8/.94)_0%,rgb(22_13_8/.84)_34%,rgb(22_13_8/.34)_67%,rgb(22_13_8/.1)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(22_13_8/.58)_0%,transparent_30%,rgb(22_13_8/.78)_100%)] sm:bg-[linear-gradient(180deg,rgb(22_13_8/.52)_0%,transparent_38%,rgb(22_13_8/.72)_100%)]" />

        <div className="mx-auto grid w-full max-w-7xl gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div className="max-w-3xl space-y-6 sm:space-y-8">
            <Badge className="w-fit max-w-full justify-center whitespace-normal border-[#f2c978]/55 bg-[#fff7ea] px-3.5 py-1.5 text-center text-[0.62rem] font-extrabold uppercase leading-4 tracking-[0.1em] text-[#21140d] shadow-soft sm:px-5 sm:py-2 sm:text-xs sm:leading-5 sm:tracking-[0.12em]">
              {t('Membership for English-speaking expats in Medellín')}
            </Badge>
            <div className="space-y-4 sm:space-y-5">
              <h1 className="text-wrap font-serif text-[clamp(2.1rem,8.5vw,3.4rem)] font-semibold leading-[0.96] text-[#fff7ea] sm:text-[clamp(3.25rem,6.4vw,6.25rem)] sm:leading-[0.9]">
                {t('Spend')} <span className="text-[#f2c978]">{EXAMPLE_SPEND}</span>{t('/month locally.')}<br />
                {t('Get')} <span className="text-[#f2c978]">{EXAMPLE_RETURN}</span> {t('back, every month.')}
              </h1>
              <p className="max-w-2xl text-sm font-semibold leading-6 text-[#f6ead8] sm:text-lg sm:leading-8">
                {t('Medellin Rewards is a paid membership that turns everyday spending at participating local businesses into real, redeemable reward value — credits, perks, and gift-card balances kept in one verified account.')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-auto min-h-12 w-full rounded-full bg-[#f2c978] px-4 py-3 text-sm font-extrabold leading-tight text-[#21140d] shadow-soft hover:bg-[#fff7ea] sm:h-[3.25rem] sm:w-auto sm:px-6 sm:py-0 sm:text-base"
              >
                <Link to="/join">
                  {`${t('Join for')} ${PRICE}${PRICE_UNIT}`}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto min-h-12 w-full rounded-full border-[#f2c978]/55 bg-[#fff4dd]/8 px-4 py-3 text-sm font-extrabold leading-tight text-[#fff7ea] hover:bg-[#fff4dd]/16 hover:text-[#fff7ea] sm:h-[3.25rem] sm:w-auto sm:px-6 sm:py-0 sm:text-base"
              >
                <a href="#how-it-works">{t('See how it works →')}</a>
              </Button>
            </div>
            <p className="text-xs font-semibold leading-5 text-[#ead9c2] sm:text-sm">
              {t('Cancel anytime · No long-term contract · Available in English and Español')}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[#f2c978]/30 bg-[#120b07]/68 p-5 shadow-soft backdrop-blur-md sm:p-6">
            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#f2c978] sm:text-xs">
              {t('Example month')}
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3 border-b border-[#f2c978]/20 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ead9c2]">{t('You spend')}</span>
                <span className="font-serif text-3xl font-semibold text-[#fff7ea]">{EXAMPLE_SPEND}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-[#f2c978]/20 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ead9c2]">{t('You earn back')}</span>
                <span className="font-serif text-3xl font-semibold text-[#f2c978]">{EXAMPLE_RETURN}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ead9c2]">{t('Membership')}</span>
                <span className="font-serif text-2xl font-semibold text-[#fff7ea]">{`${PRICE}${PRICE_UNIT}`}</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium leading-5 text-[#ead9c2]/80">
              {t('Illustrative example based on a 20% blended rate. Rates set by each business; rewards are credits/perks, not cash.')}
            </p>
          </div>
        </div>
      </section>

      {/* Math section */}
      <section className="bg-[#fffdf8] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('The math')}</p>
            <h2 className="font-serif text-[clamp(2.2rem,7vw,4.25rem)] font-semibold leading-[0.95] text-[#21140d]">
              {t("Here's what membership actually returns.")}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffaf4] p-6 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c6a22]">{t('Step 1')}</p>
              <p className="mt-3 font-serif text-4xl font-semibold leading-none text-[#21140d]">{EXAMPLE_SPEND}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">
                {t('You spend at participating cafés, restaurants, and shops in a typical month.')}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[#f2c978]/65 bg-[#fff7ea] p-6 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c6a22]">{t('Step 2')}</p>
              <p className="mt-3 font-serif text-4xl font-semibold leading-none text-[#b67718]">{EXAMPLE_RETURN}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5c3718]">
                {t('Returns to your account in rewards, at a 20–100% blended rate set by each business.')}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffaf4] p-6 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c6a22]">{t('After 3 months')}</p>
              <p className="mt-3 font-serif text-4xl font-semibold leading-none text-[#21140d]">{EXAMPLE_THREE_MONTH_NET}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">
                {`${t('Net rewards in your account after')} ${EXAMPLE_THREE_MONTH_DUES} ${t('in membership dues.')}`}
              </p>
            </div>
          </div>

          <p className="text-xs font-medium leading-6 text-[#6f4f3d] sm:text-sm">
            {t('Reward rates vary by business (20–100%). Rewards are credits and perks redeemable in-network, not cash. Example is illustrative based on a 20% blended rate.')}
          </p>
        </div>
      </section>

      {/* vs Punch Cards */}
      <section className="bg-[#fffaf4] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('vs. punch cards')}</p>
            <h2 className="font-serif text-[clamp(2rem,6vw,3.75rem)] font-semibold leading-[0.95] text-[#21140d]">
              {t('A loyalty program that actually adds up.')}
            </h2>
          </div>

          <ul className="divide-y divide-[#d8b98c]/60 overflow-hidden rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffdf8] shadow-soft">
            {punchCardComparison.map((row) => (
              <li key={row.old} className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6 sm:px-8">
                <p className="text-sm font-semibold leading-6 text-[#9c6a22] line-through decoration-[#d8b98c] sm:text-base">
                  {t(row.old)}
                </p>
                <ArrowRight className="hidden size-5 text-[#9c6a22] sm:block" aria-hidden="true" />
                <p className="text-base font-bold leading-6 text-[#21140d] sm:text-lg">
                  {t(row.new)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Founder letter */}
      <section className="bg-[#fffdf8] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#efe6d8] shadow-soft">
            {/* TODO: replace with real founder photo at src/assets/founder-medellin.webp */}
            <div className="flex aspect-[4/5] items-center justify-center bg-[linear-gradient(135deg,#efe6d8,#d8b98c)] text-center text-xs font-bold uppercase tracking-[0.2em] text-[#6f4f3d]">
              {t('Founder photo')}
            </div>
          </div>
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('From the founder')}</p>
            <h2 className="font-serif text-[clamp(2rem,5.5vw,3.5rem)] font-semibold leading-[0.95] text-[#21140d]">
              {t('Hi, I’m [founder name]. I built this because…')}
            </h2>
            <div className="space-y-4 text-base font-semibold leading-7 text-[#6f4f3d] sm:text-lg sm:leading-8">
              <p>
                {t('[Paragraph 1 — who I am, why I’m in Medellín, how long I’ve been here, what I do day-to-day.]')}
              </p>
              <p>
                {t('[Paragraph 2 — the gap I kept noticing: expats overpaying or stuck on the same five places, and great local businesses staying invisible to people who would happily become regulars.]')}
              </p>
              <p>
                {t('[Paragraph 3 — what this program is and isn’t. It is a paid membership that returns real value when you spend in-network. It is not a punch card, not a referral scheme, not a cash-back app.]')}
              </p>
            </div>
            <p className="font-serif text-xl italic text-[#21140d]">
              — [founder name], Medellín
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#fffaf4] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-9">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('How it works')}</p>
            <h2 className="mt-3 font-serif text-[clamp(2.2rem,7vw,4.5rem)] font-semibold leading-[0.95] text-[#21140d]">
              {t('Three steps. No complicated points system to learn.')}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffdf8] p-6 shadow-soft sm:p-7">
                <div className="mb-5 flex items-center justify-between sm:mb-6">
                  <div className="flex size-12 items-center justify-center rounded-[0.75rem] bg-[#f2c978]/28 text-[#5c3718]">
                    <step.icon className="size-6" />
                  </div>
                  <span className="font-serif text-5xl leading-none text-[#b67718]">{index + 1}</span>
                </div>
                <h3 className="font-serif text-2xl leading-snug text-[#21140d] sm:text-3xl">{t(step.title)}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#6f4f3d]">{t(step.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards preview */}
      <section id="rewards" className="bg-[#fffdf8] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-7 sm:space-y-9">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Rewards preview')}</p>
              <h2 className="font-serif text-[clamp(2.2rem,7vw,4.5rem)] font-semibold leading-[0.95] text-[#21140d]">
                {t('What you can already redeem.')}
              </h2>
            </div>
            <p className="max-w-2xl text-base font-semibold leading-7 text-[#6f4f3d] sm:text-lg sm:leading-8">
              {t('Browse current member rewards, gift-card value, and partner offers. Reward actions unlock once your account is verified.')}
            </p>
          </div>

          {rewards.isLoading ? (
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffdf8] p-6 shadow-soft">
                  <Skeleton className="h-14 w-14 rounded-[0.75rem]" />
                  <Skeleton className="mt-7 h-9 w-3/4" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-2/3" />
                  <Skeleton className="mt-6 h-9 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : previewRewards.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {sampleRewardTiles.map((sample) => (
                <div
                  key={sample.title}
                  className="flex min-h-[16.5rem] flex-col rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffdf8] p-6 shadow-soft sm:min-h-[19rem]"
                >
                  <div className="mb-5 flex items-center justify-between gap-4 sm:mb-7">
                    <div className="flex size-12 items-center justify-center rounded-[0.75rem] bg-[#f2c978]/24 text-[#5c3718] sm:size-14">
                      <Gift className="size-6" />
                    </div>
                    <span className="rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6f4f3d]">
                      {t(sample.category)}
                    </span>
                  </div>
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#9c6a22]">
                    {t('Sample — partner roster grows weekly')}
                  </p>
                  <h3 className="font-serif text-2xl leading-snug text-[#21140d] sm:text-3xl">{t(sample.title)}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(sample.description)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {previewRewards.map((reward) => (
                <div key={reward.id} className="flex min-h-[16.5rem] flex-col rounded-[1.25rem] border border-[#d8b98c]/55 bg-[#fffdf8] p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card sm:min-h-[19rem]">
                  <div className="mb-5 flex items-center justify-between gap-4 sm:mb-7">
                    <div className="flex size-12 items-center justify-center rounded-[0.75rem] bg-[#f2c978]/24 text-[#5c3718] sm:size-14">
                      <Gift className="size-6" />
                    </div>
                    <span className="rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6f4f3d]">
                      {t(reward.category)}
                    </span>
                  </div>
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#9c6a22]">{t('Featured member reward')}</p>
                  <h3 className="font-serif text-2xl leading-snug text-[#21140d] sm:text-3xl">{t(reward.title)}</h3>
                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(reward.description)}</p>
                  <p className="mt-auto rounded-full border border-[#d8b98c]/55 bg-[#fffaf4] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#5c3718]">
                    {formatPoints(reward.pointsCost)} {t('points to redeem')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#fffaf4] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <div className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Membership')}</p>
            <h2 className="font-serif text-[clamp(2.2rem,7vw,4.5rem)] font-semibold leading-[0.95] text-[#21140d]">
              {t('One price. One verified account. The whole network.')}
            </h2>
          </div>

          <div className="mx-auto max-w-md rounded-[1.25rem] border border-[#f2c978]/65 bg-[#fffdf8] p-8 shadow-card sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Medellin Rewards membership')}</p>
            <div className="mt-4 flex items-baseline justify-center gap-2">
              <span className="font-serif text-6xl font-semibold leading-none text-[#21140d] sm:text-7xl">{PRICE}</span>
              <span className="text-base font-semibold text-[#6f4f3d]">{PRICE_UNIT}</span>
            </div>
            <ul className="mt-7 space-y-3 text-left">
              {pricingBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#3b2618]">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#b67718]" aria-hidden="true" />
                  <span>{t(bullet)}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-8 h-[3.25rem] w-full rounded-full bg-[#f2c978] text-base font-extrabold text-[#21140d] hover:bg-[#fff7ea]"
            >
              <Link to="/join">
                {`${t('Join for')} ${PRICE}${PRICE_UNIT}`}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <p className="mt-3 text-xs font-semibold text-[#6f4f3d]">
              {t('Cancel anytime. No long-term contract.')}
            </p>
          </div>

          <p className="mx-auto max-w-xl text-sm font-medium leading-6 text-[#6f4f3d]">
            {t('Why we charge — a flat membership keeps the network sustainable and lets partner businesses pay fair reward rates instead of running thin promotional discounts.')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#fffdf8] px-4 py-12 text-[#21140d] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-3 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9c6a22]">{t('Honest answers')}</p>
            <h2 className="font-serif text-[clamp(2.2rem,7vw,4.25rem)] font-semibold leading-[0.95] text-[#21140d]">
              {t('Questions worth asking before you join.')}
            </h2>
          </div>
          <div className="space-y-3">
            {faqEntries.map((entry) => (
              <FaqItem key={entry.question} question={entry.question} answer={entry.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#21140d] px-4 py-12 text-[#fff7ea] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <UsersRound className="mx-auto mb-5 size-10 text-[#f2c978]" />
          <h2 className="font-serif text-[clamp(2.2rem,7vw,4.5rem)] font-semibold leading-[0.95] text-[#fff7ea]">
            {t('Ready to join Medellin Rewards?')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#ead9c2]">
            {t('Create your verified account, activate your membership, and start turning local spending into real reward value across the network.')}
          </p>
          <p className="mx-auto mt-3 font-serif text-lg italic text-[#ead9c2]">
            {t('— [founder name], Medellín')}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#f2c978] text-[#21140d] hover:bg-[#fff7ea]"
            >
              <Link to="/join">{`${t('Join Medellin Rewards')} — ${PRICE}${PRICE_UNIT}`}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-[#f2c978]/45 bg-[#fff4dd]/8 text-[#fff7ea] hover:bg-[#fff4dd]/16 hover:text-[#fff7ea]"
            >
              <Link to="/rewards">{t('Browse Rewards')}</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#ead9c2]/80">
            {t('Cancel anytime · No long-term contract')}
          </p>
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
            className="flex min-h-11 min-w-0 items-center justify-center rounded-full bg-[#f2c978] px-2.5 py-2 text-center text-[0.68rem] font-bold leading-tight text-[#21140d] transition hover:bg-[#fff7ea]"
          >
            {`${t('Join')} — ${PRICE}${PRICE_UNIT}`}
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
        <section className="relative flex h-auto min-h-0 flex-col justify-center overflow-hidden rounded-[1.25rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-8 text-[var(--cream)] shadow-panel md:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[3rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 space-y-6">
            <Badge variant="default" className="w-fit border-[var(--champagne)]/55 bg-[linear-gradient(90deg,var(--cream),var(--champagne))] px-4 py-1.5 text-[var(--espresso)] shadow-soft">
              {t('Medellin Rewards')}
            </Badge>
            <div className="space-y-3">
              <h1 className="font-serif text-[clamp(2.25rem,4.2vw,3.5rem)] font-semibold leading-[0.96] text-[var(--cream)]">
                {t('Sign in to your member account.')}
              </h1>
              <p className="max-w-md text-sm font-medium leading-6 text-[var(--cream)]/82">
                {t('Track your rewards, gift-card value, and member activity in one verified account across the network.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Coins className="size-5 text-[var(--champagne)]" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--champagne)]">
                {t('20–100% back on eligible spending')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
              >
                {t('Back to landing page')}
              </Link>
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

                <div className="relative mx-auto min-h-[25.5rem] max-w-md overflow-hidden rounded-[1.25rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
                  <div className="absolute right-0 top-0 size-24 rounded-bl-[3rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
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

                <div className="relative mx-auto flex min-h-[25.5rem] max-w-md flex-col justify-center overflow-hidden rounded-[1.25rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
                  <div className="absolute right-0 top-0 size-24 rounded-bl-[3rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
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
