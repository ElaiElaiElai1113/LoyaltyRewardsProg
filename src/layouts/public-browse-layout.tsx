import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { BrandLogo } from '@/components/brand-logo'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { RewardMePublicHeader } from '@/features/home/components/rewardme-public-header'
import { LoyalityMark } from '@/features/loyality/components/loyality-mark'
import { useLanguage } from '@/lib/language'
import { useTenant } from '@/hooks/use-tenant'
import { isRewardMeExperience } from '@/lib/rewardme-experience'

const navigation = [
  { to: '/guide', label: 'Guide' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/business', label: 'For Businesses' },
]

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/reward-terms', label: 'Reward Terms' },
  { to: '/verification-policy', label: 'Verification Policy' },
]

export function PublicBrowseLayout() {
  const { program } = useTenant()
  const { t } = useLanguage()
  const location = useLocation()
  const isBusinessOnboarding = location.pathname === '/business'
  const isLoyality = program.slug === 'loyality'
  const isRewardMe = isRewardMeExperience(program.slug)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const visibleNavigation = program.featureFlags.loyalitySingleBusiness
    ? navigation.filter((item) => item.to !== '/guide')
    : navigation

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  if (isBusinessOnboarding) {
    return (
      <div className={`business-public-shell${isRewardMe ? ' business-public-shell--rewardme' : ''}`}>
        {isRewardMe ? <RewardMePublicHeader /> : <header className="business-public-shell__header">
          <div className="business-public-shell__container business-public-shell__header-inner">
            <NavLink
              to="/"
              className="business-public-shell__brand"
              aria-label={t('{program} member homepage', { program: program.name })}
            >
              {isLoyality ? (
                <LoyalityMark className="business-public-shell__brand-mark" size={34} />
              ) : (
                <BrandLogo className="business-public-shell__brand-logo" markClassName="business-public-shell__brand-mark" showText={false} />
              )}
              <span className="business-public-shell__brand-copy">
                {isLoyality ? program.name : program.name.toUpperCase()}
                <small>{t('FOR BUSINESSES')}</small>
              </span>
            </NavLink>

            <nav id="business-public-navigation" className={`business-public-shell__nav${mobileMenuOpen ? ' is-open' : ''}`} aria-label={t('Business page navigation')}>
              <a href="#benefits" onClick={() => setMobileMenuOpen(false)}>{t('Benefits')}</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>{t('How It Works')}</a>
              {program.slug === 'pinas' || program.slug === 'wondertown' || program.slug === 'loyality'
                ? null
                : <NavLink to="/cost-calculator" onClick={() => setMobileMenuOpen(false)}>{t('Cost Calculator')}</NavLink>}
              <a href="#get-started" onClick={() => setMobileMenuOpen(false)}>{t('Get Started')}</a>
              <NavLink className="business-public-shell__mobile-login" to="/signin?portal=business" onClick={() => setMobileMenuOpen(false)}>
                {t('Business Login')}
              </NavLink>
            </nav>

            <div className="business-public-shell__header-actions">
              <LanguagePicker
                className="business-public-shell__language-picker"
                compact
                condenseOnNarrowScreens
              />
              <NavLink to="/signin?portal=business" className="business-public-shell__login">
                {t('Business Login')}
              </NavLink>
              <button
                className="business-public-shell__menu-toggle"
                type="button"
                aria-label={t(mobileMenuOpen ? 'Close navigation' : 'Open navigation')}
                aria-controls="business-public-navigation"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
              >
                {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </button>
            </div>
          </div>
        </header>}

        <main>
          <Outlet />
        </main>

        <footer className="business-public-shell__footer">
          <div className="business-public-shell__container">
            <div className="business-public-shell__footer-top">
              <div>
                <NavLink
                  to="/"
                  className="business-public-shell__brand"
                  aria-label={t('{program} member homepage', { program: program.name })}
                >
                  {isLoyality ? (
                    <LoyalityMark className="business-public-shell__brand-mark" size={34} />
                  ) : (
                    <BrandLogo className="business-public-shell__brand-logo" markClassName="business-public-shell__brand-mark" showText={false} />
                  )}
                  <span className="business-public-shell__brand-copy">
                    {isLoyality ? program.name : program.name.toUpperCase()}
                  </span>
                </NavLink>
                <p>{program.featureFlags.demoTenant
                  ? t('A fictional business workspace for testing complete rewards workflows.')
                  : program.featureFlags.loyalitySingleBusiness
                    ? t('A private, white-label loyalty workspace for one business and its own customers.')
                    : t('Helping local businesses grow while giving amazing Rewards to our members.')}</p>
              </div>
              <nav aria-label={t('Business footer navigation')}>
                {isRewardMeExperience(program.slug) ? <NavLink to="/#how">{t('How it works (members)')}</NavLink> : null}
                {isRewardMeExperience(program.slug) ? <NavLink to="/business">{t('For businesses')}</NavLink> : null}
                <NavLink to="/privacy">{t('Privacy policy')}</NavLink>
                {program.featureFlags.demoTenant ? (
                  <NavLink to="/guide">{t('Demo guide')}</NavLink>
                ) : (
                  <a href={`mailto:${program.supportEmail}`}>{t('Contact')}</a>
                )}
                <NavLink to="/">{t('Member site')}</NavLink>
              </nav>
            </div>
            <div className="business-public-shell__footer-bottom">
              <span>© 2026 {program.name}. {t('All rights reserved.')}</span>
              <span>
                {t('Made for businesses in {location}', {
                  location: program.countryCode === 'PH' ? t('the Philippines') : program.countryCode,
                })}
              </span>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="soft-luxe-shell product-public-shell flex min-h-screen flex-col">
      {isRewardMe ? <RewardMePublicHeader /> : <header className="sticky top-0 z-50 border-b border-primary/15 bg-card/88 shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full flex-nowrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex min-w-0 flex-1 items-center gap-5 xl:gap-10">
            <NavLink to="/" className="flex min-w-0 shrink-0 items-center gap-3">
              <BrandLogo markClassName="h-9" textClassName="text-xl text-primary-container sm:text-2xl" />
              <span className="hidden h-6 w-px bg-[var(--border)] xl:block" />
              <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary-container)] xl:block">
                {program.featureFlags.loyalitySingleBusiness ? t('Private offers') : t('Golden Circle')}
              </span>
            </NavLink>

            <nav className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex xl:gap-5">
              {visibleNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-2 text-xs font-bold transition-colors xl:text-sm ${
                      isActive
                        ? 'luxe-chip-active'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex sm:gap-3">
            <LanguagePicker
              className="inline-flex text-[var(--muted-foreground)]"
              compact
              condenseOnNarrowScreens
            />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Button asChild variant="secondary" size="sm">
              <NavLink to="/join">
                <span className="hidden sm:inline">
                  {isLoyality ? t('Create account') : t('Join Rewards Club')}
                </span>
                <span className="sm:hidden">{t('Join')}</span>
              </NavLink>
            </Button>
            <Button asChild variant="outline" size="sm">
              <NavLink to="/signin">{t('Sign In')}</NavLink>
            </Button>
          </div>
          <button
            className="product-public-shell__menu-toggle inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-card text-[var(--foreground)] lg:hidden"
            type="button"
            aria-label={t(mobileMenuOpen ? 'Close navigation' : 'Open navigation')}
            aria-controls="product-public-mobile-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
        <nav
          id="product-public-mobile-navigation"
          className="product-public-shell__mobile-nav border-t border-primary/15 bg-card px-4 pb-5 pt-3 shadow-soft sm:px-6 lg:hidden"
          aria-label={t('Mobile navigation')}
          hidden={!mobileMenuOpen}
        >
          {visibleNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center border-b border-primary/10 text-sm font-bold text-[var(--foreground)]">
              {t(item.label)}
            </NavLink>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button asChild variant="secondary"><NavLink to="/join" onClick={() => setMobileMenuOpen(false)}>{isLoyality ? t('Create account') : t('Join Rewards Club')}</NavLink></Button>
            <Button asChild variant="outline"><NavLink to="/signin" onClick={() => setMobileMenuOpen(false)}>{t('Sign In')}</NavLink></Button>
          </div>
        </nav>
      </header>}

      <main className="flex-1">
        <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-10 lg:px-8 2xl:px-12">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-primary/15 bg-card px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">
        <div className="mx-auto flex w-full flex-col justify-between gap-4 text-sm text-[var(--muted-foreground)] md:flex-row md:items-center">
          <span className="font-semibold text-[var(--foreground)]">{program.name}</span>
          <nav className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="transition-colors hover:text-[var(--foreground)]">
                {t(link.label)}
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
