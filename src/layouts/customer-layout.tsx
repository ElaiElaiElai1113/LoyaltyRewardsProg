import {
  Activity,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rewards', label: 'Catalog', icon: Gift },
  { to: '/promotions', label: 'Promotions', icon: Megaphone },
  { to: '/activity', label: 'History', icon: Activity },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function CustomerLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-12">
            <NavLink to="/dashboard" className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">
                Velvet Brew
              </span>
              <span className="font-serif text-2xl tracking-tight text-primary">
                Loyalty
              </span>
            </NavLink>

            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-ritual'
                        : 'text-on-surface-variant hover:bg-surface-low hover:text-primary'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-semibold text-on-surface">
                {profile?.fullName}
              </span>
              <span className="text-xs text-on-surface-variant/60">
                {profile?.tier} Member
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Avatar className="size-10 border-2 border-surface-highest ring-2 ring-primary/5">
                <AvatarFallback className="bg-surface-low font-medium text-primary">
                  {getInitials(profile?.fullName ?? 'VB')}
                </AvatarFallback>
              </Avatar>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-on-surface-variant hover:bg-surface-low hover:text-primary"
                onClick={() => void signOut()}
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-7xl px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-outline-variant/10 bg-surface-low py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <span className="font-serif text-xl tracking-tight text-primary">
                Velvet Brew
              </span>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant/70">
                An artisanal approach to coffee loyalty. Every sip brings you closer to the ritual.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Platform
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/dashboard" className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors">Dashboard</NavLink>
                  <NavLink to="/rewards" className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors">Rewards</NavLink>
                  <NavLink to="/promotions" className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors">Promotions</NavLink>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Company
                </span>
                <nav className="flex flex-col gap-2">
                  <span className="text-sm text-on-surface-variant/70">About Us</span>
                  <span className="text-sm text-on-surface-variant/70">Contact</span>
                  <span className="text-sm text-on-surface-variant/70">Store Locator</span>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Account
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/profile" className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors">Settings</NavLink>
                  <NavLink to="/activity" className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors">Order History</NavLink>
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-outline-variant/5 pt-8 text-center text-xs text-on-surface-variant/40">
            © 2024 Velvet Brew Artisanal Coffee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
