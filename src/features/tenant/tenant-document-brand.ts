import type { Program } from '@/types/domain'

function setMetaContent(selector: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value)
}

export function applyProgramDocumentBrand(program: Program) {
  const root = document.documentElement
  root.dataset.program = program.slug
  const description = `${program.name} rewards and local business benefits.`
  const tenant = encodeURIComponent(program.slug)
  const iconHref = `/api/tenant-icon?size=192&tenant=${tenant}`
  const appleTouchIconHref = `/api/tenant-icon?size=180&tenant=${tenant}`
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
  document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.setAttribute('href', appleTouchIconHref)
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${window.location.origin}/`)
  document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute(
    'href',
    `/api/manifest?v=host-aware-2026&tenant=${tenant}`,
  )
}
