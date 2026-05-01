import {
  Activity,
  CreditCard,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { CustomerBottomNav } from '@/components/customer-bottom-nav'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/rewards', label: 'Rewards', icon: Gift },
  { to: '/gift-cards', label: 'Gift Cards', icon: CreditCard },
  { to: '/membership', label: 'Membership', icon: ShieldCheck },
  { to: '/promotions', label: 'Promotions', icon: Megaphone },
  { to: '/activity', label: 'History', icon: Activity },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()
  const cart = useCart()
  const cartCount = (cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-6">
          <div className="flex items-center gap-12">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <span className="text-xl font-semibold text-brand-gold">
                Medellin Rewards
              </span>
              <span className="hidden h-6 w-px bg-[var(--border)] md:block" />
              <span className="hidden text-xs font-medium text-[var(--muted-foreground)] md:block">
                Rewards Network
              </span>
            </NavLink>

            <nav className="hidden items-center gap-5 lg:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[var(--foreground)]'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Member')}</span>
            </div>

            <div className="flex items-center gap-4">
              <LanguagePicker className="text-[var(--muted-foreground)]" compact />
              <ThemeToggle />
              <NavLink to="/cart" className="relative rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                <ShoppingBag className="size-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded bg-[var(--primary)] text-[0.6rem] font-bold text-[var(--primary-foreground)]">
                    {cartCount}
                  </span>
                )}
              </NavLink>

              <Avatar className="size-10 rounded-lg border border-[var(--border)]">
                <AvatarFallback className="rounded-lg bg-[var(--muted)] font-semibold text-[var(--foreground)]">
                  {getInitials(profile?.fullName ?? 'CC')}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={() => void signOut()}
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--border)] bg-white pb-8 pt-24 md:flex">
        <div className="px-6 pb-8">
          <p className="text-sm font-semibold text-[var(--foreground)]">{t('Network Member')}</p>
          <p className="mt-1 text-xs font-medium text-[var(--muted-foreground)]">{t('Rewards account')}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--muted)] text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`
              }
            >
              <item.icon className="size-5" />
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="w-full flex-1 px-5 py-8 pb-20 md:ml-64 md:w-[calc(100%-16rem)] md:px-8 md:pb-8 lg:px-10">
        <div className="mx-auto w-full max-w-[1280px]">
        <Outlet />
        </div>
      </main>

      <CustomerBottomNav />

      <footer className="border-t border-[var(--border)] bg-white py-12 md:ml-64">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <span className="text-lg font-semibold text-brand-gold">Medellin Rewards</span>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {t('Earn points, redeem rewards, and stay connected across partner businesses.')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Platform')}
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/dashboard" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Dashboard')}</NavLink>
                  <NavLink to="/shop" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Shop')}</NavLink>
                  <NavLink to="/rewards" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Rewards')}</NavLink>
                  <NavLink to="/wallet/gift-cards" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Gift Cards')}</NavLink>
                  <NavLink to="/promotions" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Promotions')}</NavLink>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Company')}
                </span>
                <nav className="flex flex-col gap-2">
                  <span className="text-sm text-[var(--muted-foreground)]">{t('About Us')}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{t('Contact')}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{t('Store Locator')}</span>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Account')}
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/profile" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Settings')}</NavLink>
                  <NavLink to="/orders" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Order History')}</NavLink>
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted-foreground)]">
          </div>
        </div>
      </footer>
    </div>
  )
}
