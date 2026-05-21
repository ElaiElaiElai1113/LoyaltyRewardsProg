import {
  Activity,
  LayoutDashboard,
  CreditCard,
  Gift,
  Hotel,
  LogOut,
  Mail,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/admin/portal', label: 'Operations', icon: LayoutDashboard },
  { to: '/admin/gift-cards', label: 'Gift Cards', icon: CreditCard },
]

const adminPortalSections = [
  { value: 'members', label: 'Members', icon: Users },
  { value: 'catalog', label: 'Rewards', icon: Gift },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'promotions', label: 'Promotions', icon: Sparkles },
  { value: 'partners', label: 'Partners', icon: Hotel },
  { value: 'ambassadors', label: 'Ambassadors', icon: Megaphone },
  { value: 'early-access', label: 'Early Access', icon: Mail },
  { value: 'referrals', label: 'Referrals', icon: TrendingUp },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'commissions', label: 'Commissions', icon: ReceiptText },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const isAdminPortal = location.pathname === '/admin/portal'
  const activeAdminSection = location.hash.replace('#', '') || 'members'

  return (
    <div className="soft-luxe-shell flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-20 flex-col overflow-hidden border-r border-primary/15 bg-card/92 px-3 py-4 shadow-soft backdrop-blur-xl xl:w-72 xl:px-4">
        <div className="flex items-center justify-center gap-3 xl:justify-start">
          <div className="luxe-art flex size-10 items-center justify-center rounded-[0.9rem]">
            <ShieldCheck className="size-5" />
          </div>
          <div className="hidden flex-col xl:flex">
            <span className="text-lg font-semibold text-[var(--foreground)]">{t('Admin Portal')}</span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('Platform Operations')}
            </span>
          </div>
        </div>

        {isAdminPortal ? (
          <nav className="mt-7 flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid content-start gap-1">
              {adminPortalSections.map((item) => (
                <a
                  key={item.value}
                  title={t(item.label)}
                  href={`/admin/portal#${item.value}`}
                  className={`group flex items-center justify-center rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition-colors xl:justify-start ${
                    activeAdminSection === item.value
                      ? 'bg-[var(--muted)] text-[var(--foreground)] shadow-soft'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <item.icon className="size-5 shrink-0 opacity-80 group-hover:opacity-100 xl:mr-3" />
                  <span className="hidden truncate xl:inline">{t(item.label)}</span>
                </a>
              ))}
            </div>
          </nav>
        ) : (
          <nav className="mt-7 grid flex-1 content-start gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                title={t(item.label)}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center justify-center rounded-[0.9rem] px-3 text-sm font-semibold transition-colors xl:justify-between ${
                    isActive
                      ? 'bg-[var(--muted)] py-2 text-[var(--foreground)] shadow-soft'
                      : 'py-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="size-5 opacity-80 group-hover:opacity-100" />
                  <span className="hidden xl:inline">{t(item.label)}</span>
                </div>
              </NavLink>
            ))}
          </nav>
        )}

        <div className="mt-4 shrink-0">
          <Separator className="bg-[var(--border)]" />

          <div className="mt-3 flex items-center justify-center gap-3 px-2 xl:justify-start">
            <Avatar className="size-9 rounded-lg border border-[var(--border)]">
              <AvatarFallback className="rounded-lg bg-[var(--muted)] text-[var(--foreground)] font-semibold">
                {getInitials(profile?.fullName ?? 'AD')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col overflow-hidden xl:flex">
              <span className="truncate text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{t('Operations Lead')}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <LanguagePicker
              compact
              className="hidden w-full justify-between rounded-lg border border-[var(--border)] bg-card px-3 py-2 text-[var(--muted-foreground)] xl:inline-flex"
            />
            <div className="flex flex-col items-center justify-center gap-1 xl:flex-row xl:gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title={t('Settings')}
                aria-label={t('Settings')}
              >
                <Settings className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
                onClick={() => void signOut()}
                title={t('Sign out')}
                aria-label={t('Sign out')}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-20 min-h-screen min-w-0 flex-1 xl:ml-72">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 lg:px-8 xl:px-10 xl:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
