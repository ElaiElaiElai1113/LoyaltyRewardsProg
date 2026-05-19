import { Gift, Megaphone, ShoppingBag } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/shop', label: 'Menu', icon: ShoppingBag, match: ['/shop'] },
  { to: '/rewards', label: 'Rewards', icon: Gift, match: ['/rewards', '/redeem'] },
  { to: '/promotions', label: 'Promos', icon: Megaphone, match: ['/promotions'] },
]

export function CustomerBottomNav() {
  const { pathname } = useLocation()
  const { t } = useLanguage()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/15 bg-card/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-luxe backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((item) => {
          const isActive = item.match.some((prefix) => pathname.startsWith(prefix))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1rem] text-xs font-semibold transition-all',
                isActive
                  ? 'bg-[var(--muted)] text-[var(--foreground)] shadow-soft'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
              )}
            >
              <span className="relative">
                <item.icon className="size-5" />
              </span>
              <span>{t(item.label)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
