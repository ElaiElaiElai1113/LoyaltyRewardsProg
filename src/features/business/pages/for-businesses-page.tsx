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
const DEFAULT_REWARDS_COMMISSION_PERCENT = 25
const DEFAULT_COMPETITOR_COMMISSION_PERCENT = 25

function formatCurrency(value: number) {
  const hasCents = Math.abs(value % 1) > 0.001

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
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

  const foodCostRate = hardCostPercent / 100
  const rewardsRate = rewardsPercent / 100
  const rewardsCommissionRate = rewardsCommissionPercent / 100
  const competitorCommissionRate = competitorCommissionPercent / 100

  const rewardsValue = targetRevenue * rewardsRate
  const additionalRewardsValue = rewardsValue * rewardsCommissionRate
  const totalRewardsValue = rewardsValue + additionalRewardsValue
  const rewardsFoodCost = rewardsValue * foodCostRate
  const additionalRewardsFoodCost = additionalRewardsValue * foodCostRate
  const realFoodCost = totalRewardsValue * foodCostRate
  const competitorCost = targetRevenue * competitorCommissionRate
  const savings = competitorCost - realFoodCost

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
            Show the real food cost behind reward-funded growth.
          </h2>
          <p className="text-base leading-7 text-on-surface-variant/85">
            Rewards are product and service value, not cash payouts. Use this live calculator to show
            the actual food cost impact and keep cash-heavy channels like Food Panda or paid ads in context.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="ornate-frame rounded-[2rem] p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                  Food Cost Calculator
                </p>
                <h3 className="font-serif text-4xl text-primary">
                  What does {formatCurrency(targetRevenue)} in customer spend really cost?
                </h3>
                <p className="text-sm leading-6 text-on-surface-variant/80">
                  This calculates food cost only: sales times rewards, plus platform rewards, then
                  multiplied by the owner&apos;s food cost percentage.
                </p>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--tenant-accent-soft)] text-primary-container">
                <BadgeDollarSign className="size-6" />
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="hard-cost-percent">Food Cost %</Label>
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

            <div className="mt-8 grid gap-3">
              {[
                {
                  label: 'Step 1',
                  text: `Customer spends ${formatCurrency(targetRevenue)}`,
                },
                {
                  label: 'Step 2',
                  text: `Customer receives ${formatCurrency(totalRewardsValue)} total reward value`,
                },
                {
                  label: 'Step 3',
                  text: `Your food cost is ${formatPercent(hardCostPercent)}, so your real cost is ${formatCurrency(realFoodCost)}`,
                },
              ].map((step) => (
                <div key={step.label} className="flex gap-4 rounded-[1.2rem] bg-[var(--surface-container-lowest)] p-4 text-[#3a2615]">
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6b21]">
                    {step.label}
                  </span>
                  <p className="text-sm font-semibold leading-5 text-[#5e422a]">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-[#d8b56d]/35 bg-[#fff8eb] p-6 text-[#3a2615] shadow-soft">
              <p className="font-serif text-5xl leading-none text-[#c9891f]">
                Real business cost: {formatCurrency(realFoodCost)}
              </p>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#6c5238]">
                Not {formatCurrency(totalRewardsValue)} cash. Only the food cost of the rewards.
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c5238]">
                Customers see {formatCurrency(totalRewardsValue)} in reward value, but the business only
                feels {formatCurrency(realFoodCost)} in real cost.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Customer spend
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(targetRevenue)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Rewards issued
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(rewardsValue)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Additional platform rewards
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(additionalRewardsValue)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Total reward value
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(totalRewardsValue)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Food cost
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatPercent(hardCostPercent)}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  Real business cost
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary-container">
                  {formatCurrency(realFoodCost)}
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
                Adjust the assumptions below and show owners the difference between cash leaving the
                business on every sale and product/service rewards fulfilled at food cost.
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
                <Label htmlFor="rewards-commission-percent">Extra Rewards for Platform Fee %</Label>
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
                  Cash platform cost
                </p>
                <h4 className="mt-3 font-serif text-3xl text-[#7a2f1f]">
                  {formatCurrency(competitorCost)}
                </h4>
                <p className="mt-3 text-sm leading-6 text-[#704536]">
                  {formatPercent(competitorCommissionPercent)} commission on {formatCurrency(targetRevenue)} means that
                  cash leaves the business immediately.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[#d8b56d]/35 bg-[#fffaf0] p-6 text-[#3a2615] shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b6b21]">
                  Reward food cost
                </p>
                <h4 className="mt-3 font-serif text-3xl text-[#c9891f]">
                  {formatCurrency(realFoodCost)}
                </h4>
                <p className="mt-3 text-sm leading-6 text-[#6c5238]">
                  {formatPercent(rewardsPercent)} rewards creates {formatCurrency(rewardsValue)} in customer value,
                  the platform adds {formatCurrency(additionalRewardsValue)} more rewards, and the
                  business impact is only the {formatPercent(hardCostPercent)} food cost.
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#9b6b21]">
                  That {formatCurrency(realFoodCost)} includes {formatCurrency(rewardsFoodCost)} for customer rewards
                  {' '}+ {formatCurrency(additionalRewardsFoodCost)} for added platform rewards.
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
                  on a marketplace, versus about {formatCurrency(realFoodCost)} in real food cost here.
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
