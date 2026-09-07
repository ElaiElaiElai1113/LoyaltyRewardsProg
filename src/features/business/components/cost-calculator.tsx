import { BadgeDollarSign } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTenant } from '@/hooks/use-tenant'
import { formatTenantCurrency } from '@/lib/tenant-commerce'
import { useLanguage } from '@/lib/language'

const DEFAULT_HARD_COST_PERCENT = 25
const DEFAULT_TARGET_REVENUE = 1000
const DEFAULT_REWARDS_PERCENT = 20
const DEFAULT_REWARDS_COMMISSION_PERCENT = 25
const DEFAULT_COMPETITOR_COMMISSION_PERCENT = 25

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

export function CostCalculator() {
  const { program } = useTenant()
  const { t } = useLanguage()
  const [hardCostPercent, setHardCostPercent] = useState(DEFAULT_HARD_COST_PERCENT)
  const [targetRevenue, setTargetRevenue] = useState(DEFAULT_TARGET_REVENUE)
  const [rewardsPercent, setRewardsPercent] = useState(DEFAULT_REWARDS_PERCENT)
  const [rewardsCommissionPercent, setRewardsCommissionPercent] = useState(DEFAULT_REWARDS_COMMISSION_PERCENT)
  const [competitorCommissionPercent, setCompetitorCommissionPercent] = useState(DEFAULT_COMPETITOR_COMMISSION_PERCENT)

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
  const formatCurrency = (value: number) => formatTenantCurrency(value, program)

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="ornate-frame min-w-0 rounded-[2rem] p-4 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
              {t('Food Cost Calculator')}
            </p>
            <h3 className="break-words font-serif text-2xl text-primary sm:text-4xl">
              {t('What does {amount} in customer spend really cost?', { amount: formatCurrency(targetRevenue) })}
            </h3>
            <p className="text-sm leading-6 text-on-surface-variant/80">
              {t("This calculates food cost only: sales times rewards, plus platform rewards, then multiplied by the owner's food cost percentage.")}
            </p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--tenant-accent-soft)] text-primary-container">
            <BadgeDollarSign className="size-6" />
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="grid gap-3">
            <Label htmlFor="hard-cost-percent">{t('Food Cost %')}</Label>
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
            <Label htmlFor="target-revenue">{t('Customer Spend You Want')}</Label>
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
              label: t('Step {number}', { number: 1 }),
              text: t('Customer spends {amount}', { amount: formatCurrency(targetRevenue) }),
            },
            {
              label: t('Step {number}', { number: 2 }),
              text: t('Customer receives {amount} total reward value', { amount: formatCurrency(totalRewardsValue) }),
            },
            {
              label: t('Step {number}', { number: 3 }),
              text: t('Your food cost is {percent}, so your real cost is {amount}', { percent: formatPercent(hardCostPercent), amount: formatCurrency(realFoodCost) }),
            },
          ].map((step) => (
            <div key={step.label} className="flex flex-col gap-2 sm:flex-row sm:gap-4 rounded-[1.2rem] bg-[var(--surface-container-lowest)] p-4 text-[#3a2615]">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6b21]">
                {step.label}
              </span>
              <p className="text-sm font-semibold leading-5 text-[#5e422a]">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-[#d8b56d]/35 bg-[#fff8eb] p-4 sm:p-6 text-[#3a2615] shadow-soft">
          <p className="break-words font-serif text-3xl leading-none sm:text-5xl text-[#c9891f]">
            {t('Real business cost: {amount}', { amount: formatCurrency(realFoodCost) })}
          </p>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#6c5238]">
            {t('Not {amount} cash. Only the food cost of the rewards.', { amount: formatCurrency(totalRewardsValue) })}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c5238]">
            {t('Customers see {rewards} in reward value, but the business only feels {cost} in real cost.', { rewards: formatCurrency(totalRewardsValue), cost: formatCurrency(realFoodCost) })}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
              {t('Customer spend')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-container">
              {formatCurrency(targetRevenue)}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
              {t('Rewards issued')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-container">
              {formatCurrency(rewardsValue)}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
              {t('Additional platform rewards')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-container">
              {formatCurrency(additionalRewardsValue)}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
              {t('Total reward value')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-container">
              {formatCurrency(totalRewardsValue)}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
              {t('Food cost')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-container">
              {formatPercent(hardCostPercent)}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--surface-container-lowest)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/70">
              {t('Real business cost')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-container">
              {formatCurrency(realFoodCost)}
            </p>
          </div>
        </div>
      </div>

      <div className="ornate-frame min-w-0 rounded-[2rem] p-4 sm:p-8">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
            {t('Side-by-side comparison')}
          </p>
          <h3 className="break-words font-serif text-2xl text-primary-container sm:text-3xl">
            {t('Cash commission vs. reward-funded growth')}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-on-surface-variant/80">
            {t('Adjust the assumptions below and show owners the difference between cash leaving the business on every sale and product/service rewards fulfilled at food cost.')}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="grid gap-3">
            <Label htmlFor="rewards-percent">{t('Rewards Offered %')}</Label>
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
            <Label htmlFor="rewards-commission-percent">{t('Extra Rewards for Platform Fee %')}</Label>
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
            <Label htmlFor="competitor-commission-percent">{t('Food Panda / Ads %')}</Label>
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
          <div className="rounded-[1.75rem] border border-[#d19a8a]/40 bg-[#fff6f2] p-4 sm:p-6 text-[#3b2119] shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ab4b31]">
              {t('Cash platform cost')}
            </p>
            <h4 className="mt-3 font-serif text-3xl text-[#7a2f1f]">
              {formatCurrency(competitorCost)}
            </h4>
            <p className="mt-3 text-sm leading-6 text-[#704536]">
              {t('{percent} commission on {amount} means that cash leaves the business immediately.', { percent: formatPercent(competitorCommissionPercent), amount: formatCurrency(targetRevenue) })}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[#d8b56d]/35 bg-[#fffaf0] p-4 sm:p-6 text-[#3a2615] shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b6b21]">
              {t('Reward food cost')}
            </p>
            <h4 className="mt-3 font-serif text-3xl text-[#c9891f]">
              {formatCurrency(realFoodCost)}
            </h4>
            <p className="mt-3 text-sm leading-6 text-[#6c5238]">
              {t('{percent} rewards creates {rewards} in customer value, the platform adds {additional} more rewards, and the business impact is only the {costPercent} food cost.', { percent: formatPercent(rewardsPercent), rewards: formatCurrency(rewardsValue), additional: formatCurrency(additionalRewardsValue), costPercent: formatPercent(hardCostPercent) })}
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#9b6b21]">
              {t('That {cost} includes {rewards} for customer rewards + {additional} for added platform rewards.', { cost: formatCurrency(realFoodCost), rewards: formatCurrency(rewardsFoodCost), additional: formatCurrency(additionalRewardsFoodCost) })}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-[#d8b56d]/35 bg-[#fff8eb] p-4 sm:p-6 text-[#3a2615] shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b6b21]">
            {t('Difference')}
          </p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="break-words font-serif text-3xl leading-none sm:text-5xl text-[#c9891f]">
                {formatCurrency(Math.max(savings, 0))}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6c5238]">
                {t('Saved versus paying a {percent} cash commission channel.', { percent: formatPercent(competitorCommissionPercent) })}
              </p>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#6c5238]">
              {t('Example: {amount} in restaurant spend can cost {commission} on a marketplace, versus about {cost} in real food cost here.', { amount: formatCurrency(targetRevenue), commission: formatCurrency(competitorCost), cost: formatCurrency(realFoodCost) })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
