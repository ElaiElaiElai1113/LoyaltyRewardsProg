import {
  BarChart3,
  BadgeDollarSign,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gift,
  Handshake,
  QrCode,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const outcomes = [
  {
    icon: QrCode,
    title: 'QR signup portals',
    body: 'Put a scannable rewards invite at checkout, tables, events, and partner desks.',
  },
  {
    icon: Handshake,
    title: 'Partner attribution',
    body: 'Give hotels, hostels, concierges, and local partners their own links and QR codes.',
  },
  {
    icon: Gift,
    title: 'Reward credits',
    body: 'Issue simple customer perks that staff can validate in-store with short-lived codes.',
  },
  {
    icon: BarChart3,
    title: 'Owner reporting',
    body: 'Track members, revenue, orders, reward fulfillment, and partner referral performance.',
  },
]

const proofPoints = [
  'Review the presentation before committing',
  'Confirm the reward offer and partner terms',
  'Set up products, rewards, promotions, and staff access',
  'Launch with QR codes, referral links, and in-store validation',
]

const onboardingSteps = [
  {
    icon: FileText,
    title: '1. Watch the presentation',
    body: 'A simple video explains how members earn Rewards, how businesses participate, and what launch support looks like.',
  },
  {
    icon: ClipboardCheck,
    title: '2. Fit check',
    body: 'We confirm your category, reward percentage, hard costs, and the best first offer for members.',
  },
  {
    icon: UserPlus,
    title: '3. Sign up and launch',
    body: 'Your business portal, QR signup links, partner links, and staff redemption flow are prepared for rollout.',
  },
]

const DEFAULT_HARD_COST_PERCENT = 25
const DEFAULT_TARGET_REVENUE = 1000
const DEFAULT_REWARDS_PERCENT = 20
const DEFAULT_REWARDS_COMMISSION_PERCENT = 10
const DEFAULT_COMPETITOR_COMMISSION_PERCENT = 25

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

export function ForBusinessesPage() {
  const [submitted, setSubmitted] = useState(false)
  const [hardCostPercent, setHardCostPercent] = useState(DEFAULT_HARD_COST_PERCENT)
  const [targetRevenue, setTargetRevenue] = useState(DEFAULT_TARGET_REVENUE)
  const [rewardsPercent, setRewardsPercent] = useState(DEFAULT_REWARDS_PERCENT)
  const [rewardsCommissionPercent, setRewardsCommissionPercent] = useState(DEFAULT_REWARDS_COMMISSION_PERCENT)
  const [competitorCommissionPercent, setCompetitorCommissionPercent] = useState(DEFAULT_COMPETITOR_COMMISSION_PERCENT)

  useEffect(() => {
    if (window.location.hash !== '#book-demo') return

    window.requestAnimationFrame(() => {
      document.getElementById('book-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const lead = {
      name: String(formData.get('name') ?? '').trim(),
      businessName: String(formData.get('businessName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      createdAt: new Date().toISOString(),
    }

    window.localStorage.setItem('medellinRewardsDemoLead', JSON.stringify(lead))
    event.currentTarget.reset()
    setSubmitted(true)
  }

  const hardCostRate = hardCostPercent / 100
  const hardCostRewardsRate = DEFAULT_REWARDS_PERCENT / 100
  const hardCostRewardsCommissionRate = DEFAULT_REWARDS_COMMISSION_PERCENT / 100
  const rewardsRate = rewardsPercent / 100
  const rewardsCommissionRate = rewardsCommissionPercent / 100
  const competitorCommissionRate = competitorCommissionPercent / 100

  const hardCostRewardsValue = targetRevenue * hardCostRewardsRate
  const hardCostFulfillmentCost = hardCostRewardsValue * hardCostRate
  const hardCostProgramCommission = hardCostRewardsValue * hardCostRewardsCommissionRate
  const hardCostProgramTotal = hardCostFulfillmentCost + hardCostProgramCommission

  const rewardsValue = targetRevenue * rewardsRate
  const rewardFulfillmentCost = rewardsValue * hardCostRate
  const rewardsProgramCommission = rewardsValue * rewardsCommissionRate
  const totalRewardsProgramCost = rewardFulfillmentCost + rewardsProgramCommission
  const competitorCost = targetRevenue * competitorCommissionRate
  const savings = competitorCost - totalRewardsProgramCost

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="space-y-16 sm:space-y-20">
      <section className="relative z-10 grid min-h-[calc(100vh-9rem)] gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
        <span className="botanical-corner -left-20 top-16 hidden lg:block" />
        <div className="animate-soft-reveal space-y-8">
          <Badge variant="accent" className="w-fit">
            Business onboarding
          </Badge>
          <div className="space-y-6">
            <h1 className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-semibold leading-[0.92] tracking-[0.01em] text-primary-container">
              Join the rewards network members already want to use.
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant/85">
              This private onboarding page gives businesses the presentation, signup path, and launch
              steps for Medellin Rewards. The main website targets members; this page is for owners who
              are ready to understand the model and prepare their offer.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full">
              <a href="#book-demo">Start Onboarding</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/shop">View Member Experience</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full">
              <Link to="/business/login">Business Login</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofPoints.slice(0, 4).map((point) => (
              <div key={point} className="ornate-frame rounded-[1.5rem] px-5 py-4 text-sm font-medium text-on-surface-variant">
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="ornate-frame animate-soft-reveal overflow-hidden rounded-[2.25rem] p-8">
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-primary/12 blur-2xl" />
          <div className="relative mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Launch toolkit</p>
              <h2 className="mt-2 font-serif text-4xl text-primary-container">What we prepare with you</h2>
            </div>
            <ShieldCheck className="size-10 text-primary" />
          </div>
          <div className="relative grid gap-4 sm:grid-cols-2">
            {outcomes.map((item) => (
              <div key={item.title} className="compact-catalog-card p-5 transition-all hover:-translate-y-1 hover:border-primary/35">
                <item.icon className="mb-5 size-7 text-primary" />
                <h3 className="font-serif text-2xl text-primary-container">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 space-y-8">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent" className="w-fit">Onboarding flow</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            A clear path from presentation to live rewards.
          </h2>
          <p className="text-base leading-7 text-on-surface-variant/85">
            Businesses can use this link to understand the program before portal access is created.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {onboardingSteps.map((step) => (
            <div key={step.title} className="ornate-frame rounded-[1.6rem] p-6">
              <div className="luxe-art mb-6 flex size-12 items-center justify-center rounded-[1rem]">
                <step.icon className="size-6" />
              </div>
              <h3 className="font-serif text-3xl leading-none text-primary-container">{step.title}</h3>
              <p className="mt-4 text-sm font-medium leading-6 text-on-surface-variant/80">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit">Owner checklist</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            Everything needed before the business portal goes live.
          </h2>
          <div className="grid gap-3">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-on-surface-variant/85">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-secondary-container" />
                <p className="text-sm font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <form id="book-demo" className="ornate-frame rounded-[2rem] p-8" onSubmit={handleSubmit}>
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary-container)]">Start Onboarding</p>
              <h2 className="mt-2 font-serif text-4xl text-primary">Request the presentation and signup process</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant/75">
                This request is saved on this device for now. No payment or backend lead submission is connected.
              </p>
            </div>
            <CalendarClock className="size-9 text-primary-container" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="demo-name">Your Name</Label>
              <Input id="demo-name" name="name" required placeholder="Alex Rivera" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-business">Business Name</Label>
              <Input id="demo-business" name="businessName" required placeholder="Harbor Roast" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" name="email" type="email" required placeholder="owner@example.com" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-phone">Phone</Label>
              <Input id="demo-phone" name="phone" placeholder="Optional" />
            </div>
            <div className="grid gap-3 sm:col-span-2">
              <Label htmlFor="demo-notes">What should we know before onboarding?</Label>
              <Textarea
                id="demo-notes"
                name="notes"
                placeholder="Business type, expected reward offer, staff needs, partner referrals..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {submitted ? (
              <p className="text-sm font-bold text-success">Onboarding request saved. We can connect this to a lead backend later.</p>
            ) : (
              <p className="text-sm text-on-surface-variant/75">Best for member-friendly businesses with clear repeat purchase or referral potential.</p>
            )}
            <Button type="submit" className="rounded-full">Request Onboarding</Button>
          </div>
        </form>
      </section>

      <section className="relative z-10 space-y-8">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent" className="w-fit">Cost calculator</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            Show how little it costs to win real customer spend.
          </h2>
          <p className="text-base leading-7 text-on-surface-variant/85">
            Use this live calculator in sales conversations to compare Medellin Rewards against
            cash-heavy acquisition channels like Food Panda or paid ads.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="ornate-frame rounded-[2rem] p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                  Hard Cost Calculator
                </p>
                <h3 className="font-serif text-4xl text-primary">
                  What does {formatCurrency(targetRevenue)} in customer spend really cost?
                </h3>
                <p className="text-sm leading-6 text-on-surface-variant/80">
                  Enter the two numbers an owner already knows. This quick version assumes the standard
                  sales example: {formatPercent(DEFAULT_REWARDS_PERCENT)} rewards and{' '}
                  {formatPercent(DEFAULT_REWARDS_COMMISSION_PERCENT)} commission on rewards only.
                </p>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--tenant-accent-soft)] text-primary-container">
                <BadgeDollarSign className="size-6" />
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="hard-cost-percent">Hard Cost %</Label>
                <Input
                  id="hard-cost-percent"
                  inputMode="decimal"
                  value={hardCostPercent}
                  onChange={(event) => {
                    setHardCostPercent(parsePositiveNumber(event.target.value, 0))
                  }}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="target-revenue">Customer Spend You Want</Label>
                <Input
                  id="target-revenue"
                  inputMode="decimal"
                  value={targetRevenue}
                  onChange={(event) => {
                    setTargetRevenue(parsePositiveNumber(event.target.value, 0))
                  }}
                />
              </div>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-[#d8b56d]/35 bg-[#fff8eb] p-6 text-[#3a2615] shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b6b21]">
                Your actual cost through us
              </p>
              <p className="mt-3 font-serif text-5xl leading-none text-[#c9891f]">
                {formatCurrency(hardCostProgramTotal)}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6c5238]">
                To generate {formatCurrency(targetRevenue)} in customer spend, the customer earns
                {` ${formatCurrency(hardCostRewardsValue)} in rewards. `}
                Your hard-cost exposure on fulfilling those rewards is {formatCurrency(hardCostFulfillmentCost)},
                and our commission on those rewards is {formatCurrency(hardCostProgramCommission)}.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Rewards issued
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(hardCostRewardsValue)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Fulfillment hard cost
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(hardCostFulfillmentCost)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Our commission
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(hardCostProgramCommission)}
                </p>
              </div>
            </div>
          </div>

          <div className="ornate-frame rounded-[2rem] p-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                Side-by-side comparison
              </p>
              <h3 className="font-serif text-4xl text-primary-container">
                Cash commission vs. reward-funded growth
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-on-surface-variant/80">
                Adjust the assumptions below and show owners how different it feels to pay a platform
                on every sale versus paying us only on the rewards value. These fields are editable
                scenario assumptions for live sales conversations.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="grid gap-3">
                <Label htmlFor="rewards-percent">Rewards Offered %</Label>
                <Input
                  id="rewards-percent"
                  inputMode="decimal"
                  value={rewardsPercent}
                  onChange={(event) => {
                    setRewardsPercent(parsePositiveNumber(event.target.value, 0))
                  }}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="rewards-commission-percent">Our Commission on Rewards %</Label>
                <Input
                  id="rewards-commission-percent"
                  inputMode="decimal"
                  value={rewardsCommissionPercent}
                  onChange={(event) => {
                    setRewardsCommissionPercent(parsePositiveNumber(event.target.value, 0))
                  }}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="competitor-commission-percent">Food Panda / Ads %</Label>
                <Input
                  id="competitor-commission-percent"
                  inputMode="decimal"
                  value={competitorCommissionPercent}
                  onChange={(event) => {
                    setCompetitorCommissionPercent(parsePositiveNumber(event.target.value, 0))
                  }}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.75rem] border border-[#d19a8a]/40 bg-[#fff6f2] p-6 text-[#3b2119] shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ab4b31]">
                  Other platform
                </p>
                <h4 className="mt-3 font-serif text-3xl text-[#7a2f1f]">
                  {formatCurrency(competitorCost)}
                </h4>
                <p className="mt-3 text-sm leading-6 text-[#704536]">
                  {formatPercent(competitorCommissionPercent)} commission on {formatCurrency(targetRevenue)}
                  means that cash leaves the business immediately.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[#d8b56d]/35 bg-[#fffaf0] p-6 text-[#3a2615] shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b6b21]">
                  Medellin Rewards
                </p>
                <h4 className="mt-3 font-serif text-3xl text-[#c9891f]">
                  {formatCurrency(totalRewardsProgramCost)}
                </h4>
                <p className="mt-3 text-sm leading-6 text-[#6c5238]">
                  {formatPercent(rewardsPercent)} rewards creates {formatCurrency(rewardsValue)} in customer value,
                  and we charge only on that reward amount, not on the full sale.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-[#d8b56d]/35 bg-[#fff8eb] p-6 text-[#3a2615] shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b6b21]">
                Difference
              </p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-serif text-5xl leading-none text-[#c9891f]">
                    {formatCurrency(Math.max(savings, 0))}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6c5238]">
                    Saved versus paying a {formatPercent(competitorCommissionPercent)} cash commission channel.
                  </p>
                </div>
                <p className="max-w-md text-sm leading-6 text-[#6c5238]">
                  Example: {formatCurrency(targetRevenue)} in restaurant spend can cost {formatCurrency(competitorCost)}
                  on a marketplace, versus about {formatCurrency(totalRewardsProgramCost)} here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
