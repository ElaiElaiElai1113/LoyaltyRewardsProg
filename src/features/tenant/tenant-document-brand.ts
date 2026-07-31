import { getProgramIconHref } from '@/features/tenant/tenant-branding'
import type { Program } from '@/types/domain'

function setMetaContent(selector: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value)
}

export function applyProgramDocumentBrand(program: Program) {
  const root = document.documentElement
  const description = `${program.name} rewards and local business benefits.`
  const iconHref = getProgramIconHref(program)
  root.style.setProperty('--tenant-accent', program.primaryColor)
  root.style.setProperty('--tenant-accent-soft', `color-mix(in srgb, ${program.accentColor} 24%, transparent)`)
  document.title = program.name
  document.documentElement.lang = program.locale.split('-')[0]
  setMetaContent('meta[name="theme-color"]', program.primaryColor)
  setMetaContent('meta[property="og:site_name"]', program.name)
  setMetaContent('meta[property="og:title"]', program.name)
  setMetaContent('meta[property="og:description"]', description)
  setMetaContent('meta[property="og:url"]', window.location.origin)
  setMetaContent('meta[name="twitter:title"]', program.name)
  setMetaContent('meta[name="twitter:description"]', description)
  setMetaContent('meta[name="apple-mobile-web-app-title"]', program.name)
  setMetaContent('meta[name="description"]', description)
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', iconHref)
  document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.setAttribute('href', iconHref)
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${window.location.origin}/`)
  const manifest = {
    name: program.name,
    short_name: program.name,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: program.primaryColor,
    icons: [{ src: iconHref, sizes: 'any', purpose: 'any' }],
  }
  document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute(
    'href',
    `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`,
  )
}
