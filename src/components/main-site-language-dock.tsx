import { useEffect } from 'react'

import { useTenant } from '@/hooks/use-tenant'
import { LanguagePicker } from '@/components/language-picker'

const floatingLanguageTenants = new Set(['pinas', 'rewardme', 'wondertown', 'loyality'])

/**
 * Keeps the public language control reachable without consuming header space.
 * Synergize owns its separate site shell and already provides the same pattern.
 */
export function MainSiteLanguageDock() {
  const { program } = useTenant()
  const isVisible = floatingLanguageTenants.has(program.slug)

  useEffect(() => {
    if (!isVisible) return

    document.documentElement.dataset.mainSiteLanguageDock = 'true'
    return () => {
      delete document.documentElement.dataset.mainSiteLanguageDock
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <LanguagePicker
      className={`main-site-language-dock main-site-language-dock--${program.slug}`}
      compact
      condenseOnNarrowScreens
    />
  )
}
