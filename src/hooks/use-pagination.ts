import { useState } from 'react'

export const DEFAULT_PAGE_SIZE = 8
export const COMPACT_LIST_PAGE_SIZE = 5

export function resolvePaginationPage(requestedPage: number, totalPages: number, reset = false) {
  if (reset) return 1

  const safeTotalPages = Math.max(1, Math.floor(totalPages) || 1)
  const safeRequestedPage = Math.max(1, Math.floor(requestedPage) || 1)
  return Math.min(safeRequestedPage, safeTotalPages)
}

export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  requestedPageSize = DEFAULT_PAGE_SIZE,
) {
  const pageSize = Math.max(1, Math.floor(requestedPageSize) || DEFAULT_PAGE_SIZE)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = resolvePaginationPage(requestedPage, totalPages)
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  return { page, pageItems, pageSize, totalItems, totalPages }
}

export function usePagination<T>(items: readonly T[], pageSize = DEFAULT_PAGE_SIZE, resetKey?: string) {
  const [state, setState] = useState(() => ({ requestedPage: 1, resetKey }))
  const initialPagination = paginateItems(items, state.requestedPage, pageSize)
  const resetChanged = state.resetKey !== resetKey
  const resolvedPage = resolvePaginationPage(
    state.requestedPage,
    initialPagination.totalPages,
    resetChanged,
  )

  // React applies this conditional render-time adjustment before committing the
  // current render, so filtered lists never flash a stale page.
  if (resetChanged || resolvedPage !== state.requestedPage) {
    setState({ requestedPage: resolvedPage, resetKey })
  }

  const pagination = resolvedPage === initialPagination.page
    ? initialPagination
    : paginateItems(items, resolvedPage, pageSize)

  const setPage = (nextPage: number) => {
    setState({
      requestedPage: resolvePaginationPage(nextPage, pagination.totalPages),
      resetKey,
    })
  }

  return {
    ...pagination,
    setPage,
  }
}
