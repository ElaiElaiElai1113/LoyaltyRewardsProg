import { describe, expect, it } from 'vitest'

import { paginateItems, resolvePaginationPage } from './use-pagination'

describe('pagination helpers', () => {
  const items = Array.from({ length: 10 }, (_, index) => index + 1)

  it('slices the requested page without losing total metadata', () => {
    expect(paginateItems(items, 2, 4)).toEqual({
      page: 2,
      pageItems: [5, 6, 7, 8],
      pageSize: 4,
      totalItems: 10,
      totalPages: 3,
    })
  })

  it('clamps a stale page after a list becomes shorter', () => {
    expect(paginateItems(items, 99, 4)).toMatchObject({
      page: 3,
      pageItems: [9, 10],
      totalPages: 3,
    })
  })

  it('resets to page one when a filter or context key changes', () => {
    expect(resolvePaginationPage(4, 8, true)).toBe(1)
    expect(resolvePaginationPage(4, 3)).toBe(3)
  })
})
