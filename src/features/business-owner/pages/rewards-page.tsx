import { Gift, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { formatPoints } from '@/lib/utils'

export function RewardsPage() {
  const { rewards } = useBusinessOwnerData()

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Rewards</h1>
          <p className="text-lg text-on-surface-variant/85">
            Create and manage rewards your customers can redeem with their points.
          </p>
        </div>
        <Button className="rounded-full h-14 px-8 font-semibold">
          <Gift className="size-5 mr-2" />
          Add Reward
        </Button>
      </div>

      {/* Rewards Grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        {rewards.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-white border border-outline-variant/5 p-16 text-center">
            <Gift className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-primary mb-2">No rewards yet</h3>
            <p className="text-on-surface-variant/70 mb-8">Create your first reward to engage your customers</p>
            <Button className="rounded-full h-12 px-8">
              <Gift className="size-5 mr-2" />
              Create First Reward
            </Button>
          </div>
        ) : (
          rewards.map((reward) => (
            <div
              key={reward.id}
              className="group relative overflow-hidden rounded-[2.5rem] bg-white hover:bg-gradient-to-br hover:from-white hover:to-surface-low transition-all duration-300 border border-outline-variant/5 hover:border-primary/10 shadow-sm hover:shadow-lg p-8"
            >
              <div className="flex flex-col gap-6 h-full">
                <div className="flex justify-between items-start">
                  <Badge variant="accent" className="bg-tertiary/30 text-primary">
                    {reward.category}
                  </Badge>
                  {reward.featured && (
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-secondary">
                      <Sparkles className="size-3" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="space-y-4 grow">
                  <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
                    {reward.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
                    {reward.description}
                  </p>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div className="space-y-1">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                      Cost
                    </span>
                    <p className="font-serif text-3xl tracking-tight text-primary">
                      {formatPoints(reward.pointsCost)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`text-[0.65rem] font-bold uppercase tracking-widest ${
                        reward.inventory < 10 ? 'text-error' : 'text-on-surface-variant/80'
                      }`}
                    >
                      {reward.inventory} left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
