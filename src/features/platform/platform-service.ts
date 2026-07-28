import { seededPrograms } from '@/features/tenant/tenant-service'
import { supabase } from '@/integrations/supabase/client'
import type { Program } from '@/types/domain'

export interface PlatformProgram extends Program {
  primaryDomain: string | null
  domainStatus: string
  subscriptionStatus: string
  planName: string
}

function fallbackRows(): PlatformProgram[] {
  return seededPrograms.map((program) => ({
    ...program,
    primaryDomain: program.slug === 'medellin' ? 'medellinrewards.com' : `${program.slug}.rewardsplatform.app`,
    domainStatus: program.slug === 'medellin' ? 'verified' : 'pending',
    subscriptionStatus: program.slug === 'medellin' ? 'active' : 'incomplete',
    planName: program.slug === 'medellin' ? 'Growth' : 'Launch',
  }))
}

export const platformService = {
  async listPrograms(): Promise<PlatformProgram[]> {
    if (!supabase) return fallbackRows()
    const { data, error } = await supabase
      .from('programs')
      .select('*, program_domains(hostname,is_primary,verification_status), program_subscriptions(status,subscription_plans(name))')
      .order('created_at')
    if (error || !data) return fallbackRows()
    return data.map((row) => {
      const domains = (row.program_domains ?? []) as Array<Record<string, unknown>>
      const domain = domains.find((item) => item.is_primary) ?? domains[0]
      const subscription = Array.isArray(row.program_subscriptions)
        ? row.program_subscriptions[0]
        : row.program_subscriptions
      const plan = subscription?.subscription_plans
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
        planName: (Array.isArray(plan) ? plan[0]?.name : plan?.name) ?? 'No plan',
      } as PlatformProgram
    })
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
    const { error } = await supabase.from('programs').update({ status }).eq('id', programId)
    if (error) throw new Error(error.message)
  },
}
