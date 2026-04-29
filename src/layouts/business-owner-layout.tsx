import {
  Gift,
  CreditCard,
  Hotel,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useLanguage } from '@/lib/language'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/business/dashboard', label: 'Business Overview', icon: LayoutDashboard },
  { to: '/business/products', label: 'Products', icon: Package },
  { to: '/business/rewards', label: 'Rewards', icon: Gift },
  { to: '/business/gift-cards', label: 'Gift Cards', icon: CreditCard, ownerOnly: true },
  { to: '/business/redemptions', label: 'Redemptions', icon: CreditCard },
  { to: '/business/promotions', label: 'Promotions', icon: Sparkles },
  { to: '/business/members', label: 'Customers', icon: Users },
  { to: '/business/partners', label: 'Partners', icon: Hotel },
  { to: '/business/settings', label: 'Settings', icon: Settings },
]

export function BusinessOwnerLayout() {
  const { profile, signOut } = useAuth()
  const { business, isBusinessLoading, error } = useBusinessOwnerData()
  const { t } = useLanguage()

  if (isBusinessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="absolute right-6 top-6">
          <LanguagePicker className="text-[var(--muted-foreground)]" />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">{t('Loading workspace')}</h1>
          <p className="text-[var(--muted-foreground)]">{t('Fetching your business portal data.')}</p>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'business-owner' && profile?.role !== 'business-staff') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="absolute right-6 top-6">
          <LanguagePicker className="text-[var(--muted-foreground)]" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">{t('Access Denied')}</h1>
          <p className="text-[var(--muted-foreground)]">{t('This area is for business owners only.')}</p>
          <Button onClick={() => (window.location.href = '/dashboard')}>{t('Return Home')}</Button>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="absolute right-6 top-6">
          <LanguagePicker className="text-[var(--muted-foreground)]" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">{t('Business Setup Required')}</h1>
          <p className="text-[var(--muted-foreground)]">
            {error instanceof Error
              ? error.message
              : t('This account does not have a business assigned yet.')}
          </p>
          <Button onClick={() => void signOut()}>{t('Sign out')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--border)] bg-white px-5 py-7">
        {/* Business Logo/Identity */}
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
            <Package className="size-6" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-lg font-semibold text-[var(--foreground)]">{business.name}</span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('Business Overview')}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-14 flex-1 space-y-2">
          {navigation
            .filter((item) => !item.ownerOnly || profile?.role === 'business-owner')
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--muted)] text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 opacity-80 group-hover:opacity-100" />
                {t(item.label)}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="mt-auto">
          <Separator className="bg-[var(--border)]" />

          <div className="mt-8 flex items-center gap-4 px-2">
            <Avatar className="size-12 rounded-lg border border-[var(--border)]">
              <AvatarFallback className="rounded-lg bg-[var(--muted)] text-[var(--foreground)] font-semibold">
                {getInitials(profile?.fullName ?? 'BO')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {profile?.role === 'business-owner' ? t('Business Owner') : 'Business Staff'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <LanguagePicker
              compact
              className="mb-2 w-full justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[var(--muted-foreground)]"
            />
            <Button
              variant="ghost"
              className="h-auto justify-start gap-3 whitespace-normal px-3 py-3 text-left text-sm font-semibold normal-case tracking-normal text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <Settings className="size-5" />
              {t('Account Settings')}
            </Button>
            <Button
              variant="ghost"
              className="h-auto justify-start gap-3 whitespace-normal px-3 py-3 text-left text-sm font-semibold normal-case tracking-normal text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
              onClick={() => void signOut()}
            >
              <LogOut className="size-5" />
              {t('Sign out')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 min-h-screen flex-1">
        <div className="mx-auto w-full max-w-7xl px-10 py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
