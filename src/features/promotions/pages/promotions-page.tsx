import { Badge } from '@/components/ui/badge'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { usePromotions } from '@/hooks/use-customer-data'

export function PromotionsPage() {
  const promotions = usePromotions()

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8">
        <Badge variant="ritual" className="bg-secondary-container/10 text-secondary-container w-fit">
          Curated Offerings
        </Badge>
        <div className="space-y-4 max-w-3xl">
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-6xl leading-[1.1]">
            Seasonal offers that make every visit feel timely.
          </h1>
          <p className="text-xl leading-relaxed text-on-surface-variant/60 font-medium">
            Promotions stay concise, easy to understand, and visually elevated so the loyalty app feels premium instead of promotional overload.
          </p>
        </div>
      </div>

      <div className="rounded-[3rem] bg-surface-low p-8 md:p-12 border border-outline-variant/10 shadow-ritual">
        <div className="space-y-4 max-w-2xl mb-12">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Current Campaign Focus</span>
          <h2 className="font-serif text-4xl text-primary leading-tight tracking-tight">
            Drive repeat visits without cluttering the member experience.
          </h2>
          <p className="text-lg leading-relaxed text-on-surface-variant/60 font-medium">
            Promotions here are optimized for café flow: quick scan, clear benefit, visible timing, and immediate next action.
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
