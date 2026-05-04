import { NavLink, Outlet } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

const navigation = [
  { to: '/shop', label: 'Menu' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/for-businesses', label: 'For Businesses' },
]

export function PublicBrowseLayout() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-50 border-b border-[var(--border)]/70 bg-[rgb(255_249_240_/_0.82)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-12">
            <NavLink to="/" className="flex items-center gap-3">
              <span className="text-xl font-semibold text-[var(--foreground)]">
                Medellin Rewards
              </span>
              <span className="hidden h-6 w-px bg-[var(--border)] md:block" />
              <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary-container)] md:block">
                Golden Circle
              </span>
            </NavLink>

            <nav className="hidden items-center gap-5 md:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--tenant-accent-soft)] text-[var(--primary-container)]'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguagePicker className="text-[var(--muted-foreground)]" compact />
            <ThemeToggle />
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <NavLink to="/for-businesses#book-demo">{t('Book Demo')}</NavLink>
            </Button>
            <Button asChild variant="outline" size="sm">
              <NavLink to="/signin">{t('Sign In')}</NavLink>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
