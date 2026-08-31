import {
  BadgePercent,
  ChartNoAxesCombined,
  CircleUserRound,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ReceiptText,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router'

import { ThemeToggle } from '@/components/theme-toggle'
import { LoyalityMark } from '@/features/loyality/components/loyality-mark'
import '@/features/loyality/loyality-app.css'
import { canAccessBusinessPath } from '@/lib/business-role-policy'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/domain'

type ShellProps = {
  profile: Profile | null
  signOut: () => Promise<void>
}

type RailItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const customerLinks: RailItem[] = [
  { to: '/dashboard', label: 'My loop', icon: LayoutDashboard },
  { to: '/promotions', label: 'Offers', icon: BadgePercent },
  { to: '/profile', label: 'My QR', icon: QrCode },
  { to: '/activity', label: 'Visits', icon: History },
]

const businessLinks: RailItem[] = [
  { to: '/business/dashboard', label: 'Overview', icon: ChartNoAxesCombined },
  { to: '/business/members', label: 'Customers', icon: UsersRound },
  { to: '/business/growth', label: 'Offers & rewards', icon: BadgePercent },
  { to: '/business/redemptions', label: 'Redemptions', icon: ReceiptText },
  { to: '/business/settings', label: 'Business setup', icon: Settings },
]

const adminLinks: RailItem[] = [
  { to: '/admin/portal', label: 'Operations', icon: ShieldCheck },
  { to: '/admin/programs', label: 'Programs', icon: LayoutDashboard },
]

function LoyalityWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <NavLink className={`ly-wordmark${inverse ? ' ly-wordmark--inverse' : ''}`} to="/">
      <span className="ly-wordmark__mark"><LoyalityMark /></span>
      <span><strong>Loyality</strong><small>One business. One loyalty loop.</small></span>
    </NavLink>
  )
}

function UserChip({ profile, inverse = false }: { profile: Profile | null; inverse?: boolean }) {
  return (
    <div className={`ly-user-chip${inverse ? ' ly-user-chip--inverse' : ''}`}>
      <span>{getInitials(profile?.fullName ?? 'LY')}</span>
      <div><strong>{profile?.fullName ?? 'Loyality user'}</strong><small>{profile?.email ?? ''}</small></div>
    </div>
  )
}

export function LoyalityCustomerShell({ profile, signOut }: ShellProps) {
  return (
    <div className="ly-shell ly-shell--customer" data-customer={profile?.id ?? 'guest'}>
      <header className="ly-customer-header">
        <LoyalityWordmark />
        <nav className="ly-customer-nav" aria-label="Customer navigation">
          {customerLinks.map((item) => <ShellLink item={item} key={item.to} />)}
        </nav>
        <div className="ly-customer-tools">
          <ThemeToggle />
          <button className="ly-icon-button" onClick={() => void signOut()} type="button" aria-label="Sign out"><LogOut /></button>
        </div>
      </header>

      <main className="ly-customer-main">
        <div className="ly-page-frame"><Outlet /></div>
      </main>

      <nav className="ly-mobile-dock" aria-label="Customer mobile navigation">
        {customerLinks.map((item) => <ShellLink item={item} key={item.to} compact />)}
      </nav>

      <footer className="ly-customer-footer">
        <LoyalityWordmark />
        <p>Every scan moves your relationship with this business forward.</p>
        <div><NavLink to="/privacy">Privacy</NavLink><NavLink to="/terms">Terms</NavLink></div>
      </footer>
    </div>
  )
}

type WorkspaceShellProps = ShellProps & {
  businessName?: string
  kind: 'business' | 'admin'
}

export function LoyalityWorkspaceShell({ profile, signOut, businessName, kind }: WorkspaceShellProps) {
  const [open, setOpen] = useState(false)
  const isAdmin = kind === 'admin'
  const links = isAdmin
    ? adminLinks
    : businessLinks.filter((item) => canAccessBusinessPath(profile?.role, item.to))
  const workspaceName = isAdmin ? 'Loyality control room' : (businessName ?? 'Business workspace')

  return (
    <div className={`ly-shell ly-workspace ly-workspace--${kind}`}>
      <header className="ly-workspace-mobile-header">
        <button className="ly-icon-button" onClick={() => setOpen(true)} type="button" aria-label="Open navigation"><Menu /></button>
        <strong>{workspaceName}</strong>
        <span className="ly-mobile-role">{isAdmin ? 'Admin' : 'Business'}</span>
      </header>

      {open ? <button className="ly-rail-scrim" onClick={() => setOpen(false)} type="button" aria-label="Close navigation" /> : null}

      <aside className={`ly-rail${open ? ' ly-rail--open' : ''}`}>
        <div className="ly-rail__top">
          <LoyalityWordmark inverse />
          <button className="ly-rail__close" onClick={() => setOpen(false)} type="button" aria-label="Close navigation"><X /></button>
        </div>
        <div className="ly-rail__identity">
          <span>{isAdmin ? <ShieldCheck /> : <CircleUserRound />}</span>
          <p>{isAdmin ? 'Platform operations' : 'Private program'}</p>
          <h1>{workspaceName}</h1>
        </div>
        <nav className="ly-rail__nav" aria-label={`${isAdmin ? 'Admin' : 'Business'} navigation`}>
          {links.map((item) => <ShellLink item={item} key={item.to} onClick={() => setOpen(false)} />)}
        </nav>
        <div className="ly-rail__footer">
          <UserChip profile={profile} inverse />
          <div className="ly-rail__utilities">
            <ThemeToggle />
            <button onClick={() => void signOut()} type="button"><LogOut /> Sign out</button>
          </div>
        </div>
      </aside>

      <main className="ly-workspace-main">
        <div className="ly-workspace-kicker"><span /> {isAdmin ? 'Loyality platform administration' : 'Customer growth workspace'}</div>
        <div className="ly-page-frame"><Outlet /></div>
      </main>
    </div>
  )
}

function ShellLink({ item, compact = false, onClick }: { item: RailItem; compact?: boolean; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      className={({ isActive }) => `ly-shell-link${isActive ? ' ly-shell-link--active' : ''}${compact ? ' ly-shell-link--compact' : ''}`}
      end={item.to.endsWith('dashboard') || item.to.endsWith('portal')}
      onClick={onClick}
      to={item.to}
    >
      <Icon className="ly-shell-link__icon" />
      <span>{item.label}</span>
    </NavLink>
  )
}
