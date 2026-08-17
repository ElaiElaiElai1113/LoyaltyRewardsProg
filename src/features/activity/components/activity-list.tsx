import { CircleDollarSign, Gift, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompactRecordList, CompactRecordRow } from '@/components/ui/compact-record-list'
import { EmptyState } from '@/components/ui/empty-state'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { COMPACT_LIST_PAGE_SIZE, usePagination } from '@/hooks/use-pagination'
import { useLanguage } from '@/lib/language'
import { formatDate, formatPoints, formatTime } from '@/lib/utils'
import type { Activity } from '@/types/domain'

interface ActivityListProps {
  items: Activity[]
  emptyActionTo?: string
  emptyActionLabel?: string
  paginationAriaLabel?: string
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

export function ActivityList({ items, emptyActionTo, emptyActionLabel, paginationAriaLabel = 'Activity pagination' }: ActivityListProps) {
  const { t } = useLanguage()
  const pagination = usePagination(items, COMPACT_LIST_PAGE_SIZE)

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
      <CompactRecordList aria-label={t('Recent Activity')}>
        {pagination.pageItems.map((item) => {
          const Icon = getIcon(item.type)
          const activityKind = getActivityKind(item.type)

          return (
            <CompactRecordRow key={item.id} className="group flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary sm:size-10">
                  <Icon className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h3 className="min-w-0 font-serif text-base leading-tight text-primary sm:text-lg">{t(item.title)}</h3>
                    <div className="shrink-0 text-[0.6rem] font-bold uppercase tracking-widest text-on-surface-variant/70 sm:text-right">
                      <p>{formatDate(item.createdAt)}</p>
                      <p className="italic">{formatTime(item.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-1 break-words text-sm font-medium leading-5 text-on-surface-variant/80">{t(item.description)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[0.6rem] tracking-[0.08em]">
                      {t(activityKind)}
                    </Badge>
                    <Badge variant={item.points >= 0 ? 'success' : 'default'} className="rounded-full px-2 py-0.5 text-[0.6rem] tracking-[0.08em]">
                      {item.points >= 0 ? `+${formatPoints(item.points)} ${t('points')}` : `${formatPoints(item.points)} ${t('points')}`}
                    </Badge>
                    {item.status === 'pending' ? (
                      <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[0.6rem] tracking-[0.08em]">
                        {t('Pending')}
                      </Badge>
                    ) : null}
                  </div>
                </div>
            </CompactRecordRow>
          )
        })}
      </CompactRecordList>
      <PaginationControls ariaLabel={paginationAriaLabel} {...pagination} onPageChange={pagination.setPage} />
    </div>
  )
}
