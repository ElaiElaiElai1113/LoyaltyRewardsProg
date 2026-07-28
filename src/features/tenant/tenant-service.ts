import type { Program } from '@/types/domain'
import { supabase } from '@/integrations/supabase/client'
import { camelCaseRow } from '@/integrations/supabase/services/shared'

const programs: Record<string, Program> = {
  medellin: {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Medellin Rewards',
    slug: 'medellin',
    status: 'active',
    countryCode: 'CO',
    locale: 'es-CO',
    currency: 'USD',
    timezone: 'America/Bogota',
    primaryColor: '#9c6a22',
    accentColor: '#d8972c',
    logoUrl: '/medellin-rewards-logo.svg',
    supportEmail: 'support@medellinrewards.com',
    mapCenter: { latitude: 6.2442, longitude: -75.5812 },
    featureFlags: {},
  },
  guatemala: {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Guatemala Rewards',
    slug: 'guatemala',
    status: 'active',
    countryCode: 'GT',
    locale: 'es-GT',
    currency: 'GTQ',
    timezone: 'America/Guatemala',
    primaryColor: '#176b5b',
    accentColor: '#f2b134',
    logoUrl: null,
    supportEmail: 'support@guatemalarewards.com',
    mapCenter: { latitude: 14.6349, longitude: -90.5069 },
    featureFlags: {},
  },
  synergize: {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Synergize',
    slug: 'synergize',
    status: 'active',
    countryCode: 'US',
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/New_York',
    primaryColor: '#2357a5',
    accentColor: '#e45b3f',
    logoUrl: null,
    supportEmail: 'support@synergize.example',
    mapCenter: { latitude: 40.7128, longitude: -74.006 },
    featureFlags: {},
  },
  davao: {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'Davao Rewards',
    slug: 'davao',
    status: 'active',
    countryCode: 'PH',
    locale: 'en-PH',
    currency: 'PHP',
    timezone: 'Asia/Manila',
    primaryColor: '#176b45',
    accentColor: '#f4c542',
    logoUrl: null,
    supportEmail: 'support@davaorewards.com',
    mapCenter: { latitude: 7.1907, longitude: 125.4553 },
    featureFlags: {},
  },
}

let activeProgram: Program | null = null

function inferSlug(hostname: string) {
  const host = hostname.toLowerCase().split(':')[0]
  const queryTenant = typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get('tenant')
  if (queryTenant && programs[queryTenant]) return queryTenant
  return Object.keys(programs).find((slug) => host.includes(slug)) ?? 'medellin'
}

export function canUseTenantPreviewOverride(hostname: string) {
  const host = hostname.toLowerCase().split(':')[0]
  return host === 'localhost'
    || host.startsWith('127.')
    || host.endsWith('.rewardsplatform.app')
    || (host.startsWith('loyalty-rewards-prog-') && host.endsWith('-elaielaielai1113s-projects.vercel.app'))
}

export function getFallbackProgram(hostname = window.location.hostname) {
  return programs[inferSlug(hostname)] ?? programs.medellin
}

export function setActiveProgram(program: Program) {
  activeProgram = program
}

export function getActiveProgram() {
  return activeProgram ?? getFallbackProgram()
}

function mapProgram(row: Record<string, unknown>): Program {
  const value = camelCaseRow(row)
  return {
    id: value.id as string,
    name: value.name as string,
    slug: value.slug as string,
    status: value.status as Program['status'],
    countryCode: value.countryCode as string,
    locale: value.locale as string,
    currency: value.currency as string,
    timezone: value.timezone as string,
    primaryColor: value.primaryColor as string,
    accentColor: value.accentColor as string,
    logoUrl: (value.logoUrl as string | null) ?? null,
    supportEmail: value.supportEmail as string,
    mapCenter: {
      latitude: Number(value.mapLatitude ?? 0),
      longitude: Number(value.mapLongitude ?? 0),
    },
    featureFlags: (value.featureFlags as Record<string, boolean>) ?? {},
  }
}

export async function resolveProgram(hostname: string): Promise<Program> {
  if (!supabase) return getFallbackProgram(hostname)
  const queryTenant = typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get('tenant')
  const canUseTenantOverride = canUseTenantPreviewOverride(hostname)
  const resolutionHostname = queryTenant && canUseTenantOverride
    ? `${queryTenant.toLowerCase()}.rewardsplatform.app`
    : hostname
  if (import.meta.env.VITE_TENANT_STATE_RPC_ENABLED === 'true') {
    const { data: stateData, error: stateError } = await supabase.rpc('resolve_program_host_state', {
      p_hostname: resolutionHostname.split(':')[0].toLowerCase(),
    })
    if (!stateError && Array.isArray(stateData) && stateData[0]) {
      const state = stateData[0] as Record<string, unknown>
      if (state.domain_verification_status !== 'verified') throw new Error('domain_pending')
      if (state.status === 'suspended') throw new Error('program_suspended')
      if (state.status !== 'active') throw new Error('program_unavailable')
      return mapProgram(state)
    }
  }
  const { data, error } = await supabase.rpc('resolve_program_by_hostname', {
    p_hostname: resolutionHostname.split(':')[0].toLowerCase(),
  })
  if (!error && data && Array.isArray(data) && data[0]) return mapProgram(data[0] as Record<string, unknown>)
  if (canUseTenantOverride) return getFallbackProgram(hostname)
  throw new Error('program_not_found')
}

export const seededPrograms = Object.values(programs)
