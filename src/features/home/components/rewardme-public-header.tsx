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
  const { program } = useTenant()
  if (program.slug === 'pinas' || program.slug === 'rewardme') {
    return <img className="reference-rewardme__client-logo" src="/rewardme-client-logo-132.webp" width="132" height="107" alt="" aria-hidden="true" />
  }
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
  const headerRef = useRef<HTMLElement>(null)
  const [openAtLocation, setOpenAtLocation] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const locationKey = `${location.pathname}${location.hash}`
  const mobileMenuOpen = openAtLocation === locationKey
  const isHome = location.pathname === '/'
  const isWondertown = program.slug === 'wondertown'
  const brand = program.name

  useEffect(() => {
    const updateScroll = () => {
      setScrolled(window.scrollY > 12)
      const sections = [...document.querySelectorAll<HTMLElement>('.reference-rewardme > section[id]')]
      const current = sections.filter(section => section.getBoundingClientRect().top <= (headerRef.current?.offsetHeight ?? 88) + 80).at(-1)
      setActiveSection(current?.id ?? null)
    }
    const handleResize = () => {
      if (window.matchMedia('(min-width: 961px)').matches) setOpenAtLocation(null)
      updateScroll()
    }
    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    // RouteEffects resets scroll on pathname changes. Restore homepage section
    // destinations after that effect, including links from other public pages.
    const frame = requestAnimationFrame(() => {
      const section = location.hash.slice(1)
      if (location.pathname === '/' && navigation.some(item => item.id === section)) {
        document.getElementById(section)?.scrollIntoView({ behavior: 'auto' })
      }
      updateScroll()
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [location.hash, location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenAtLocation(null)
        toggleRef.current?.focus()
      }
    }
    const handleOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpenAtLocation(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handleOutsidePointer)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handleOutsidePointer)
    }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setOpenAtLocation(null)
  const targetFor = (id: string) => `/#${id}`

  return (
    <header ref={headerRef} className={`reference-rewardme__header${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="reference-rewardme__nav" aria-label={t('{brand} navigation', { brand })}>
        {isHome ? <a className="reference-rewardme__logo" href="#top" aria-label={t('{brand} homepage', { brand })} onClick={closeMobileMenu}>
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
              aria-current={activeSection === item.id ? 'location' : undefined}
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
          <Link className="reference-rewardme__button" to="/join">{t('Join free')}</Link>
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
            aria-current={activeSection === item.id ? 'location' : undefined}
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
          <Link className="reference-rewardme__button" to="/join" onClick={closeMobileMenu}>{t('Join free')}</Link>
        </div>
      </nav>
    </header>
  )
}
