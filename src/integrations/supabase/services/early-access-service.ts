import type { EarlyAccessLead, EarlyAccessLeadStatus } from '@/types/domain'
import type { EarlyAccessLeadFormValues } from '@/types/forms'
import { camelCaseRow, requireSupabase } from './shared'

function mapEarlyAccessLead(row: Record<string, unknown>): EarlyAccessLead {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    fullName: (mapped.fullName as string | null) ?? null,
    email: (mapped.email as string | null) ?? null,
    whatsapp: (mapped.whatsapp as string | null) ?? null,
    notes: (mapped.notes as string) ?? '',
    source: mapped.source as string,
    status: mapped.status as EarlyAccessLeadStatus,
    marketingConsentAt: mapped.marketingConsentAt as string,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
  }
}

export const earlyAccessService = {
  async createLead(values: EarlyAccessLeadFormValues): Promise<EarlyAccessLead> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('create_early_access_lead', {
      p_full_name: values.fullName?.trim() || null,
      p_email: values.email.trim() || null,
      p_whatsapp: values.whatsapp?.trim() || null,
      p_notes: values.notes?.trim() ?? '',
      p_marketing_consent: values.marketingConsent,
      p_source: 'early-access-page',
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to join the early access list.')
    }

    return mapEarlyAccessLead(data as Record<string, unknown>)
  },

  async getLeads(): Promise<EarlyAccessLead[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('early_access_leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to load early access leads.')
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapEarlyAccessLead)
  },

  async updateLeadStatus(id: string, status: EarlyAccessLeadStatus): Promise<EarlyAccessLead> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('early_access_leads')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update early access lead.')
    }

    return mapEarlyAccessLead(data as Record<string, unknown>)
  },
}
