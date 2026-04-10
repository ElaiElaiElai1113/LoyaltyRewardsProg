import {
  Activity,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/admin', label: 'Operations', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Customers', icon: Users },
  { to: '/admin/rewards', label: 'Rewards Management', icon: ShieldCheck },
  { to: '/admin/promotions', label: 'Campaigns', icon: Megaphone },
  { to: '/admin/activity', label: 'System Logs', icon: Activity },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-surface-low">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-outline-variant/10 bg-surface pl-6 pr-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-ritual">
            <ShieldCheck className="size-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl tracking-tight text-primary">
              Admin Portal
            </span>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
              Velvet Brew Operations
            </span>
          </div>
        </div>

        <nav className="mt-12 flex-1 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-ritual'
                    : 'text-on-surface-variant hover:bg-surface-low hover:text-primary'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 opacity-70 group-hover:opacity-100" />
                {item.label}
              </div>
              <ChevronRight className={`size-4 opacity-30 group-hover:opacity-100 transition-transform ${navigation.find(n => n.to === item.to) ? '' : ''}`} />
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <Separator className="bg-outline-variant/10" />
          
          <div className="mt-8 flex items-center gap-4 px-2">
            <Avatar className="size-10 ring-2 ring-primary/5">
              <AvatarFallback className="bg-surface-low text-primary">
                {getInitials(profile?.fullName ?? 'AD')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-on-surface">
                {profile?.fullName}
              </span>
              <span className="text-xs text-on-surface-variant/60">
                Operations Lead
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start gap-3 rounded-2xl text-on-surface-variant transition-all hover:bg-surface-low hover:text-primary"
            >
              <Settings className="size-5" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3 rounded-2xl text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-600"
              onClick={() => void signOut()}
            >
              <LogOut className="size-5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen">
        <div className="mx-auto w-full max-w-7xl px-10 py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
