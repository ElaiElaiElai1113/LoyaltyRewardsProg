import type { Membership, Profile, UserRole } from '@/types/domain'
import type { AuthFormValues, MemberSignUpSubmission } from '@/types/forms'
import { requireSupabase, camelCaseRow } from './shared'
import { getActiveProgram } from '@/features/tenant/tenant-service'
import { isSupabaseConfigured } from '@/integrations/supabase/client'
import { resolveTenantPublicSiteUrl } from '@/lib/public-site-url'
import { profileRoleMatchesRequestedRole } from '@/lib/sign-in-portals'
import {
  getPasswordSetupParams,
  getPasswordSetupType,
  type PasswordSetupType,
} from '@/lib/password-setup'

let pendingSignInRole: AuthFormValues['role'] | 'auto' | null = null

export const INVALID_REFERRAL_CODE_MESSAGE =
  'This referral code is invalid or no longer active. Check the code and try again.'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanOptionalValue(value: string | null | undefined) {
  const cleaned = value?.trim() ?? ''
  return cleaned || null
}

async function validateReferralBeforeSignUp(
  input: MemberSignUpSubmission,
): Promise<{
  referralCode: string | null
  referralBusinessId: string | null
  partnerReferralCode: string | null
  partnerBusinessId: string | null
}> {
  const referralCode = cleanOptionalValue(input.referralCode)
  const referralBusinessId = cleanOptionalValue(input.referralBusinessId)
  const partnerReferralCode = cleanOptionalValue(input.partnerReferralCode)
  const partnerBusinessId = cleanOptionalValue(input.partnerBusinessId)

  if (!referralCode && !partnerReferralCode) {
    return { referralCode, referralBusinessId, partnerReferralCode, partnerBusinessId }
  }

  if (
    (referralCode && partnerReferralCode)
    || (referralBusinessId && !UUID_PATTERN.test(referralBusinessId))
    || (partnerReferralCode && (!partnerBusinessId || !UUID_PATTERN.test(partnerBusinessId)))
  ) {
    throw new Error(INVALID_REFERRAL_CODE_MESSAGE)
  }

  const kind = partnerReferralCode ? 'partner' : 'member'
  const code = partnerReferralCode ?? referralCode
  const businessId = partnerReferralCode ? partnerBusinessId : referralBusinessId
  let response: Response
  try {
    response = await fetch('/api/validate-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: code,
        programId: getActiveProgram().id,
        businessId,
        kind,
      }),
    })
  } catch {
    throw new Error('The referral code could not be verified. Please try again.')
  }

  if (!response.ok) {
    throw new Error('The referral code could not be verified. Please try again.')
  }

  const result = await response.json() as { valid?: unknown }
  if (result.valid !== true) {
    throw new Error(INVALID_REFERRAL_CODE_MESSAGE)
  }

  return { referralCode, referralBusinessId, partnerReferralCode, partnerBusinessId }
}

function getUrlTokenParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }

  return getPasswordSetupParams(window.location.search, window.location.hash)
}

function getAuthCallbackParams() {
  if (typeof window === 'undefined') return new URLSearchParams()

  const merged = new URLSearchParams(
    window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash,
  )
  const search = new URLSearchParams(window.location.search)
  for (const [key, value] of search) merged.set(key, value)
  return merged
}

function clearPasswordSetupParamsFromUrl() {
  if (typeof window === 'undefined') return

  const nextUrl = new URL(window.location.href)
  nextUrl.hash = ''
  ;[
    'access_token',
    'refresh_token',
    'expires_at',
    'expires_in',
    'token_type',
    'type',
    'code',
  ].forEach((key) => {
    nextUrl.searchParams.delete(key)
  })

  window.history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
}

function getPublicSiteUrl() {
  return resolveTenantPublicSiteUrl(
    typeof window === 'undefined' ? undefined : window.location.origin,
    import.meta.env.VITE_PUBLIC_SITE_URL,
  )
}

function mapMembership(row: Record<string, unknown>): Membership {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    profileId: mapped.profileId as string,
    status: mapped.status as Membership['status'],
    currentPeriodStart: mapped.currentPeriodStart as string,
    currentPeriodEnd: mapped.currentPeriodEnd as string,
    cancelAtPeriodEnd: mapped.cancelAtPeriodEnd as boolean,
    priceCents: mapped.priceCents as number,
    currency: mapped.currency as string,
    provider: mapped.provider as string,
    providerSubscriptionId: (mapped.providerSubscriptionId as string | null) ?? null,
    lastCreditAt: (mapped.lastCreditAt as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
  }
}

async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const sb = requireSupabase()

  const [{ data: row, error }, { data: membershipRow }] = await Promise.all([
    sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    sb
      .from('memberships')
      .select('*')
      .eq('profile_id', userId)
      .eq('program_id', getActiveProgram().id)
      .maybeSingle(),
  ])

  if (error || !row) return null
  return {
    ...(camelCaseRow(row) as unknown as Profile),
    membership: membershipRow ? mapMembership(membershipRow as Record<string, unknown>) : null,
  }
}

function profileMatchesRequestedRole(
  profile: Profile,
  requestedRole: AuthFormValues['role'],
) {
  return profileRoleMatchesRequestedRole(profile.role, requestedRole)
}

export const authService = {
  async getProfileForUserId(userId: string): Promise<Profile | null> {
    return getProfileByUserId(userId)
  },

  async getSessionProfile(): Promise<Profile | null> {
    if (!isSupabaseConfigured) return null
    const sb = requireSupabase()

    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null

    return getProfileByUserId(session.user.id)
  },

  async signIn(input: AuthFormValues): Promise<Profile> {
    const sb = requireSupabase()
    const email = input.email.trim().toLowerCase()
    pendingSignInRole = input.role

    const rejectCurrentPortal = async (message: string): Promise<never> => {
      try {
        // Keep the requested role visible until SIGNED_OUT is emitted. Otherwise
        // the auth observer can briefly accept the real profile and redirect the
        // rejected account before the local session has finished clearing.
        await sb.auth.signOut({ scope: 'local' })
      } finally {
        pendingSignInRole = null
      }
      throw new Error(message)
    }

    const { data, error: authError } = await sb.auth.signInWithPassword({
      email,
      password: input.password,
    })

    if (authError) {
      pendingSignInRole = null
      throw new Error(authError.message)
    }

    const userId = data.user?.id
    if (!userId) {
      pendingSignInRole = null
      throw new Error('Sign-in succeeded but the session user could not be loaded.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      return rejectCurrentPortal('Profile not found. Try creating an account first.')
    }

    const isBusinessPortalSignIn =
      input.role === 'business-owner' || input.role === 'business-staff'
    const isAllowedBusinessRole =
      profile.role === 'business-owner' || profile.role === 'business-staff'

    if (isBusinessPortalSignIn && !isAllowedBusinessRole) {
      return rejectCurrentPortal('This account does not have access to the business portal.')
    }

    if (input.role === 'platform-admin' && profile.role !== 'platform-admin') {
      return rejectCurrentPortal('This account does not have access to the admin portal.')
    }

    if (input.role === 'customer' && profile.role !== 'customer') {
      return rejectCurrentPortal('This account does not have access to the customer portal.')
    }

    if (!isBusinessPortalSignIn && profile.role !== input.role) {
      return rejectCurrentPortal(`This account is a ${profile.role}, not a ${input.role}.`)
    }

    return profile
  },

  async signInAutomatically(
    input: Pick<AuthFormValues, 'email' | 'password'>,
  ): Promise<Profile> {
    const sb = requireSupabase()
    const email = input.email.trim().toLowerCase()
    pendingSignInRole = 'auto'

    const rejectSignIn = async (message: string): Promise<never> => {
      try {
        await sb.auth.signOut({ scope: 'local' })
      } finally {
        pendingSignInRole = null
      }
      throw new Error(message)
    }

    const { data, error: authError } = await sb.auth.signInWithPassword({
      email,
      password: input.password,
    })

    if (authError) {
      pendingSignInRole = null
      throw new Error(authError.message)
    }

    const userId = data.user?.id
    if (!userId) {
      pendingSignInRole = null
      throw new Error('Sign-in succeeded but the session user could not be loaded.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      return rejectSignIn('Profile not found. Try creating an account first.')
    }

    return profile
  },

  async signUp(input: MemberSignUpSubmission): Promise<Profile> {
    const sb = requireSupabase()

    const name = input.fullName?.trim()
    const email = input.email.trim().toLowerCase()
    const phone = input.phone.trim()
    if (!name) {
      throw new Error('Enter your full name to create an account.')
    }
    if (!phone) {
      throw new Error('Enter your WhatsApp or phone number to create an account.')
    }

    const referral = await validateReferralBeforeSignUp(input)

    const { data, error: authError } = await sb.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: `${getPublicSiteUrl()}/auth/confirm`,
        data: {
          full_name: name,
          phone,
          active_program_id: getActiveProgram().id,
          ...(referral.referralCode ? { referral_code: referral.referralCode } : {}),
          ...(referral.referralBusinessId ? { referral_business_id: referral.referralBusinessId } : {}),
          ...(referral.partnerReferralCode ? { partner_referral_code: referral.partnerReferralCode } : {}),
          ...(referral.partnerBusinessId ? { partner_business_id: referral.partnerBusinessId } : {}),
        },
      },
    })

    if (authError) {
      if (
        (referral.referralCode || referral.partnerReferralCode)
        && (authError.message.includes('invalid_referral_code') || authError.message.includes('Database error saving new user'))
      ) {
        throw new Error(INVALID_REFERRAL_CODE_MESSAGE)
      }
      if (authError.message.includes('already registered')) {
        throw new Error('That email already exists. Try signing in instead.')
      }
      if (authError.message.includes('Database error saving new user')) {
        throw new Error('Account could not be created. Please check your details and try again.')
      }
      throw new Error(authError.message)
    }

    // Auth trigger creates profile & balance automatically.
    // Fetch the profile that was just created.
    const userId = data.user?.id
    if (!userId) {
      throw new Error('Account created but the session user could not be loaded. Please sign in.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      throw new Error('Account created but profile could not be loaded. Please sign in.')
    }

    return profile
  },

  async continueAsDemo(role: UserRole): Promise<Profile> {
    void role
    throw new Error(
      'Demo mode is not available with the live database. Please sign in or create an account.',
    )
  },

  async resetPassword(email: string): Promise<void> {
    const sb = requireSupabase()
    const normalizedEmail = email.trim().toLowerCase()
    const { error } = await sb.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${getPublicSiteUrl()}/reset-password`,
    })

    if (error) throw error
  },

  async updatePassword(password: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.auth.updateUser({
      password,
    })

    if (error) throw error
  },

  async signOut(): Promise<void> {
    const sb = requireSupabase()
    await sb.auth.signOut()
  },

  async ensurePasswordSetupSession(expectedType: PasswordSetupType): Promise<boolean> {
    const sb = requireSupabase()
    const params = getUrlTokenParams()
    const setupType = typeof window === 'undefined'
      ? null
      : getPasswordSetupType(window.location.search, window.location.hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const code = params.get('code')

    if (setupType && setupType !== expectedType) {
      throw new Error('This authentication link is for a different password flow.')
    }

    if (setupType === expectedType && accessToken && refreshToken) {
      const { error } = await sb.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        throw error
      }

      clearPasswordSetupParamsFromUrl()
      return true
    }

    if (code) {
      const { error } = await sb.auth.exchangeCodeForSession(code)
      if (error) throw error

      clearPasswordSetupParamsFromUrl()
      return true
    }

    const {
      data: { session },
    } = await sb.auth.getSession()

    if (session) {
      clearPasswordSetupParamsFromUrl()
      return true
    }

    return false
  },

  async ensureRecoverySession(): Promise<boolean> {
    return this.ensurePasswordSetupSession('recovery')
  },

  async ensureEmailConfirmationSession(): Promise<Profile | null> {
    const sb = requireSupabase()
    const params = getAuthCallbackParams()
    const callbackType = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const code = params.get('code')
    const allowedTypes = new Set(['signup', 'email', 'email_change', 'magiclink'])

    if (callbackType && !allowedTypes.has(callbackType)) {
      throw new Error('This authentication link is not an email confirmation link.')
    }

    if (callbackType && accessToken && refreshToken) {
      const { error } = await sb.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) throw error
      clearPasswordSetupParamsFromUrl()
    } else if (code) {
      // Exchange the callback code before consulting any persisted session so
      // an unrelated signed-in browser account cannot win the confirmation.
      const { error } = await sb.auth.exchangeCodeForSession(code)
      if (error) throw error
      clearPasswordSetupParamsFromUrl()
    } else {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return null
      clearPasswordSetupParamsFromUrl()
    }

    return this.getSessionProfile()
  },

  getPendingSignInRole(): AuthFormValues['role'] | 'auto' | null {
    return pendingSignInRole
  },

  clearPendingSignInRole() {
    pendingSignInRole = null
  },

  isProfileAllowedForRole(profile: Profile, requestedRole: AuthFormValues['role']) {
    return profileMatchesRequestedRole(profile, requestedRole)
  },
}
