import { NavLink, Outlet } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

const navigation = [
  { to: '/shop', label: 'Menu' },
  { to: '/rewards', label: 'Vault' },
  { to: '/promotions', label: 'Promotions' },
]

export function PublicBrowseLayout() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-50 border-b border-primary-container/20 bg-[#120d0b]/82 text-white shadow-card backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-12">
            <NavLink to="/" className="flex items-center gap-3">
              <span className="font-serif text-2xl font-black italic uppercase tracking-[0.2em] text-primary-container">
                Medellin Rewards
              </span>
              <span className="hidden h-6 w-px bg-primary-container/25 md:block" />
              <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant md:block">
                Quest Rewards
              </span>
            </NavLink>

            <nav className="hidden items-center gap-5 md:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                      isActive
                        ? 'text-primary-container drop-shadow-[0_0_8px_rgba(244,168,79,0.65)]'
                        : 'text-on-surface-variant/70 hover:text-primary-container'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguagePicker className="text-on-surface-variant" compact />
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
