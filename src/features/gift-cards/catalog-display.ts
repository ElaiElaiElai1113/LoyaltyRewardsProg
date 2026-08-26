import type { GiftCardCatalogItem } from '@/types/domain'

function normalized(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function displayIdentity(item: GiftCardCatalogItem) {
  const title = normalized(item.title)
  const description = normalized(item.description)
  const isWorkflowFixture = title.startsWith('workflow gift card')
    || description === 'workflow automation gift card.'

  return [
    item.businessId,
    isWorkflowFixture ? 'workflow gift card' : title,
    description,
    normalized(item.valueLabel),
    item.pointsCost,
    item.expiryDays,
    normalized(item.imageUrl),
  ].join('|')
}

/**
 * QA workflows can create equivalent catalog offers with timestamped titles.
 * Keep the newest offer visible without deleting the historical database rows.
 */
export function distinctCustomerGiftCardOffers(items: GiftCardCatalogItem[]) {
  const identities = new Set<string>()

  return items.filter((item) => {
    if (!item.isActive) return false

    const identity = displayIdentity(item)
    if (identities.has(identity)) return false
    identities.add(identity)
    return true
  })
}
