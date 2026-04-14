import {
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/admin', label: 'Operations', icon: LayoutDashboard },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-surface-low">
      <aside className="fixed inset-y-0 left-0 flex w-80 flex-col border-r border-outline-variant/10 bg-gradient-to-b from-surface to-surface-low px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#4b3621] text-white shadow-lg">
            <ShieldCheck className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl tracking-tight text-primary">Admin Portal</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">
              Operations
            </span>
          </div>
        </div>

        <nav className="mt-14 flex-1 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-[#4b3621] text-white shadow-md'
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

        <div className="mt-auto">
          <Separator className="bg-outline-variant/10" />

          <div className="mt-8 flex items-center gap-4 px-2">
            <Avatar className="size-12 ring-2 ring-primary/10">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                {getInitials(profile?.fullName ?? 'AD')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-on-surface">{profile?.fullName}</span>
              <span className="text-xs text-on-surface-variant/70">Operations Lead</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start gap-3 rounded-2xl text-on-surface transition-all hover:bg-surface-lowest hover:text-primary"
            >
              <Settings className="size-5" />
              Settings
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

      <main className="ml-80 min-h-screen flex-1">
        <div className="mx-auto w-full max-w-7xl px-10 py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
