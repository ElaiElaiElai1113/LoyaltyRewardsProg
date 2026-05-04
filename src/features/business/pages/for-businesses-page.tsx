import { BarChart3, BadgeDollarSign, CalendarClock, Gift, Handshake, QrCode, ShieldCheck } from 'lucide-react'
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
  'Launch a loyalty program without a custom app build',
  'See which partners send paying customers',
  'Reward repeat visits, referrals, and first orders',
  'Manage products, rewards, promotions, and fulfillment in one portal',
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
    <div className="space-y-20 pb-20">
      <section className="grid min-h-[calc(100vh-9rem)] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <Badge variant="accent" className="w-fit">
            Warm-growth loyalty house
          </Badge>
          <div className="space-y-6">
            <h1 className="font-serif text-5xl font-semibold leading-[0.92] tracking-[0.01em] text-primary-container md:text-7xl">
              Turn every visit into a ritual people want to return to.
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant/85">
              Medellin Rewards helps cafes, venues, and local operators create a loyalty experience
              that feels elevated for guests and measurable for owners, from QR signups to reward
              credits and partner referrals.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full">
              <a href="#book-demo">Book Demo</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/shop">View Customer Experience</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofPoints.slice(0, 4).map((point) => (
              <div key={point} className="gold-frame rounded-[1.5rem] px-5 py-4 text-sm font-medium text-on-surface-variant">
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="warm-hero-muted overflow-hidden rounded-[2.25rem] p-8 shadow-panel">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f3c96f]">Business atelier</p>
              <h2 className="mt-2 font-serif text-4xl text-[#ffe8b4]">What owners can shape</h2>
            </div>
            <ShieldCheck className="size-10 text-[#f3c96f]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {outcomes.map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-white/16 bg-[#3a2717]/88 p-5 text-white shadow-soft backdrop-blur transition-all hover:border-[#f3c96f]/35 hover:bg-[#422c19]/94">
                <item.icon className="mb-5 size-7 text-[#f3c96f]" />
                <h3 className="font-serif text-2xl text-[#ffe8b4]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#e9c996]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit">Why owners choose it</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            Make loyalty feel intimate, while keeping the numbers clear.
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

        <form id="book-demo" className="gold-frame rounded-[2rem] p-8" onSubmit={handleSubmit}>
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary-container)]">Book Demo</p>
              <h2 className="mt-2 font-serif text-4xl text-primary">See the business experience</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant/75">
                This demo request is saved on this device for now. No payment or backend lead submission is connected.
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
              <Label htmlFor="demo-notes">What do you want to grow?</Label>
              <Textarea
                id="demo-notes"
                name="notes"
                placeholder="Repeat visits, hotel referrals, QR signup, reward credits..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {submitted ? (
              <p className="text-sm font-bold text-success">Demo request saved. We can connect this to a lead backend later.</p>
            ) : (
              <p className="text-sm text-on-surface-variant/75">Best for cafes, venues, hotels, and partner-led hospitality brands.</p>
            )}
            <Button type="submit" className="rounded-full">Request Demo</Button>
          </div>
        </form>
      </section>

      <section className="space-y-8">
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
          <div className="gold-frame rounded-[2rem] p-8">
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

            <div className="mt-8 rounded-[1.6rem] border border-primary-container/12 bg-[rgb(255_251_245_/_0.74)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                Your actual cost through us
              </p>
              <p className="mt-3 font-serif text-5xl leading-none text-primary">
                {formatCurrency(hardCostProgramTotal)}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant/80">
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

          <div className="gold-wash rounded-[2rem] p-8">
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
              <div className="rounded-[1.75rem] border border-[rgb(191_73_48_/_0.14)] bg-[rgb(255_248_245_/_0.82)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ab4b31]">
                  Other platform
                </p>
                <h4 className="mt-3 font-serif text-3xl text-[#7a2f1f]">
                  {formatCurrency(competitorCost)}
                </h4>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant/80">
                  {formatPercent(competitorCommissionPercent)} commission on {formatCurrency(targetRevenue)}
                  means that cash leaves the business immediately.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-primary-container/14 bg-[rgb(255_252_247_/_0.84)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                  Medellin Rewards
                </p>
                <h4 className="mt-3 font-serif text-3xl text-primary">
                  {formatCurrency(totalRewardsProgramCost)}
                </h4>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant/80">
                  {formatPercent(rewardsPercent)} rewards creates {formatCurrency(rewardsValue)} in customer value,
                  and we charge only on that reward amount, not on the full sale.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-secondary-container/20 bg-[rgb(255_251_243_/_0.78)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                Difference
              </p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-serif text-5xl leading-none text-primary">
                    {formatCurrency(Math.max(savings, 0))}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant/80">
                    Saved versus paying a {formatPercent(competitorCommissionPercent)} cash commission channel.
                  </p>
                </div>
                <p className="max-w-md text-sm leading-6 text-on-surface-variant/80">
                  Example: {formatCurrency(targetRevenue)} in restaurant spend can cost {formatCurrency(competitorCost)}
                  on a marketplace, versus about {formatCurrency(totalRewardsProgramCost)} here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
