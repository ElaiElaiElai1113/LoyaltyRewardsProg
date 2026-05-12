import type { GiftCard, PublicGiftCard } from '@/types/domain'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

function mapGiftCard(row: Record<string, unknown>): GiftCard {
  const mapped = camelCaseRow(row)
  const catalog = row.gift_card_catalog as Record<string, unknown> | null | undefined
  const business = row.businesses as Record<string, unknown> | null | undefined
  const customer = row.profiles as Record<string, unknown> | null | undefined

  return {
    id: mapped.id as string,
    catalogId: (mapped.catalogId as string | null) ?? null,
    businessId: mapped.businessId as string,
    customerId: mapped.customerId as string,
    issuedBy: (mapped.issuedBy as string | null) ?? null,
    code: mapped.code as string,
    publicToken: mapped.publicToken as string,
    status: mapped.status as GiftCard['status'],
    pointsSpent: mapped.pointsSpent as number,
    expiresAt: mapped.expiresAt as string,
    redeemedAt: (mapped.redeemedAt as string | null) ?? null,
    redeemedBy: (mapped.redeemedBy as string | null) ?? null,
    redeemedAtBusiness: (mapped.redeemedAtBusiness as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
    catalog: catalog
      ? {
          id: catalog.id as string,
          title: catalog.title as string,
          description: catalog.description as string,
          valueLabel: catalog.value_label as string,
          imageUrl: (catalog.image_url as string | null) ?? null,
        }
      : undefined,
    business: business
      ? {
          id: business.id as string,
          name: business.name as string,
          logoUrl: (business.logo_url as string | null) ?? null,
        }
      : undefined,
    customerFirstName: customer?.full_name
      ? String(customer.full_name).split(' ')[0]
      : undefined,
  }
}

function mapPublicGiftCard(row: Record<string, unknown>): PublicGiftCard {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    catalogId: (mapped.catalogId as string | null) ?? null,
    businessId: mapped.businessId as string,
    customerId: mapped.customerId as string,
    issuedBy: null,
    code: mapped.code as string,
    publicToken: mapped.publicToken as string,
    status: mapped.status as GiftCard['status'],
    pointsSpent: mapped.pointsSpent as number,
    expiresAt: mapped.expiresAt as string,
    redeemedAt: (mapped.redeemedAt as string | null) ?? null,
    redeemedBy: null,
    redeemedAtBusiness: null,
    createdAt: '',
    updatedAt: '',
    businessName: mapped.businessName as string,
    businessLogoUrl: (mapped.businessLogoUrl as string | null) ?? null,
    businessPrimaryColor: mapped.businessPrimaryColor as string,
    businessAccentColor: mapped.businessAccentColor as string,
    customerFirstName: mapped.customerFirstName as string,
    title: mapped.title as string,
    description: mapped.description as string,
    valueLabel: mapped.valueLabel as string,
    imageUrl: (mapped.imageUrl as string | null) ?? null,
  }
}

const giftCardSelect = '*, gift_card_catalog(id, title, description, value_label, image_url), businesses(id, name, logo_url), profiles!gift_cards_customer_id_fkey(full_name)'

export const giftCardsService = {
  async issueGiftCard(catalogId: string, customerId: string): Promise<GiftCard> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('issue_gift_card', {
      p_catalog_id: catalogId,
      p_customer_id: customerId,
    })

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'Failed to issue gift card.'))

    return this.getGiftCardById(row.id as string).then((giftCard) => {
      if (!giftCard) throw new Error('Issued gift card could not be loaded.')
      return giftCard
    })
  },

  async redeemGiftCard(giftCardId: string, businessId: string): Promise<GiftCard> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('redeem_gift_card', {
      p_gift_card_id: giftCardId,
      p_business_id: businessId,
    })

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'Failed to redeem gift card.'))

    return this.getGiftCardById(row.id as string).then((giftCard) => {
      if (!giftCard) throw new Error('Redeemed gift card could not be loaded.')
      return giftCard
    })
  },

  async getMyGiftCards(): Promise<GiftCard[]> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('gift_cards')
      .select(giftCardSelect)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to load your gift cards.')
    return ((data ?? []) as Record<string, unknown>[]).map(mapGiftCard)
  },

  async getGiftCardsForBusiness(businessId?: string): Promise<GiftCard[]> {
    const sb = requireSupabase()

    let query = sb
      .from('gift_cards')
      .select(giftCardSelect)
      .order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error) throw new Error('Failed to load business gift cards.')
    return ((data ?? []) as Record<string, unknown>[]).map(mapGiftCard)
  },

  async getPublicGiftCard(token: string): Promise<PublicGiftCard | null> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('get_public_gift_card_by_token', {
      p_token: token,
    })

    if (error) throw new Error(error.message)
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    return row ? mapPublicGiftCard(row) : null
  },

  async getGiftCardById(id: string): Promise<GiftCard | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('gift_cards')
      .select(giftCardSelect)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return mapGiftCard(data as Record<string, unknown>)
  },
}
