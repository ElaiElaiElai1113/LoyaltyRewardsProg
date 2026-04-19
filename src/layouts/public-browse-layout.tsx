import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const navigation = [
  { to: '/shop', label: 'Menu' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/promotions', label: 'Promotions' },
]

export function PublicBrowseLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant/10 bg-surface/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-12">
            <NavLink to="/" className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-on-surface-variant/80">
                Cafe Cliche
              </span>
              <span className="font-serif text-2xl tracking-tight text-primary">Loyalty</span>
            </NavLink>

            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-card'
                        : 'text-on-surface hover:bg-surface-low hover:text-primary'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-full">
            <NavLink to="/signin">Sign In</NavLink>
          </Button>
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
