import { seededPrograms } from '@/features/tenant/tenant-service'
import { supabase } from '@/integrations/supabase/client'
import type { PlanEntitlements, Program } from '@/types/domain'

export interface ProgramUsage {
  administrators: number
  businesses: number
  members: number
  customDomains: number
  storageMb: number | null
}

export interface PlatformProgram extends Program {
  primaryDomain: string | null
  domainStatus: string
  subscriptionStatus: string
  planName: string
  entitlements: PlanEntitlements
  usage: ProgramUsage
}

const fallbackEntitlements: PlanEntitlements = {
  administrators: 2,
  businesses: 10,
  members: 1000,
  storageMb: 2048,
  customDomains: 1,
  features: { giftCards: true, referrals: true },
}

function fallbackRows(): PlatformProgram[] {
  return seededPrograms.map((program) => ({
    ...program,
    primaryDomain: program.slug === 'medellin' ? 'medellinrewards.com' : `${program.slug}.rewardsplatform.app`,
    domainStatus: program.slug === 'medellin' ? 'verified' : 'pending',
    subscriptionStatus: program.slug === 'medellin' ? 'active' : 'incomplete',
    planName: program.slug === 'medellin' ? 'Growth' : 'Launch',
    entitlements: fallbackEntitlements,
    usage: { administrators: 0, businesses: 0, members: 0, customDomains: 0, storageMb: null },
  }))
}

export const platformService = {
  async isProgramSlugAvailable(slug: string) {
    if (!supabase) return true
    const { data, error } = await supabase.from('programs').select('id').eq('slug', slug.trim().toLowerCase()).limit(1)
    if (error) throw new Error('Program slug could not be checked.')
    return (data?.length ?? 0) === 0
  },

  async listPrograms(): Promise<PlatformProgram[]> {
    if (!supabase) return fallbackRows()
    const sb = supabase
    const { data, error } = await sb
      .from('programs')
      .select('*, program_domains(hostname,is_primary,verification_status), program_subscriptions(status,subscription_plans(name,entitlements))')
      .order('created_at')
    if (error || !data) return fallbackRows()
    return Promise.all(data.map(async (row) => {
      const domains = (row.program_domains ?? []) as Array<Record<string, unknown>>
      const domain = domains.find((item) => item.is_primary) ?? domains[0]
      const subscription = Array.isArray(row.program_subscriptions)
        ? row.program_subscriptions[0]
        : row.program_subscriptions
      const plan = subscription?.subscription_plans
      const planValue = Array.isArray(plan) ? plan[0] : plan
      const [{ count: administrators }, { count: members }, { count: businesses }] = await Promise.all([
        sb.from('program_memberships').select('id', { count: 'exact', head: true }).eq('program_id', row.id).eq('role', 'program-admin').in('status', ['active', 'invited']),
        sb.from('program_memberships').select('id', { count: 'exact', head: true }).eq('program_id', row.id).eq('role', 'member').eq('status', 'active'),
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('program_id', row.id),
      ])
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        countryCode: row.country_code,
        locale: row.locale,
        currency: row.currency,
        timezone: row.timezone,
        primaryColor: row.primary_color,
        accentColor: row.accent_color,
        logoUrl: row.logo_url,
        supportEmail: row.support_email,
        mapCenter: { latitude: Number(row.map_latitude ?? 0), longitude: Number(row.map_longitude ?? 0) },
        featureFlags: row.feature_flags ?? {},
        primaryDomain: (domain?.hostname as string) ?? null,
        domainStatus: (domain?.verification_status as string) ?? 'pending',
        subscriptionStatus: (subscription?.status as string) ?? 'incomplete',
        planName: planValue?.name ?? 'No plan',
        entitlements: (planValue?.entitlements as PlanEntitlements | null) ?? fallbackEntitlements,
        usage: {
          administrators: administrators ?? 0,
          businesses: businesses ?? 0,
          members: members ?? 0,
          customDomains: domains.filter((item) => !String(item.hostname).endsWith('.rewardsplatform.app')).length,
          storageMb: null,
        },
      } as PlatformProgram
    }))
  },

  async createProgram(input: {
    name: string
    slug: string
    countryCode: string
    locale: string
    currency: string
    timezone: string
    planCode: string
    primaryColor?: string
    accentColor?: string
    logoUrl?: string
    supportEmail?: string
  }) {
    if (!supabase) throw new Error('Supabase must be configured to provision a program.')
    const { data, error } = await supabase.rpc('create_program', {
      p_name: input.name,
      p_slug: input.slug,
      p_country_code: input.countryCode,
      p_locale: input.locale,
      p_currency: input.currency,
      p_timezone: input.timezone,
      p_plan_code: input.planCode,
    })
    if (error) throw new Error(error.message)
    const programId = data as string
    if (input.primaryColor && input.accentColor && input.supportEmail) {
      const { error: settingsError } = await supabase.rpc('update_program_brand_settings', {
        p_program_id: programId,
        p_name: input.name,
        p_country_code: input.countryCode,
        p_locale: input.locale,
        p_currency: input.currency,
        p_timezone: input.timezone,
        p_primary_color: input.primaryColor,
        p_accent_color: input.accentColor,
        p_logo_url: input.logoUrl ?? '',
        p_support_email: input.supportEmail,
      })
      if (settingsError) throw new Error(settingsError.message)
    }
    return programId
  },

  async startCheckout(programId: string) {
    if (!supabase) throw new Error('Supabase must be configured to start billing.')
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Sign in before starting billing.')
    const response = await fetch('/api/stripe-create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ programId, origin: window.location.origin }),
    })
    const result = await response.json() as { url?: string; error?: string }
    if (!response.ok || !result.url) throw new Error(result.error ?? 'Billing checkout could not start.')
    window.location.assign(result.url)
  },

  async updateProgramStatus(programId: string, status: Program['status']) {
    if (!supabase) throw new Error('Supabase must be configured to update a program.')
    const { error: rpcError } = await supabase.rpc('set_program_status', {
      p_program_id: programId,
      p_status: status,
      p_reason: 'Platform console lifecycle action',
    })
    if (!rpcError) return
    if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('Could not find the function')) {
      throw new Error(rpcError.message)
    }
    const { error } = await supabase.from('programs').update({ status }).eq('id', programId)
    if (error) throw new Error(error.message)
  },
}
