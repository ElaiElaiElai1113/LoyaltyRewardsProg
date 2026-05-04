import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { usePromotions } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'

export function PromotionsPage() {
  const promotions = usePromotions()
  const { t } = useLanguage()

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8">
        <Badge variant="accent" className="w-fit bg-secondary-container/15 text-foreground">
          {t('Active Campaigns')}
        </Badge>
        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-5xl leading-[1.1] tracking-tight text-primary md:text-6xl">
            {t('Promotions that turn visits into repeat business.')}
          </h1>
          <p className="text-xl font-medium leading-relaxed text-on-surface-variant/85">
            {t('Browse current offers and earn bonus points on eligible purchases.')}
          </p>
        </div>
      </div>

      <div className="rounded-[3rem] border border-outline-variant/10 bg-surface-low p-8 shadow-card md:p-12">
        <div className="mb-12 max-w-2xl space-y-4">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
            {t('Active Campaigns')}
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-primary">
            {t('Earn more points with participating businesses.')}
          </h2>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            {t('Browse current promotions and take advantage of bonus points and special deals.')}
          </p>
        </div>

        {promotions.isLoading ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : (promotions.data ?? []).length === 0 ? (
          <EmptyState
            title={t('No promotions yet')}
            description={t('Active promotions from participating businesses will appear here.')}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {(promotions.data ?? []).map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
