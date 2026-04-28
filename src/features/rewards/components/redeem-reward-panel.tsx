import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language'
import { cn, formatPoints } from '@/lib/utils'
import type { Reward } from '@/types/domain'
import { redeemSchema, type RedeemFormValues } from '@/types/forms'

interface RedeemRewardPanelProps {
  reward: Reward
  balancePoints: number
  isSubmitting?: boolean
  onSubmit: (values: RedeemFormValues) => Promise<void> | void
}

export function RedeemRewardPanel({
  reward,
  balancePoints,
  isSubmitting,
  onSubmit,
}: RedeemRewardPanelProps) {
  const { t } = useLanguage()
  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      notes: '',
      pickupWindow: 'Now',
    },
  })

  const canRedeem = balancePoints >= reward.pointsCost

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant="accent" className="bg-primary/5 text-primary border-none">{t(reward.category)}</Badge>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80 italic">
          {reward.inventory} {t('Available')}
        </span>
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-5xl tracking-tight text-primary">
          {t(reward.title)}
        </h2>
        <p className="max-w-2xl text-xl font-medium leading-relaxed text-on-surface-variant/85">
          {t(reward.description)}
        </p>
      </div>

      <div className="grid gap-1 overflow-hidden rounded-[2.5rem] bg-surface-lowest border border-outline-variant/5 shadow-card md:grid-cols-3">
        <div className="p-10 space-y-2 border-b md:border-b-0 md:border-r border-outline-variant/10">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
            {t('Points Cost')}
          </p>
          <p className="font-serif text-4xl text-primary">
            {formatPoints(reward.pointsCost)} {t('points')}
          </p>
        </div>
        <div className="p-10 space-y-2 border-b md:border-b-0 md:border-r border-outline-variant/10">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
            {t('Your Points')}
          </p>
          <p className="font-serif text-4xl text-primary">
            {formatPoints(balancePoints)} {t('points')}
          </p>
        </div>
        <div className="p-10 space-y-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
            {t('Points After')}
          </p>
          <p className={cn(
            "font-serif text-4xl",
            canRedeem ? "text-primary/80" : "text-error/80"
          )}>
            {formatPoints(Math.max(balancePoints - reward.pointsCost, 0))} {t('points')}
          </p>
        </div>
      </div>

      <form
        className="grid gap-12 lg:grid-cols-2 lg:items-end"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values)
        })}
      >
        <div className="space-y-8">
          <div className="grid gap-3">
            <Label htmlFor="pickupWindow">{t('Pickup window')}</Label>
            <Input id="pickupWindow" list="pickup-window-options" {...form.register('pickupWindow')} />
            <datalist id="pickup-window-options">
              <option value="Now" />
              <option value="Within 30 mins" />
              <option value="Later today" />
            </datalist>
            {form.formState.errors.pickupWindow ? (
              <p className="text-xs font-bold text-red-500">{form.formState.errors.pickupWindow.message}</p>
            ) : null}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="notes">{t('Notes')}</Label>
            <Input
              id="notes"
              placeholder={t('Pickup notes, substitutions, or timing...')}
              {...form.register('notes')}
            />
            {form.formState.errors.notes ? (
              <p className="text-xs font-bold text-red-500">{form.formState.errors.notes.message}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full h-16 text-lg font-bold tracking-wide shadow-card"
          disabled={!canRedeem || isSubmitting}
        >
          {isSubmitting
            ? t('Processing...')
            : canRedeem
              ? t('Redeem Now')
              : t('Not Enough Points')}
        </Button>
      </form>
    </div>
  )
}
