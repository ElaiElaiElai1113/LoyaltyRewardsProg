import {
  ArrowUpRight,
  Gift,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { BusinessMetricCard } from '@/components/business-metric-card'
import { Button } from '@/components/ui/button'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useFulfillRedemption } from '@/hooks/use-admin-data'
import { formatCurrency, formatPoints } from '@/lib/utils'

export function BusinessDashboardPage() {
  const { business, metrics, products, rewards, promotions, redemptions } = useBusinessOwnerData()
  const { profile } = useAuth()
  const fulfillRedemption = useFulfillRedemption(profile)

  if (!metrics) {
    return <div className="text-center py-20 text-on-surface-variant/60">Loading...</div>
  }

  const businessColors =
    business?.slug === 'cafe-cliche'
      ? { primary: 'from-[#8B4513] to-[#654321]', light: 'from-[#8B4513]/10 to-[#654321]/10' }
      : { primary: 'from-[#5B2C6F] to-[#4A235A]', light: 'from-[#5B2C6F]/10 to-[#4A235A]/10' }

  return (
    <div className="space-y-16">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-[#4b3621] to-[#33210d] px-8 py-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <h1 className="font-serif text-4xl tracking-tight text-white md:text-6xl leading-[1.1]">
            Welcome back, {business?.name}
          </h1>
          <p className="mt-4 text-lg text-white/80 font-medium">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessMetricCard
          title="Total Members"
          value={metrics.totalMembers.toString()}
          icon={<Users className="size-6" />}
          trend="+12%"
          trendUp
        />
        <BusinessMetricCard
          title="Total Orders"
          value={metrics.totalOrders.toString()}
          icon={<ShoppingBag className="size-6" />}
          trend="+8%"
          trendUp
        />
        <BusinessMetricCard
          title="Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={<TrendingUp className="size-6" />}
          trend="+15%"
          trendUp
        />
        <BusinessMetricCard
          title="Active Promotions"
          value={metrics.activePromotions.toString()}
          icon={<Sparkles className="size-6" />}
        />
      </div>

      {/* Points Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-primary">Points Issued</h3>
              <p className="text-sm text-on-surface-variant/70">Total points awarded to customers</p>
            </div>
            <div className="size-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="size-6" />
            </div>
          </div>
          <p className="font-serif text-5xl tracking-tight text-primary">{formatPoints(metrics.pointsIssued)}</p>
        </div>

        <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-primary">Points Redeemed</h3>
              <p className="text-sm text-on-surface-variant/70">Total points used for rewards</p>
            </div>
            <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Gift className="size-6" />
            </div>
          </div>
          <p className="font-serif text-5xl tracking-tight text-primary">{formatPoints(metrics.pointsRedeemed)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-serif text-2xl text-primary mb-6">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/business/products"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Products</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{products.length}</p>
              </div>
              <Package className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/rewards"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Rewards</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{rewards.length}</p>
              </div>
              <Gift className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/promotions"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Promotions</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{promotions.length}</p>
              </div>
              <Sparkles className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/settings"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Settings</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">Manage</p>
              </div>
              <ArrowUpRight className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Redemptions Fulfillment */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-primary">Recent Redemptions</h2>
            <p className="text-sm text-on-surface-variant/70">Manage and fulfill pending rewards</p>
          </div>
          <Link to="/business/rewards" className="text-sm font-semibold text-primary hover:underline">
            Manage Rewards
          </Link>
        </div>

        <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm divide-y divide-outline-variant/10 overflow-hidden">
          {redemptions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-on-surface-variant/60 font-medium">No redemptions yet.</p>
            </div>
          ) : (
            redemptions.slice(0, 5).map((redemption: any) => (
              <div key={redemption.id} className="p-6 flex items-center justify-between group hover:bg-surface-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Gift className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{redemption.rewardTitle}</h4>
                    <p className="text-xs text-on-surface-variant/70">
                      Redeemed {new Date(redemption.redeemedAt).toLocaleDateString()} at {new Date(redemption.redeemedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest ${
                    redemption.status === 'ready' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {redemption.status}
                  </div>
                  
                  {redemption.status === 'ready' && (
                    <Button 
                      size="sm" 
                      className="rounded-full h-8 px-4 text-xs font-bold"
                      onClick={() => fulfillRedemption.mutate(redemption.id)}
                      disabled={fulfillRedemption.isPending}
                    >
                      {fulfillRedemption.isPending ? '...' : 'Fulfill'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
