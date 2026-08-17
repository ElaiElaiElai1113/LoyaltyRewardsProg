import { describe, expect, it, vi } from 'vitest'

import { scrollPaginationScope } from './pagination-scroll'

function createScrollWindow(reducedMotion: boolean) {
  return {
    matchMedia: vi.fn(() => ({ matches: reducedMotion })),
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }),
  }
}

describe('pagination scrolling', () => {
  it('returns to the explicit list scope with smooth motion', () => {
    const scrollIntoView = vi.fn()
    const scope = { scrollIntoView }
    const navigation = {
      closest: vi.fn(() => scope),
      parentElement: { scrollIntoView: vi.fn() },
    }
    const browserWindow = createScrollWindow(false)

    scrollPaginationScope(
      navigation as unknown as HTMLElement,
      browserWindow as unknown as Pick<Window, 'matchMedia' | 'requestAnimationFrame'>,
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(navigation.closest).toHaveBeenCalledWith('[data-pagination-scope]')
  })

  it('falls back to the containing list and disables animation for reduced motion', () => {
    const scrollIntoView = vi.fn()
    const navigation = {
      closest: vi.fn(() => null),
      parentElement: { scrollIntoView },
    }
    const browserWindow = createScrollWindow(true)

    scrollPaginationScope(
      navigation as unknown as HTMLElement,
      browserWindow as unknown as Pick<Window, 'matchMedia' | 'requestAnimationFrame'>,
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })
})
