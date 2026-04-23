import {
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/admin', label: 'Operations', icon: LayoutDashboard },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-primary-container/20 bg-[#120d0b]/85 px-5 py-7 text-white shadow-[5px_0_24px_rgba(8,5,3,0.45)] backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded border border-primary-container/50 bg-primary-container/10 text-primary-container shadow-[0_0_18px_rgba(244,168,79,0.16)]">
            <ShieldCheck className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-black uppercase tracking-[0.12em] text-primary-container">{t('Admin Portal')}</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              {t('Game Ops')}
            </span>
          </div>
        </div>

        <nav className="mt-14 flex-1 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded px-5 py-3.5 text-xs font-black uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? 'border-r-4 border-primary-container bg-primary-container/10 text-primary-container shadow-[inset_-10px_0_20px_rgba(244,168,79,0.08)]'
                    : 'text-on-surface-variant/70 hover:bg-primary-container/5 hover:text-primary-container'
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
          <Separator className="bg-outline-variant/10" />

          <div className="mt-8 flex items-center gap-4 px-2">
            <Avatar className="size-12 rounded border border-primary-container/40 ring-2 ring-primary-container/10">
              <AvatarFallback className="rounded bg-surface-highest text-primary-container font-semibold">
                {getInitials(profile?.fullName ?? 'AD')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-white">{profile?.fullName}</span>
              <span className="text-xs text-on-surface-variant/70">{t('Operations Lead')}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <LanguagePicker className="mb-2 justify-between rounded border border-primary-container/15 bg-primary-container/5 px-3 py-2 text-on-surface-variant" />
            <Button
              variant="ghost"
              className="justify-start gap-3 text-on-surface-variant transition-all hover:bg-primary-container/10 hover:text-primary-container"
            >
              <Settings className="size-5" />
              {t('Settings')}
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3 text-on-surface-variant transition-all hover:bg-primary-container/10 hover:text-error"
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
