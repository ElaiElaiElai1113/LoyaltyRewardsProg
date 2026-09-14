export type PendingVoucherRequest = { catalogId: string; requestId: string }

export function voucherRequestKey(programId: string, customerId: string) {
  return `rewards:loyality:voucher-request:${programId}:${customerId}`
}

export function readVoucherRequest(storage: Storage, key: string): PendingVoucherRequest | null {
  const saved = storage.getItem(key)
  if (saved === null) return null
  let request: Partial<PendingVoucherRequest> | null
  try { request = JSON.parse(saved) as Partial<PendingVoucherRequest> | null }
  catch { throw new Error('Your pending voucher request could not be read. Please contact support before trying again.') }
  if (!request || typeof request.catalogId !== 'string' || !request.catalogId
    || typeof request.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.requestId)) {
    throw new Error('Your pending voucher request could not be read. Please contact support before trying again.')
  }
  return { catalogId: request.catalogId, requestId: request.requestId }
}

export function beginVoucherRequest(storage: Storage, key: string, catalogId: string): PendingVoucherRequest {
  const pending = readVoucherRequest(storage, key)
  if (pending) {
    if (pending.catalogId !== catalogId) throw new Error('Finish your pending voucher request before choosing another reward.')
    return pending
  }
  const request = { catalogId, requestId: crypto.randomUUID() }
  // Persist before sending. If storage is unavailable, do not start an unresumable request.
  storage.setItem(key, JSON.stringify(request))
  return request
}

export function completeVoucherRequest(storage: Storage, key: string, request: PendingVoucherRequest) {
  const pending = readVoucherRequest(storage, key)
  if (pending?.requestId === request.requestId && pending.catalogId === request.catalogId) storage.removeItem(key)
}

/** Hold the intent lock through reconciliation and clearing; never queue a second click. */
export async function withVoucherRequestLock<T>(key: string, action: () => Promise<T>): Promise<T> {
  if (!navigator.locks) throw new Error('This browser cannot safely coordinate voucher requests. Please use a supported browser.')
  return navigator.locks.request(key, { mode: 'exclusive', ifAvailable: true }, async lock => {
    if (!lock) throw new Error('This voucher request is being checked in another tab.')
    return action()
  })
}
