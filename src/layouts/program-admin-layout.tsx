import { BarChart3, ClipboardList, LogOut, Settings, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { BrandLogo } from '@/components/brand-logo'
import { ProgramInvitations } from '@/components/program-invitations'
import { ProgramSwitcher } from '@/components/program-switcher'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const links = [
  { to: '/program/settings', label: 'Settings', icon: Settings },
  { to: '/program/team', label: 'Team', icon: Users },
  { to: '/program/reports', label: 'Reports', icon: BarChart3 },
  { to: '/program/billing', label: 'Plan', icon: ClipboardList },
]

export function ProgramAdminLayout() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <BrandLogo markClassName="h-9" textClassName="text-base" />
          <ProgramSwitcher className="ml-auto" />
          <Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onClick={() => void signOut()}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-[var(--muted)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
              <item.icon className="size-4" />{item.label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0"><ProgramInvitations /><Outlet /></main>
      </div>
    </div>
  )
}
