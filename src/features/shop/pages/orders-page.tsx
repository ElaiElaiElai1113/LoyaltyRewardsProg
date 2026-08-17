import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompactRecordList, CompactRecordRow } from '@/components/ui/compact-record-list'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useOrders } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { COMPACT_LIST_PAGE_SIZE, usePagination } from '@/hooks/use-pagination'
import { formatCurrency, formatDate } from '@/lib/utils'

export function OrdersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const orders = useOrders(profile?.id)
  const businesses = useBusinesses()
  const pagination = usePagination(orders.data ?? [], COMPACT_LIST_PAGE_SIZE)

  const getBusinessName = (businessId: string) =>
    businesses.data?.find((b) => b.id === businessId)?.name ?? 'Unknown'

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          {t('Order History')}
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Your Orders')}
        </h1>
        <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
          {t('View your past purchases and the points posted from each confirmed order.')}
        </p>
      </div>

      {orders.isLoading ? (
        <div className="space-y-6">
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Loading your order history.')}
          />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (orders.data ?? []).length === 0 ? (
        <EmptyState
          title={t('No orders yet')}
          description={t('Purchases placed from partner businesses will appear here together with their posted points.')}
          action={
            <Button asChild variant="default" size="lg" className="rounded-full">
              <Link to="/shop">{t('Browse businesses')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <CompactRecordList aria-label={t('Your Orders')}>
            {pagination.pageItems.map((order) => (
              <CompactRecordRow key={order.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-primary">{getBusinessName(order.businessId)}</p>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-on-surface-variant/75">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-serif text-lg text-primary">{formatCurrency(order.total)}</p>
                    <Badge variant="accent" className="border-none bg-success/10 text-[0.55rem] text-success">
                      {order.status}
                    </Badge>
                  </div>
                </div>

                <details className="rounded-lg bg-surface-low px-3 py-2 text-sm text-on-surface-variant">
                  <summary className="cursor-pointer font-semibold text-primary">
                    {order.items.length} {t('items')}
                  </summary>
                  <div className="mt-2 space-y-1 border-t border-outline-variant/10 pt-2">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">{t(item.productTitle)} x{item.quantity}</span>
                        <span className="shrink-0">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </details>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-primary">
                    +{order.pointsEarned} {order.pointsStatus === 'pending' ? t('points pending') : t('points posted')}
                  </span>
                  <Badge
                    variant={order.pointsStatus === 'pending' ? 'outline' : 'success'}
                    className="text-[0.55rem]"
                  >
                    {order.pointsStatus === 'pending' ? t('Pending') : t('Posted')}
                  </Badge>
                </div>
              </CompactRecordRow>
            ))}
          </CompactRecordList>
          <PaginationControls ariaLabel="Orders pagination" {...pagination} onPageChange={pagination.setPage} />
        </div>
      )}
    </div>
  )
}
