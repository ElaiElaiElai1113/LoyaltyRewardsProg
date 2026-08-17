type PaginationScrollWindow = Pick<Window, 'matchMedia' | 'requestAnimationFrame'>

export function scrollPaginationScope(
  navigation: HTMLElement | null,
  browserWindow: PaginationScrollWindow,
) {
  const listStart = navigation?.closest('[data-pagination-scope]') ?? navigation?.parentElement
  if (!listStart) return

  const behavior = browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  browserWindow.requestAnimationFrame(() => listStart.scrollIntoView({ behavior, block: 'start' }))
}
