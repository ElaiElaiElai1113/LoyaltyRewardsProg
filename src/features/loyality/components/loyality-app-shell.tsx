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

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { LoyalityMark } from '@/features/loyality/components/loyality-mark'
import '@/features/loyality/loyality-app.css'
import { canAccessBusinessPath } from '@/lib/business-role-policy'
import { useLanguage } from '@/lib/language'
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
  const { t } = useLanguage()
  return (
    <NavLink className={`ly-wordmark${inverse ? ' ly-wordmark--inverse' : ''}`} to="/">
      <span className="ly-wordmark__mark"><LoyalityMark /></span>
      <span><strong>Loyality</strong><small>{t('One business. One loyalty loop.')}</small></span>
    </NavLink>
  )
}

function UserChip({ profile, inverse = false }: { profile: Profile | null; inverse?: boolean }) {
  const { t } = useLanguage()
  return (
    <div className={`ly-user-chip${inverse ? ' ly-user-chip--inverse' : ''}`}>
      <span>{getInitials(profile?.fullName ?? 'LY')}</span>
      <div><strong>{profile?.fullName ?? t('Loyality user')}</strong><small>{profile?.email ?? ''}</small></div>
    </div>
  )
}

export function LoyalityCustomerShell({ profile, signOut }: ShellProps) {
  const { t } = useLanguage()
  return (
    <div className="ly-shell ly-shell--customer" data-customer={profile?.id ?? 'guest'}>
      <header className="ly-customer-header">
        <LoyalityWordmark />
        <nav className="ly-customer-nav" aria-label={t('Customer navigation')}>
          {customerLinks.map((item) => <ShellLink item={item} key={item.to} />)}
        </nav>
        <div className="ly-customer-tools">
          <LanguagePicker className="ly-shell-language" compact condenseOnNarrowScreens />
          <span className="ly-shell-theme"><ThemeToggle /></span>
          <button className="ly-icon-button" onClick={() => void signOut()} type="button" aria-label={t('Sign out')}><LogOut /></button>
        </div>
      </header>

      <main className="ly-customer-main">
        <div className="ly-page-frame"><Outlet /></div>
      </main>

      <nav className="ly-mobile-dock" aria-label={t('Customer mobile navigation')}>
        {customerLinks.map((item) => <ShellLink item={item} key={item.to} compact />)}
      </nav>

      <footer className="ly-customer-footer">
        <LoyalityWordmark />
        <p>{t('Every scan moves your relationship with this business forward.')}</p>
        <div><NavLink to="/privacy">{t('Privacy')}</NavLink><NavLink to="/terms">{t('Terms')}</NavLink></div>
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
  const { t } = useLanguage()
  const isAdmin = kind === 'admin'
  const links = isAdmin
    ? adminLinks
    : businessLinks.filter((item) => canAccessBusinessPath(profile?.role, item.to))
  const workspaceName = isAdmin ? t('Loyality control room') : (businessName ?? t('Business workspace'))

  return (
    <div className={`ly-shell ly-workspace ly-workspace--${kind}`}>
      <header className="ly-workspace-mobile-header">
        <button className="ly-icon-button" onClick={() => setOpen(true)} type="button" aria-label={t('Open navigation')}><Menu /></button>
        <strong>{workspaceName}</strong>
        <LanguagePicker className="ly-workspace-mobile-language" compact condenseOnNarrowScreens />
      </header>

      {open ? <button className="ly-rail-scrim" onClick={() => setOpen(false)} type="button" aria-label={t('Close navigation')} /> : null}

      <aside className={`ly-rail${open ? ' ly-rail--open' : ''}`}>
        <div className="ly-rail__top">
          <LoyalityWordmark inverse />
          <button className="ly-rail__close" onClick={() => setOpen(false)} type="button" aria-label={t('Close navigation')}><X /></button>
        </div>
        <div className="ly-rail__identity">
          <span>{isAdmin ? <ShieldCheck /> : <CircleUserRound />}</span>
          <p>{isAdmin ? t('Platform operations') : t('Private program')}</p>
          <h1>{workspaceName}</h1>
        </div>
        <nav className="ly-rail__nav" aria-label={t('{role} navigation', { role: isAdmin ? t('Admin') : t('Business') })}>
          {links.map((item) => <ShellLink item={item} key={item.to} onClick={() => setOpen(false)} />)}
        </nav>
        <div className="ly-rail__footer">
          <UserChip profile={profile} inverse />
          <div className="ly-rail__utilities">
            <LanguagePicker className="ly-rail-language" compact />
            <ThemeToggle />
            <button onClick={() => void signOut()} type="button"><LogOut /> {t('Sign out')}</button>
          </div>
        </div>
      </aside>

      <main className="ly-workspace-main">
        <div className="ly-workspace-kicker"><span /> {isAdmin ? t('Loyality platform administration') : t('Customer growth workspace')}</div>
        <div className="ly-page-frame"><Outlet /></div>
      </main>
    </div>
  )
}

function ShellLink({ item, compact = false, onClick }: { item: RailItem; compact?: boolean; onClick?: () => void }) {
  const Icon = item.icon
  const { t } = useLanguage()
  return (
    <NavLink
      className={({ isActive }) => `ly-shell-link${isActive ? ' ly-shell-link--active' : ''}${compact ? ' ly-shell-link--compact' : ''}`}
      end={item.to.endsWith('dashboard') || item.to.endsWith('portal')}
      onClick={onClick}
      to={item.to}
    >
      <Icon className="ly-shell-link__icon" />
      <span>{t(item.label)}</span>
    </NavLink>
  )
}
