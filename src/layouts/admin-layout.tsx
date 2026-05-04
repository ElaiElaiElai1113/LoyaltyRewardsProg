import {
  LayoutDashboard,
  CreditCard,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

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

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--border)] bg-card px-5 py-7">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
            <ShieldCheck className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-[var(--foreground)]">{t('Admin Portal')}</span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('Platform Operations')}
            </span>
          </div>
        </div>

        <nav className="mt-14 flex-1 space-y-2">
          {navigation.map((item) => (
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

        <div className="mt-auto">
          <Separator className="bg-[var(--border)]" />

          <div className="mt-8 flex items-center gap-4 px-2">
            <Avatar className="size-12 rounded-lg border border-[var(--border)]">
              <AvatarFallback className="rounded-lg bg-[var(--muted)] text-[var(--foreground)] font-semibold">
                {getInitials(profile?.fullName ?? 'AD')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{t('Operations Lead')}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <LanguagePicker
              compact
              className="mb-2 w-full justify-between rounded-lg border border-[var(--border)] bg-card px-3 py-2 text-[var(--muted-foreground)]"
            />
            <ThemeToggle />
            <Button
              variant="ghost"
              className="h-auto justify-start gap-3 whitespace-normal px-3 py-3 text-left text-sm font-semibold normal-case tracking-normal text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <Settings className="size-5" />
              {t('Settings')}
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

      <main className="ml-72 min-h-screen flex-1">
        <div className="mx-auto w-full max-w-7xl px-10 py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
