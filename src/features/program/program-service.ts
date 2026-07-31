import { getActiveProgram } from '@/features/tenant/tenant-service'
import { requireSupabase } from '@/integrations/supabase/services/shared'
import { getCustomDomainCount, isValidProgramHostname, normalizeProgramHostname } from '@/lib/program-domain'
import type { PlanEntitlements, ProgramMembership, ProgramRole } from '@/types/domain'

export interface AccessibleProgram {
  id: string
  name: string
  slug: string
  role: ProgramRole
  hostname: string | null
}

export interface ProgramAdminSettings {
  name: string
  countryCode: string
  locale: string
  currency: string
  timezone: string
  primaryColor: string
  accentColor: string
  logoUrl: string
  supportEmail: string
  rewardName: string
  defaultEarnRate: number
  membershipPriceCents: number
  referralBonus: number
  emailFromName: string
  emailFromAddress: string
}

export interface ProgramTeamMember {
  membershipId: string
  profileId: string
  fullName: string
  email: string
  role: ProgramRole
  status: string
  businessId: string | null
  createdAt: string
}

export interface ProgramDomain {
  id: string
  hostname: string
  isPrimary: boolean
  verificationStatus: 'pending' | 'verified' | 'failed'
  verificationToken: string
  verifiedAt: string | null
}

export interface ProgramReport {
  members: number
  businesses: number
  transactions: number
  purchaseVolume: number
  pointsAwarded: number
  commissionOwed: number
  giftCards: number
  giftCardPoints: number
}

const programRolePriority: Record<ProgramRole, number> = {
  'program-admin': 4,
  'business-owner': 3,
  'business-staff': 2,
  member: 1,
}

export function dedupeAccessiblePrograms(programs: AccessibleProgram[]) {
  const byProgram = new Map<string, AccessibleProgram>()

  for (const program of programs) {
    const current = byProgram.get(program.id)
    if (!current || programRolePriority[program.role] > programRolePriority[current.role]) {
      byProgram.set(program.id, program)
    }
  }

  return [...byProgram.values()]
}

export function selectHighestPriorityMembership(memberships: ProgramMembership[]) {
  return [...memberships].sort((left, right) => (
    programRolePriority[right.role] - programRolePriority[left.role]
  ))[0] ?? null
}

export const programService = {
  async listAccessiblePrograms(profileId: string): Promise<AccessibleProgram[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('program_memberships')
      .select('role, programs(id,name,slug,program_domains(hostname,is_primary,verification_status))')
      .eq('profile_id', profileId)
      .eq('status', 'active')
    if (error) throw new Error('Programs could not be loaded.')

    const accessiblePrograms = (data ?? []).flatMap((row) => {
      const programValue = Array.isArray(row.programs) ? row.programs[0] : row.programs
      if (!programValue) return []
      const domains = (programValue.program_domains ?? []) as Array<{
        hostname: string
        is_primary: boolean
        verification_status: string
      }>
      const domain = domains.find((item) => item.is_primary && item.verification_status === 'verified')
      return [{
        id: programValue.id,
        name: programValue.name,
        slug: programValue.slug,
        role: row.role as ProgramRole,
        hostname: domain?.hostname ?? null,
      }]
    })

    return dedupeAccessiblePrograms(accessiblePrograms)
  },

  async getCurrentMembership(profileId: string): Promise<ProgramMembership | null> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('program_memberships')
      .select('*')
      .eq('profile_id', profileId)
      .eq('program_id', getActiveProgram().id)
      .eq('status', 'active')
      .in('role', ['program-admin', 'business-owner', 'business-staff', 'member'])
      .order('created_at')
    if (error || !data?.length) return null
    return selectHighestPriorityMembership(data.map((row) => ({
      id: row.id,
      programId: row.program_id,
      profileId: row.profile_id,
      role: row.role,
      status: row.status,
      businessId: row.business_id,
    })))
  },

  async listInvitations(profileId: string): Promise<AccessibleProgram[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('program_memberships')
      .select('role, programs(id,name,slug,program_domains(hostname,is_primary,verification_status))')
      .eq('profile_id', profileId)
      .eq('status', 'invited')
    if (error) throw new Error('Program invitations could not be loaded.')
    return (data ?? []).flatMap((row) => {
      const programValue = Array.isArray(row.programs) ? row.programs[0] : row.programs
      if (!programValue) return []
      const domains = (programValue.program_domains ?? []) as Array<{ hostname: string; is_primary: boolean; verification_status: string }>
      const domain = domains.find((item) => item.is_primary && item.verification_status === 'verified')
      return [{ id: programValue.id, name: programValue.name, slug: programValue.slug, role: row.role as ProgramRole, hostname: domain?.hostname ?? null }]
    })
  },

  async acceptInvitation(programId: string) {
    const sb = requireSupabase()
    const { error } = await sb.rpc('accept_program_invitation', { p_program_id: programId })
    if (error) throw new Error(error.message)
  },

  async getAdminSettings(): Promise<ProgramAdminSettings> {
    const sb = requireSupabase()
    const programId = getActiveProgram().id
    const [{ data: program, error: programError }, { data: settings, error: settingsError }] = await Promise.all([
      sb.from('programs').select('*').eq('id', programId).single(),
      sb.from('program_settings').select('*').eq('program_id', programId).single(),
    ])
    if (programError || settingsError || !program || !settings) throw new Error('Program settings could not be loaded.')
    return {
      name: program.name,
      countryCode: program.country_code,
      locale: program.locale,
      currency: program.currency,
      timezone: program.timezone,
      primaryColor: program.primary_color,
      accentColor: program.accent_color,
      logoUrl: program.logo_url ?? '',
      supportEmail: program.support_email,
      rewardName: settings.reward_name,
      defaultEarnRate: Number(settings.default_earn_rate),
      membershipPriceCents: settings.membership_price_cents,
      referralBonus: settings.referral_bonus,
      emailFromName: settings.email_from_name,
      emailFromAddress: settings.email_from_address,
    }
  },

  async updateAdminSettings(values: ProgramAdminSettings) {
    const sb = requireSupabase()
    const programId = getActiveProgram().id
    const [{ error: programError }, { error: settingsError }] = await Promise.all([
      sb.rpc('update_program_brand_settings', {
        p_program_id: programId,
        p_name: values.name,
        p_country_code: values.countryCode,
        p_locale: values.locale,
        p_currency: values.currency,
        p_timezone: values.timezone,
        p_primary_color: values.primaryColor,
        p_accent_color: values.accentColor,
        p_logo_url: values.logoUrl,
        p_support_email: values.supportEmail,
      }),
      sb.from('program_settings').update({
        reward_name: values.rewardName.trim(),
        default_earn_rate: values.defaultEarnRate,
        membership_price_cents: values.membershipPriceCents,
        referral_bonus: values.referralBonus,
        email_from_name: values.emailFromName.trim(),
        email_from_address: values.emailFromAddress.trim(),
      }).eq('program_id', programId),
    ])
    if (programError || settingsError) throw new Error(programError?.message ?? settingsError?.message ?? 'Settings could not be saved.')
  },

  async listTeam(): Promise<ProgramTeamMember[]> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('get_program_team', { p_program_id: getActiveProgram().id })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: Record<string, unknown>) => ({
      membershipId: row.membership_id,
      profileId: row.profile_id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      status: row.status,
      businessId: row.business_id,
      createdAt: row.created_at,
    }))
  },

  async inviteAdministrator(email: string) {
    const sb = requireSupabase()
    const { error } = await sb.rpc('invite_program_admin', {
      p_program_id: getActiveProgram().id,
      p_email: email.trim().toLowerCase(),
    })
    if (error) throw new Error(error.message)
  },

  async getBilling() {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('program_subscriptions')
      .select('*, subscription_plans(name,price_cents,currency,interval,entitlements)')
      .eq('program_id', getActiveProgram().id)
      .single()
    if (error) throw new Error('Billing details could not be loaded.')
    return data
  },

  async listDomains(): Promise<{ domains: ProgramDomain[]; entitlements: PlanEntitlements }> {
    const sb = requireSupabase()
    const programId = getActiveProgram().id
    const [{ data: domains, error: domainsError }, { data: entitlements, error: entitlementsError }] = await Promise.all([
      sb.from('program_domains').select('*').eq('program_id', programId).order('is_primary', { ascending: false }).order('created_at'),
      sb.rpc('get_plan_entitlements', { p_program_id: programId }),
    ])
    if (domainsError || entitlementsError) {
      throw new Error(domainsError?.message ?? entitlementsError?.message ?? 'Domains could not be loaded.')
    }
    return {
      domains: (domains ?? []).map((row) => ({
        id: row.id,
        hostname: row.hostname,
        isPrimary: row.is_primary,
        verificationStatus: row.verification_status,
        verificationToken: row.verification_token,
        verifiedAt: row.verified_at,
      })),
      entitlements: entitlements as PlanEntitlements,
    }
  },

  async addDomain(hostname: string) {
    const sb = requireSupabase()
    const programId = getActiveProgram().id
    const normalizedHostname = normalizeProgramHostname(hostname)
    if (!isValidProgramHostname(normalizedHostname)) {
      throw new Error('Enter a valid hostname without a path.')
    }
    const { domains, entitlements } = await this.listDomains()
    const customDomainCount = getCustomDomainCount(domains.map((domain) => domain.hostname))
    if (customDomainCount >= Number(entitlements.customDomains ?? 0)) {
      throw new Error('This plan has reached its custom-domain limit.')
    }
    const { error } = await sb.from('program_domains').insert({
      program_id: programId,
      hostname: normalizedHostname,
      is_primary: false,
    })
    if (error) throw new Error(error.message)
  },

  async removeDomain(domain: ProgramDomain) {
    if (domain.isPrimary || domain.hostname.endsWith('.rewardsplatform.app')) {
      throw new Error('The primary platform domain cannot be removed.')
    }
    const sb = requireSupabase()
    const { error } = await sb.from('program_domains').delete().eq('id', domain.id).eq('program_id', getActiveProgram().id)
    if (error) throw new Error(error.message)
  },

  async getReport(): Promise<ProgramReport> {
    const sb = requireSupabase()
    const programId = getActiveProgram().id
    const [
      { count: members, error: membersError },
      { count: businesses, error: businessesError },
      { data: transactions, error: transactionsError },
      { data: giftCards, error: giftCardsError },
    ] = await Promise.all([
      sb.from('program_memberships').select('id', { count: 'exact', head: true }).eq('program_id', programId).eq('role', 'member').eq('status', 'active'),
      sb.from('businesses').select('id', { count: 'exact', head: true }).eq('program_id', programId),
      sb.from('member_transactions').select('purchase_amount,points_awarded,commission_amount,commission_status').eq('program_id', programId),
      sb.from('gift_cards').select('points_spent').eq('program_id', programId),
    ])
    const error = membersError ?? businessesError ?? transactionsError ?? giftCardsError
    if (error) throw new Error(error.message)
    return {
      members: members ?? 0,
      businesses: businesses ?? 0,
      transactions: transactions?.length ?? 0,
      purchaseVolume: transactions?.reduce((sum, row) => sum + Number(row.purchase_amount), 0) ?? 0,
      pointsAwarded: transactions?.reduce((sum, row) => sum + Number(row.points_awarded), 0) ?? 0,
      commissionOwed: transactions?.filter((row) => row.commission_status === 'commission_unpaid').reduce((sum, row) => sum + Number(row.commission_amount), 0) ?? 0,
      giftCards: giftCards?.length ?? 0,
      giftCardPoints: giftCards?.reduce((sum, row) => sum + Number(row.points_spent), 0) ?? 0,
    }
  },
}
