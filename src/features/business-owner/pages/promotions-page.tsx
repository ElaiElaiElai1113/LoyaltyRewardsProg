import { CalendarDays, Megaphone, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { formatDate } from '@/lib/utils'

export function PromotionsPage() {
  const { promotions } = useBusinessOwnerData()

  const isActive = (expiresAt: string) => new Date(expiresAt) > new Date()

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Promotions</h1>
          <p className="text-lg text-on-surface-variant/85">
            Create and manage promotions to engage and reward your customers.
          </p>
        </div>
        <Button className="rounded-full h-14 px-8 font-semibold">
          <Megaphone className="size-5 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Promotions Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {promotions.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-white border border-outline-variant/5 p-16 text-center">
            <Megaphone className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-primary mb-2">No promotions yet</h3>
            <p className="text-on-surface-variant/70 mb-8">Create your first promotion to drive engagement</p>
            <Button className="rounded-full h-12 px-8">
              <Megaphone className="size-5 mr-2" />
              Create First Promotion
            </Button>
          </div>
        ) : (
          promotions.map((promotion) => {
            const active = isActive(promotion.expiresAt)

            return (
              <div
                key={promotion.id}
                className={`group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br transition-all duration-300 ${
                  active
                    ? 'from-white to-surface-low hover:from-surface-lowest hover:to-surface-low'
                    : 'from-surface-lowest to-surface-low opacity-60'
                } border border-outline-variant/5 hover:border-primary/10 shadow-sm hover:shadow-lg p-8`}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant="accent"
                      className={`${
                        active ? 'bg-secondary-container/30 text-secondary' : 'bg-outline-variant/10'
                      }`}
                    >
                      {promotion.badge}
                    </Badge>
                    <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
                      <CalendarDays className="size-3" />
                      {active ? 'Active' : 'Expired'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
                      {promotion.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium italic">
                      "{promotion.description}"
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-surface-lowest p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary">{promotion.cta}</p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-on-surface-variant/70">
                        {promotion.audience}
                      </p>
                    </div>
                    <div className="size-8 rounded-full bg-surface-low flex items-center justify-center text-primary shadow-sm">
                      <Sparkles className="size-4" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/5 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant/60">
                      Expires: {formatDate(promotion.expiresAt)}
                    </span>
                    {active && (
                      <Button variant="outline" size="sm" className="rounded-full">
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
