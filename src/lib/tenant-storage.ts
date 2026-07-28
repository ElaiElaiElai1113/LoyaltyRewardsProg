import { getActiveProgram } from '@/features/tenant/tenant-service'

export function tenantStorageKey(key: string) {
  return `rewards:${getActiveProgram().slug}:${key}`
}
