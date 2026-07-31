import { useLayoutEffect } from 'react'

import { platformBrand } from '@/features/platform/platform-brand'
import { applyProgramDocumentBrand } from '@/features/tenant/tenant-document-brand'
import { getActiveProgram } from '@/features/tenant/tenant-service'

function setMetaContent(selector: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value)
}

function applyPlatformDocumentBrand() {
  const iconHref = '/rewards-program-mark.svg'
  const canonicalUrl = `${window.location.origin}/admin`
  const manifest = {
    name: platformBrand.name,
    short_name: 'Rewards Admin',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: platformBrand.accentColor,
    icons: [{ src: iconHref, sizes: 'any', purpose: 'any' }],
  }

  document.title = platformBrand.adminTitle
  document.documentElement.lang = 'en'
  document.documentElement.style.setProperty('--tenant-accent', platformBrand.accentColor)
  document.documentElement.style.setProperty(
    '--tenant-accent-soft',
    `color-mix(in srgb, ${platformBrand.accentColor} 24%, transparent)`,
  )
  setMetaContent('meta[name="theme-color"]', platformBrand.accentColor)
  setMetaContent('meta[name="description"]', platformBrand.description)
  setMetaContent('meta[property="og:site_name"]', platformBrand.name)
  setMetaContent('meta[property="og:title"]', platformBrand.adminTitle)
  setMetaContent('meta[property="og:description"]', platformBrand.description)
  setMetaContent('meta[property="og:url"]', canonicalUrl)
  setMetaContent('meta[name="twitter:title"]', platformBrand.adminTitle)
  setMetaContent('meta[name="twitter:description"]', platformBrand.description)
  setMetaContent('meta[name="apple-mobile-web-app-title"]', platformBrand.name)
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', iconHref)
  document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.setAttribute('href', iconHref)
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)
  document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute(
    'href',
    `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`,
  )
}

export function usePlatformDocumentBrand(enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) return

    applyPlatformDocumentBrand()

    return () => {
      if (!/^\/admin(?:\/|$)/.test(window.location.pathname)) {
        applyProgramDocumentBrand(getActiveProgram())
      }
    }
  }, [enabled])
}
