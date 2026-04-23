import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useOrders } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency, formatDate } from '@/lib/utils'

export function OrdersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const orders = useOrders(profile?.id)
  const businesses = useBusinesses()

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
          {t('View your past purchases and XP earned.')}
        </p>
      </div>

      {(orders.data ?? []).length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <p className="text-on-surface-variant/60 font-medium text-lg">{t('No orders yet.')}</p>
          <Button asChild variant="default" size="lg" className="rounded-full">
            <Link to="/shop">{t('Start Shopping')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {(orders.data ?? []).map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-surface-low p-6 border border-outline-variant/5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-serif text-xl text-primary">{getBusinessName(order.businessId)}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-2xl text-primary">{formatCurrency(order.total)}</p>
                  <Badge variant="accent" className="bg-success/10 text-success border-none text-[0.55rem]">
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-outline-variant/5 pt-3 space-y-1">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm text-on-surface-variant">
                    <span>{t(item.productTitle)} x{item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-outline-variant/5 pt-3">
                <span className="text-sm font-bold text-primary">+{order.pointsEarned} {t('XP earned')}</span>
                <Badge
                  variant={order.pointsStatus === 'pending' ? 'outline' : 'success'}
                  className="text-[0.55rem]"
                >
                  {order.pointsStatus === 'pending' ? t('Processing') : t('Posted')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
