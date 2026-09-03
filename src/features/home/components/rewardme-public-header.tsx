import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'

import '../pages/rewardme-home.css'

const navigation = [
  { id: 'how', label: 'How it works', business: false },
  { id: 'store', label: 'The store', business: false },
  { id: 'savings', label: 'Savings plan', business: false },
  { id: 'business', label: 'For businesses', business: true },
] as const

export function RewardMeLedgerMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 4h14a3 3 0 0 1 3 3v13a1 1 0 0 1-1.4.9L12 18l-6.6 2.9A1 1 0 0 1 4 20V4Z" />
      <path d="M8 8h8M8 11.5h8" />
    </svg>
  )
}

export function RewardMePublicHeader() {
  const { program } = useTenant()
  const { t } = useLanguage()
  const location = useLocation()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [openAtLocation, setOpenAtLocation] = useState<string | null>(null)
  const locationKey = `${location.pathname}${location.hash}`
  const mobileMenuOpen = openAtLocation === locationKey
  const isHome = location.pathname === '/'
  const isWondertown = program.slug === 'wondertown'
  const brand = program.name

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenAtLocation(null)
        toggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setOpenAtLocation(null)
  const targetFor = (id: string) => `/#${id}`

  return (
    <header className="reference-rewardme__header">
      <nav className="reference-rewardme__nav" aria-label={t('{brand} navigation', { brand })}>
        {isHome ? <a className="reference-rewardme__logo" href="#top" aria-label={t('{brand} homepage', { brand })}>
          {isWondertown && program.logoUrl ? <img src={program.logoUrl} alt="" aria-hidden="true" /> : <RewardMeLedgerMark />}
          <span className="reference-rewardme__brand-name">{brand}</span>
        </a> : <Link className="reference-rewardme__logo" to="/" aria-label={t('{brand} homepage', { brand })}>
          {isWondertown && program.logoUrl ? <img src={program.logoUrl} alt="" aria-hidden="true" /> : <RewardMeLedgerMark />}
          <span className="reference-rewardme__brand-name">{brand}</span>
        </Link>}
        <div className="reference-rewardme__nav-links">
          {navigation.map((item) => isHome ? (
            <a
              key={item.id}
              className={item.business ? 'reference-rewardme__business-link' : undefined}
              href={`#${item.id}`}
            >
              {t(item.label)}
            </a>
          ) : (
            <Link key={item.id} className={item.business ? 'reference-rewardme__business-link' : undefined} to={targetFor(item.id)}>
              {t(item.label)}
            </Link>
          ))}
          {isWondertown ? <Link to="/guide">{t('Test guide')}</Link> : null}
        </div>
        <div className="reference-rewardme__nav-actions">
          <Link className="reference-rewardme__text-link" to="/signin">{t('Sign in')}</Link>
          <Link className="reference-rewardme__button" to="/join">{t('Start free trial')}</Link>
        </div>
        <button
          ref={toggleRef}
          className="reference-rewardme__menu-toggle"
          type="button"
          aria-label={t(mobileMenuOpen ? 'Close navigation' : 'Open navigation')}
          aria-controls="rewardme-mobile-navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setOpenAtLocation((current) => current === locationKey ? null : locationKey)}
        >
          {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>
      <nav
        id="rewardme-mobile-navigation"
        className={`reference-rewardme__mobile-menu${mobileMenuOpen ? ' is-open' : ''}`}
        aria-label={t('{brand} mobile navigation', { brand })}
        hidden={!mobileMenuOpen}
      >
        {navigation.map((item) => isHome ? (
          <a
            key={item.id}
            className={item.business ? 'reference-rewardme__business-link' : undefined}
            href={`#${item.id}`}
            onClick={closeMobileMenu}
          >
            {t(item.label)}
          </a>
        ) : (
          <Link key={item.id} className={item.business ? 'reference-rewardme__business-link' : undefined} to={targetFor(item.id)} onClick={closeMobileMenu}>
            {t(item.label)}
          </Link>
        ))}
        {isWondertown ? <Link to="/guide" onClick={closeMobileMenu}>{t('Test guide')}</Link> : null}
        <div className="reference-rewardme__mobile-actions">
          <Link className="reference-rewardme__button reference-rewardme__button--outline" to="/signin" onClick={closeMobileMenu}>{t('Sign in')}</Link>
          <Link className="reference-rewardme__button" to="/join" onClick={closeMobileMenu}>{t('Start free trial')}</Link>
        </div>
      </nav>
    </header>
  )
}
