import { createContext } from 'react'

import type { Program } from '@/types/domain'

export interface TenantContextValue {
  program: Program
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const TenantContext = createContext<TenantContextValue | null>(null)
