import { getActiveProgram } from '@/features/tenant/tenant-service'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from '@/integrations/supabase/services/shared'

export type LoyalityRewardKind = 'item' | 'amount' | 'discount'

export type LoyalityOffer = {
  id: string
  programId: string
  businessId: string
  publicToken: string
  title: string
  description: string
  sourceLabel: string
  rewardTitle: string
  rewardKind: LoyalityRewardKind
  rewardValue: number | null
  rewardDescription: string
  startsAt: string
  endsAt: string | null
  active: boolean
}

export type LoyalityVisitRule = {
  id: string
  programId: string
  businessId: string
  name: string
  triggerVisitCount: number
  repeatEvery: number | null
  rewardTitle: string
  rewardKind: LoyalityRewardKind
  rewardValue: number | null
  rewardDescription: string
  active: boolean
}

export type LoyalityVoucherCatalogItem = {
  id: string
  programId: string
  businessId: string
  title: string
  description: string
  voucherKind: LoyalityRewardKind
  voucherValue: number | null
  pointsCost: number
  active: boolean
}

export type LoyalityVoucher = {
  id: string
  programId: string
  businessId: string
  customerId: string
  publicToken: string
  title: string
  description: string
  voucherKind: LoyalityRewardKind
  voucherValue: number | null
  status: 'active' | 'redeemed' | 'cancelled'
  sourceKind: 'acquisition_offer' | 'referral' | 'visit_rule' | 'points_catalog' | 'manual'
  issuedAt: string
  redeemedAt: string | null
}

export type LoyalityRaffle = {
  id: string
  programId: string
  businessId: string
  title: string
  prizeDescription: string
  minimumPurchase: number
  entriesPerPurchase: number
  startsAt: string
  endsAt: string
  status: 'draft' | 'active' | 'closed' | 'cancelled'
}

export type LoyalityVisit = {
  id: string
  customerId: string
  visitNumber: number
  purchaseAmount: number
  visitedAt: string
}

export type LoyalityBusinessSettings = {
  businessId: string
  programId: string
  publicBusinessName: string
  tagline: string
  membershipTiers: Array<{ name: string; price: number; benefits: string[] }>
  referralRewardTitle: string
  referralRewardKind: LoyalityRewardKind
  referralRewardValue: number | null
  referralRewardDescription: string
}

export type LoyalityCustomerSnapshot = {
  settings: LoyalityBusinessSettings | null
  offers: LoyalityOffer[]
  visits: LoyalityVisit[]
  vouchers: LoyalityVoucher[]
  catalog: LoyalityVoucherCatalogItem[]
  raffles: LoyalityRaffle[]
  raffleEntries: Array<{ raffleId: string; entryCount: number }>
}

export type LoyalityBusinessSnapshot = {
  settings: LoyalityBusinessSettings | null
  offers: LoyalityOffer[]
  visitRules: LoyalityVisitRule[]
  catalog: LoyalityVoucherCatalogItem[]
  raffles: LoyalityRaffle[]
  counts: {
    claims: number
    visits: number
    activeVouchers: number
    raffleEntries: number
  }
}

function map<T>(row: Record<string, unknown>) {
  return camelCaseRow(row) as unknown as T
}

function mapMany<T>(rows: unknown[] | null) {
  return (rows ?? []).map((row) => map<T>(row as Record<string, unknown>))
}

async function countRows(table: string, businessId: string, extra?: { column: string; value: string }) {
  const sb = requireSupabase()
  let query = sb.from(table).select('id', { count: 'exact', head: true }).eq('business_id', businessId)
  if (extra) query = query.eq(extra.column, extra.value)
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

export const loyalityService = {
  async getPublicOffer(publicToken: string): Promise<LoyalityOffer | null> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('loyality_offers')
      .select('*')
      .eq('public_token', publicToken)
      .maybeSingle()
    if (error) throw new Error('This offer could not be loaded.')
    return data ? map<LoyalityOffer>(data as Record<string, unknown>) : null
  },

  async claimOffer(publicToken: string, referrerCode?: string | null, sourceLabel?: string | null) {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('claim_loyality_offer', {
      p_offer_token: publicToken,
      p_referrer_code: referrerCode || null,
      p_source_label: sourceLabel || null,
    })
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'The offer could not be claimed.'))
    return map<LoyalityVoucher>(row)
  },

  async getCustomerSnapshot(profileId: string): Promise<LoyalityCustomerSnapshot> {
    const sb = requireSupabase()
    const programId = getActiveProgram().id
    const [settings, offers, visits, vouchers, catalog, raffles, entries] = await Promise.all([
      sb.from('loyality_business_settings').select('*').eq('program_id', programId).maybeSingle(),
      sb.from('loyality_offers').select('*').eq('program_id', programId).eq('active', true).order('created_at', { ascending: false }),
      sb.from('loyality_visits').select('*').eq('program_id', programId).eq('customer_id', profileId).order('visit_number', { ascending: false }),
      sb.from('loyality_vouchers').select('*').eq('program_id', programId).eq('customer_id', profileId).order('issued_at', { ascending: false }),
      sb.from('loyality_voucher_catalog').select('*').eq('program_id', programId).eq('active', true).order('points_cost'),
      sb.from('loyality_raffles').select('*').eq('program_id', programId).eq('status', 'active').order('ends_at'),
      sb.from('loyality_raffle_entries').select('raffle_id,entry_count').eq('program_id', programId).eq('customer_id', profileId),
    ])
    const error = [settings, offers, visits, vouchers, catalog, raffles, entries].find((result) => result.error)?.error
    if (error) throw new Error(error.message)
    return {
      settings: settings.data ? map<LoyalityBusinessSettings>(settings.data as Record<string, unknown>) : null,
      offers: mapMany<LoyalityOffer>(offers.data),
      visits: mapMany<LoyalityVisit>(visits.data),
      vouchers: mapMany<LoyalityVoucher>(vouchers.data),
      catalog: mapMany<LoyalityVoucherCatalogItem>(catalog.data),
      raffles: mapMany<LoyalityRaffle>(raffles.data),
      raffleEntries: (entries.data ?? []).map((entry) => ({
        raffleId: entry.raffle_id as string,
        entryCount: Number(entry.entry_count ?? 0),
      })),
    }
  },

  async redeemCatalogVoucher(catalogId: string, clientRequestId: string) {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('redeem_loyality_catalog_voucher', {
      p_catalog_id: catalogId,
      p_client_request_id: clientRequestId,
    })
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'The voucher could not be created.'))
    return map<LoyalityVoucher>(row)
  },

  async redeemVoucher(publicToken: string) {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('redeem_loyality_voucher', { p_public_token: publicToken })
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'The voucher could not be redeemed.'))
    return map<LoyalityVoucher>(row)
  },

  async getVoucherForStaff(publicToken: string): Promise<LoyalityVoucher | null> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('loyality_vouchers')
      .select('*')
      .eq('public_token', publicToken)
      .maybeSingle()
    if (error) throw new Error('This voucher could not be loaded.')
    return data ? map<LoyalityVoucher>(data as Record<string, unknown>) : null
  },

  async getBusinessSnapshot(businessId: string): Promise<LoyalityBusinessSnapshot> {
    const sb = requireSupabase()
    const [settings, offers, visitRules, catalog, raffles, claims, visits, activeVouchers, raffleEntries] = await Promise.all([
      sb.from('loyality_business_settings').select('*').eq('business_id', businessId).maybeSingle(),
      sb.from('loyality_offers').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
      sb.from('loyality_visit_rules').select('*').eq('business_id', businessId).order('trigger_visit_count'),
      sb.from('loyality_voucher_catalog').select('*').eq('business_id', businessId).order('points_cost'),
      sb.from('loyality_raffles').select('*').eq('business_id', businessId).order('ends_at', { ascending: false }),
      countRows('loyality_offer_claims', businessId),
      countRows('loyality_visits', businessId),
      countRows('loyality_vouchers', businessId, { column: 'status', value: 'active' }),
      countRows('loyality_raffle_entries', businessId),
    ])
    const error = [settings, offers, visitRules, catalog, raffles].find((result) => result.error)?.error
    if (error) throw new Error(error.message)
    return {
      settings: settings.data ? map<LoyalityBusinessSettings>(settings.data as Record<string, unknown>) : null,
      offers: mapMany<LoyalityOffer>(offers.data),
      visitRules: mapMany<LoyalityVisitRule>(visitRules.data),
      catalog: mapMany<LoyalityVoucherCatalogItem>(catalog.data),
      raffles: mapMany<LoyalityRaffle>(raffles.data),
      counts: { claims, visits, activeVouchers, raffleEntries },
    }
  },

  async createOffer(input: {
    businessId: string
    title: string
    description: string
    sourceLabel: string
    rewardTitle: string
    rewardKind: LoyalityRewardKind
    rewardValue?: number | null
    rewardDescription: string
  }) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('loyality_offers').insert({
      program_id: getActiveProgram().id,
      business_id: input.businessId,
      title: input.title,
      description: input.description,
      source_label: input.sourceLabel,
      reward_title: input.rewardTitle,
      reward_kind: input.rewardKind,
      reward_value: input.rewardValue ?? null,
      reward_description: input.rewardDescription,
    }).select('*').single()
    if (error || !data) throw new Error(error?.message ?? 'Offer could not be created.')
    return map<LoyalityOffer>(data as Record<string, unknown>)
  },

  async createVisitRule(input: {
    businessId: string
    name: string
    triggerVisitCount: number
    repeatEvery?: number | null
    rewardTitle: string
    rewardKind: LoyalityRewardKind
    rewardValue?: number | null
    rewardDescription: string
  }) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('loyality_visit_rules').insert({
      program_id: getActiveProgram().id,
      business_id: input.businessId,
      name: input.name,
      trigger_visit_count: input.triggerVisitCount,
      repeat_every: input.repeatEvery ?? null,
      reward_title: input.rewardTitle,
      reward_kind: input.rewardKind,
      reward_value: input.rewardValue ?? null,
      reward_description: input.rewardDescription,
    }).select('*').single()
    if (error || !data) throw new Error(error?.message ?? 'Visit rule could not be created.')
    return map<LoyalityVisitRule>(data as Record<string, unknown>)
  },

  async createCatalogItem(input: {
    businessId: string
    title: string
    description: string
    voucherKind: LoyalityRewardKind
    voucherValue?: number | null
    pointsCost: number
  }) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('loyality_voucher_catalog').insert({
      program_id: getActiveProgram().id,
      business_id: input.businessId,
      title: input.title,
      description: input.description,
      voucher_kind: input.voucherKind,
      voucher_value: input.voucherValue ?? null,
      points_cost: input.pointsCost,
    }).select('*').single()
    if (error || !data) throw new Error(error?.message ?? 'Voucher option could not be created.')
    return map<LoyalityVoucherCatalogItem>(data as Record<string, unknown>)
  },

  async createRaffle(input: {
    businessId: string
    title: string
    prizeDescription: string
    minimumPurchase: number
    entriesPerPurchase: number
    endsAt: string
  }) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('loyality_raffles').insert({
      program_id: getActiveProgram().id,
      business_id: input.businessId,
      title: input.title,
      prize_description: input.prizeDescription,
      minimum_purchase: input.minimumPurchase,
      entries_per_purchase: input.entriesPerPurchase,
      ends_at: input.endsAt,
      status: 'active',
    }).select('*').single()
    if (error || !data) throw new Error(error?.message ?? 'Raffle could not be created.')
    return map<LoyalityRaffle>(data as Record<string, unknown>)
  },

  async setActive(table: 'loyality_offers' | 'loyality_visit_rules' | 'loyality_voucher_catalog', id: string, active: boolean) {
    const sb = requireSupabase()
    const { error } = await sb.from(table).update({ active }).eq('id', id)
    if (error) throw new Error(error.message)
  },
}
