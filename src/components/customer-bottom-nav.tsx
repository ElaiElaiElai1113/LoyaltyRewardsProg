import { Gift, LayoutDashboard, ShieldCheck, ShoppingBag } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { useCart } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, match: ['/dashboard'] },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, match: ['/shop'] },
  { to: '/rewards', label: 'Rewards', icon: Gift, match: ['/rewards', '/redeem'] },
  { to: '/membership', label: 'Plan', icon: ShieldCheck, match: ['/membership'] },
  { to: '/cart', label: 'Cart', icon: ShoppingBag, match: ['/cart', '/checkout'] },
]

export function CustomerBottomNav() {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const cart = useCart()
  const cartCount = (cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-card/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-lg backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((item) => {
          const isActive = item.match.some((prefix) => pathname.startsWith(prefix))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-[var(--muted)] text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
              )}
            >
              <span className="relative">
                <item.icon className="size-5" />
                {item.to === '/cart' && cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded bg-[var(--primary)] px-1 text-[0.6rem] font-bold leading-4 text-[var(--primary-foreground)]">
                    {cartCount}
                  </span>
                ) : null}
              </span>
              <span>{t(item.label)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
