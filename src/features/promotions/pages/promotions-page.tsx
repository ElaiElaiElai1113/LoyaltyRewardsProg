import { Badge } from '@/components/ui/badge'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { usePromotions } from '@/hooks/use-customer-data'

export function PromotionsPage() {
  const promotions = usePromotions()

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8">
        <Badge variant="accent" className="w-fit bg-secondary-container/10 text-secondary-container">
          Current Promotions
        </Badge>
        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-5xl leading-[1.1] tracking-tight text-primary md:text-6xl">
            Promotions that make every visit count.
          </h1>
          <p className="text-xl font-medium leading-relaxed text-on-surface-variant/85">
            Check out the latest offers and earn bonus rewards on your purchases.
          </p>
        </div>
      </div>

      <div className="rounded-[3rem] border border-outline-variant/10 bg-surface-low p-8 shadow-card md:p-12">
        <div className="mb-12 max-w-2xl space-y-4">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
            Active Offers
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-primary">
            Earn more with every visit.
          </h2>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            Browse current promotions and take advantage of bonus points and special deals.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {(promotions.data ?? []).map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </div>
    </div>
  )
}
