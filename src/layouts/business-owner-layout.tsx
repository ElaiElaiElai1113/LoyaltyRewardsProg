import {
  Gift,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business/products', label: 'Products', icon: Package },
  { to: '/business/rewards', label: 'Rewards', icon: Gift },
  { to: '/business/promotions', label: 'Promotions', icon: Sparkles },
  { to: '/business/members', label: 'Customers', icon: Users },
  { to: '/business/settings', label: 'Settings', icon: Settings },
]

export function BusinessOwnerLayout() {
  const { profile, signOut } = useAuth()
  const { business, isLoading, error } = useBusinessOwnerData()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl text-primary">Loading workspace</h1>
          <p className="text-on-surface-variant/80">Fetching your business portal data.</p>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'business-owner') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-3xl text-primary">Access Denied</h1>
          <p className="text-on-surface-variant/80">This area is for business owners only.</p>
          <Button onClick={() => (window.location.href = '/dashboard')}>Return Home</Button>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-3xl text-primary">Business Setup Required</h1>
          <p className="text-on-surface-variant/80">
            {error instanceof Error
              ? error.message
              : 'This account does not have a business assigned yet.'}
          </p>
          <Button onClick={() => void signOut()}>Sign out</Button>
        </div>
      </div>
    )
  }

  const businessColors =
    business.slug === 'cafe-cliche'
      ? {
          primary: 'from-[#8B4513] to-[#654321]',
          light: 'from-[#8B4513]/10 to-[#654321]/10',
        }
      : {
          primary: 'from-[#5B2C6F] to-[#4A235A]',
          light: 'from-[#5B2C6F]/10 to-[#4A235A]/10',
        }

  return (
    <div className="flex min-h-screen bg-surface-low">
      <aside className="fixed inset-y-0 left-0 flex w-80 flex-col border-r border-outline-variant/10 bg-gradient-to-b from-surface to-surface-low px-6 py-8">
        {/* Business Logo/Identity */}
        <div className="flex items-center gap-4">
          <div
            className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${businessColors.primary} text-white shadow-lg`}
          >
            <Package className="size-6" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-serif text-xl tracking-tight text-primary">{business.name}</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">
              Business Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-14 flex-1 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-medium transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${businessColors.primary} text-white shadow-md`
                    : 'text-on-surface hover:bg-surface-lowest hover:text-primary hover:shadow-sm'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 opacity-80 group-hover:opacity-100" />
                {item.label}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="mt-auto">
          <Separator className="bg-outline-variant/10" />

          <div className="mt-8 flex items-center gap-4 px-2">
            <Avatar className="size-12 ring-2 ring-primary/10">
              <AvatarFallback
                className={`bg-gradient-to-br ${businessColors.light} text-primary font-semibold`}
              >
                {getInitials(profile?.fullName ?? 'BO')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-on-surface">{profile?.fullName}</span>
              <span className="text-xs text-on-surface-variant/70">Business Owner</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start gap-3 rounded-2xl text-on-surface transition-all hover:bg-surface-lowest hover:text-primary"
            >
              <Settings className="size-5" />
              Account Settings
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3 rounded-2xl text-on-surface transition-all hover:bg-red-50 hover:text-red-600"
              onClick={() => void signOut()}
            >
              <LogOut className="size-5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-80 min-h-screen flex-1">
        <div className="mx-auto w-full max-w-7xl px-10 py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
