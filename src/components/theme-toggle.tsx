import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { tenantStorageKey } from '@/lib/tenant-storage'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.localStorage.getItem(tenantStorageKey('theme')) === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useLanguage()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(tenantStorageKey('theme'), theme)
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(className)}
      aria-label={isDark ? t('Switch to light mode') : t('Switch to dark mode')}
      title={isDark ? t('Switch to light mode') : t('Switch to dark mode')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}

export function ThemeInitializer() {
  useEffect(() => {
    applyTheme(getInitialTheme())
  }, [])

  return null
}
