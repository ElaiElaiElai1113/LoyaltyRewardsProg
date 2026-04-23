import {
  Activity,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/hooks/use-customer-data'
import { getInitials } from '@/lib/utils'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/rewards', label: 'Vault', icon: Gift },
  { to: '/promotions', label: 'Promotions', icon: Megaphone },
  { to: '/activity', label: 'History', icon: Activity },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const cart = useCart()
  const cartCount = (cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex min-h-screen flex-col bg-transparent md:pl-64">
      <header className="sticky top-0 z-50 border-b border-primary-container/25 bg-[#120d0b]/82 text-white shadow-[0_0_20px_rgba(8,5,3,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-6">
          <div className="flex items-center gap-12">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <span className="font-serif text-2xl font-black italic uppercase tracking-[0.2em] text-primary-container">
                Synergize
              </span>
              <span className="hidden h-6 w-px bg-primary-container/25 md:block" />
              <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant md:block">
                Quest Rewards
              </span>
            </NavLink>

            <nav className="hidden items-center gap-5 lg:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                      isActive
                        ? 'text-primary-container drop-shadow-[0_0_8px_rgba(244,168,79,0.7)]'
                        : 'text-on-surface-variant/70 hover:text-primary-container'
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
              <span className="text-sm font-semibold uppercase tracking-[0.08em] text-white">{profile?.fullName}</span>
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-secondary-container">Player</span>
            </div>

            <div className="flex items-center gap-4">
              <NavLink to="/cart" className="relative rounded p-2 text-on-surface-variant transition-all hover:bg-primary-container/10 hover:text-primary-container">
                <ShoppingBag className="size-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded bg-secondary-container text-[0.6rem] font-bold text-[#241a00]">
                    {cartCount}
                  </span>
                )}
              </NavLink>

              <Avatar className="size-10 rounded border border-primary-container/50 ring-2 ring-primary-container/10">
                <AvatarFallback className="rounded bg-surface-highest font-black text-primary-container">
                  {getInitials(profile?.fullName ?? 'CC')}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="icon"
                className="text-on-surface-variant hover:bg-primary-container/10 hover:text-primary-container"
                onClick={() => void signOut()}
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-primary-container/20 bg-[#120d0b]/82 py-8 text-white shadow-[5px_0_24px_rgba(8,5,3,0.45)] backdrop-blur-2xl md:flex">
        <div className="px-6 pb-8">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary-container">Rank: Legendary</p>
          <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">LVL 99 Elite</p>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] transition-all ${
                  isActive
                    ? 'border-r-4 border-primary-container bg-primary-container/10 text-primary-container shadow-[inset_-10px_0_20px_rgba(244,168,79,0.08)]'
                    : 'text-on-surface-variant/65 hover:bg-primary-container/5 hover:text-primary-container'
                }`
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-8 md:px-8 lg:px-10">
        <Outlet />
      </main>

      <footer className="border-t border-primary-container/15 bg-[#120d0b]/70 py-12 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <span className="font-serif text-xl font-black uppercase tracking-[0.16em] text-primary-container">Synergize Quest</span>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant/80">
                Earn XP, complete quests, and unlock rewards across partner realms.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-container/90">
                  Platform
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/dashboard" className="text-sm text-on-surface-variant/80 transition-colors hover:text-primary-container">Dashboard</NavLink>
                  <NavLink to="/shop" className="text-sm text-on-surface-variant/80 transition-colors hover:text-primary-container">Shop</NavLink>
                  <NavLink to="/rewards" className="text-sm text-on-surface-variant/80 transition-colors hover:text-primary-container">Vault</NavLink>
                  <NavLink to="/promotions" className="text-sm text-on-surface-variant/80 transition-colors hover:text-primary-container">Promotions</NavLink>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-container/90">
                  Company
                </span>
                <nav className="flex flex-col gap-2">
                  <span className="text-sm text-on-surface-variant/80">About Us</span>
                  <span className="text-sm text-on-surface-variant/80">Contact</span>
                  <span className="text-sm text-on-surface-variant/80">Store Locator</span>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-container/90">
                  Account
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/profile" className="text-sm text-on-surface-variant/80 transition-colors hover:text-primary-container">Settings</NavLink>
                  <NavLink to="/orders" className="text-sm text-on-surface-variant/80 transition-colors hover:text-primary-container">Order History</NavLink>
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-outline-variant/10 pt-8 text-center text-xs text-on-surface-variant/70">
            Copyright 2024 Synergize Business Group. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
