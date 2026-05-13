import {
  LogOut,
  ShoppingBag,
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

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/reward-terms', label: 'Reward Terms' },
  { to: '/verification-policy', label: 'Verification Policy' },
]

export function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()
  const cart = useCart()
  const cartCount = (cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-5 md:px-6 2xl:px-10">
          <div className="flex items-center gap-12">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <span className="text-xl font-semibold text-[var(--foreground)]">
                Medellin Rewards
              </span>
              <span className="hidden h-6 w-px bg-[var(--border)] md:block" />
              <span className="hidden text-xs font-medium text-[var(--muted-foreground)] md:block">
                Home
              </span>
            </NavLink>
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

      <main className="w-full flex-1 px-5 py-8 pb-20 md:px-8 md:pb-8 lg:px-10 2xl:px-12">
        <div className="mx-auto w-full">
        <Outlet />
        </div>
      </main>

      <CustomerBottomNav />

      <footer className="border-t border-[var(--border)] bg-card py-12">
        <div className="mx-auto w-full px-6 2xl:px-10">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <span className="text-lg font-semibold text-[var(--foreground)]">Medellin Rewards</span>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {t('Earn points, redeem rewards, and stay connected across partner businesses.')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:grid-cols-4">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Platform')}
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/shop" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Menu')}</NavLink>
                  <NavLink to="/rewards" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Rewards')}</NavLink>
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
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Legal')}
                </span>
                <nav className="flex flex-col gap-2">
                  {legalLinks.map((link) => (
                    <NavLink key={link.to} to={link.to} className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                      {t(link.label)}
                    </NavLink>
                  ))}
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
