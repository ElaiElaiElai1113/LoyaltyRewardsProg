import { CircleDollarSign, Gift, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useLanguage } from '@/lib/language'
import { formatDate, formatPoints, formatTime } from '@/lib/utils'
import type { Activity } from '@/types/domain'

interface ActivityListProps {
  items: Activity[]
  emptyActionTo?: string
  emptyActionLabel?: string
}

function getIcon(type: Activity['type']) {
  switch (type) {
    case 'earned':
      return CircleDollarSign
    case 'bonus':
      return Sparkles
    case 'adjustment':
      return ShieldCheck
    default:
      return Gift
  }
}

function getActivityKind(type: Activity['type']) {
  switch (type) {
    case 'earned':
      return 'Earned'
    case 'redeemed':
      return 'Redeemed'
    case 'bonus':
      return 'Bonus'
    case 'adjustment':
      return 'Adjusted'
    case 'gift_card_issued':
      return 'Gift card issued'
    case 'gift_card_redeemed':
      return 'Gift card redeemed'
  }
}

export function ActivityList({ items, emptyActionTo, emptyActionLabel }: ActivityListProps) {
  const { t } = useLanguage()

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Gift className="size-8" />}
        title={t('No activity yet')}
        description={t('Points, redemptions, and account activity will appear here.')}
        action={
          emptyActionTo && emptyActionLabel ? (
            <Button asChild>
              <Link to={emptyActionTo}>{t(emptyActionLabel)}</Link>
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = getIcon(item.type)
        const activityKind = getActivityKind(item.type)

        return (
          <div key={item.id} className="group relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between bg-surface-low rounded-2xl transition-all hover:bg-surface-highest/40">
            <div className="flex items-center gap-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-lowest text-primary shadow-sm group-hover:shadow-md transition-all">
                <Icon className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-xl tracking-tight text-primary leading-tight">{t(item.title)}</h3>
                  <Badge variant="outline" className="rounded-full">
                    {t(activityKind)}
                  </Badge>
                  <Badge variant={item.points >= 0 ? 'success' : 'default'} className="rounded-full">
                    {item.points >= 0 ? `+${formatPoints(item.points)} ${t('points')}` : `${formatPoints(item.points)} ${t('points')}`}
                  </Badge>
                  {item.status === 'pending' ? (
                    <Badge variant="secondary" className="rounded-full">
                      {t('Pending')}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-on-surface-variant/80">{t(item.description)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-end gap-1">
              <div className="flex flex-col md:items-end">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">{t('Date')}</span>
                <p className="text-sm font-semibold text-on-surface-variant/70">{formatDate(item.createdAt)}</p>
              </div>
              <p className="hidden text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/65 italic md:block">{formatTime(item.createdAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
