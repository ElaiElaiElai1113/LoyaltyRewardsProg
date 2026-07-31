import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  resolveInvitationOrigin,
  type InvitationDomain,
} from '../_shared/invitation-origin.ts'

type RegisterCustomerRequest = {
  name?: string
  email?: string
  businessId?: string
}

type ProfileRow = {
  id: string
  role: 'customer' | 'platform-admin' | 'business-owner' | 'business-staff'
  business_id: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, string>
      if (parsed.default) return parsed.default
    } catch {
      return null
    }
  }

  return Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

function generateReferralCode() {
  return `MR-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
}

async function hasRequiredAgreements(admin: ReturnType<typeof createClient>, profile: ProfileRow) {
  if (profile.role === 'platform-admin') return true
  if (profile.role === 'business-staff') return true

  const requiredKindsByRole = {
    customer: ['member'],
    'business-owner': ['business_affiliate', 'business_custom'],
    'business-staff': [],
    'platform-admin': [],
  } as const
  const requiredKinds = requiredKindsByRole[profile.role]
  if (requiredKinds.length === 0) return true

  const { data: agreements, error: agreementsError } = await admin
    .from('agreement_versions')
    .select('*')
    .eq('is_active', true)
    .eq('required_role', profile.role)
    .in('kind', [...requiredKinds])

  if (agreementsError) {
    throw new Error('Required agreements could not be loaded.')
  }

  const scopedAgreements = (agreements ?? []).filter(
    (agreement) =>
      !agreement.business_id ||
      (profile.business_id && agreement.business_id === profile.business_id),
  )

  if (scopedAgreements.length === 0) return true

  const { data: acceptances, error: acceptancesError } = await admin
    .from('agreement_acceptances')
    .select('*')
    .eq('profile_id', profile.id)

  if (acceptancesError) {
    throw new Error('Agreement signatures could not be loaded.')
  }

  return scopedAgreements.every((agreement) =>
    (acceptances ?? []).some(
      (acceptance) =>
        acceptance.agreement_version_id === agreement.id &&
        acceptance.agreement_kind === agreement.kind &&
        acceptance.agreement_version === agreement.version &&
        acceptance.content_hash === agreement.content_hash &&
        acceptance.accepted_electronic_records &&
        acceptance.accepted_terms &&
        acceptance.signature_svg &&
        acceptance.signature_svg.length >= 80,
    ),
  )
}

async function ensureMemberProgramAccess(
  admin: ReturnType<typeof createClient>,
  programId: string,
  profileId: string,
) {
  const { data: existing, error: readError } = await admin
    .from('program_memberships')
    .select('id')
    .eq('program_id', programId)
    .eq('profile_id', profileId)
    .eq('role', 'member')
    .is('business_id', null)
    .maybeSingle()

  if (readError) return readError

  if (existing) return null

  const { error } = await admin
    .from('program_memberships')
    .insert({
      program_id: programId,
      profile_id: profileId,
      role: 'member',
      business_id: null,
      status: 'active',
    })
  return error
}

async function ensureRewardBalance(
  admin: ReturnType<typeof createClient>,
  programId: string,
  profileId: string,
) {
  const { data: existing, error: readError } = await admin
    .from('reward_balances')
    .select('id')
    .eq('program_id', programId)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (readError) return readError
  if (existing) return null

  const { error } = await admin
    .from('reward_balances')
    .insert({
      program_id: programId,
      profile_id: profileId,
      points: 0,
      next_reward_points: 300,
      available_credits: 0,
    })
  return error
}

async function ensureBusinessCustomerLink(
  admin: ReturnType<typeof createClient>,
  programId: string,
  businessId: string,
  profileId: string,
  linkedBy: string,
) {
  const { data: existing, error: readError } = await admin
    .from('business_customer_links')
    .select('profile_id')
    .eq('program_id', programId)
    .eq('business_id', businessId)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (readError) return { error: readError, created: false }
  if (existing) return { error: null, created: false }

  const { error: insertError } = await admin
    .from('business_customer_links')
    .insert({
      program_id: programId,
      business_id: businessId,
      profile_id: profileId,
      linked_by: linkedBy,
      source: 'registration',
    })

  // A simultaneous retry may have inserted the same idempotent link first.
  if (insertError?.code === '23505') return { error: null, created: false }
  return { error: insertError, created: !insertError }
}

async function resolveInvitationRedirect(
  admin: ReturnType<typeof createClient>,
  programId: string,
  requestOrigin: string | null,
) {
  const { data, error } = await admin
    .from('program_domains')
    .select('hostname, is_primary')
    .eq('program_id', programId)
    .eq('verification_status', 'verified')

  if (error) throw error

  const origin = resolveInvitationOrigin(
    requestOrigin,
    Deno.env.get('SITE_URL'),
    (data ?? []) as InvitationDomain[],
  )

  if (!origin) {
    throw new Error('No verified invitation domain is configured for this rewards program.')
  }

  return `${origin}/accept-invitation`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Method not allowed.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const secretKey = getSecretKey()
  if (!supabaseUrl || !secretKey) {
    return jsonResponse({ message: 'Supabase function secrets are not configured.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return jsonResponse({ message: 'Missing Authorization bearer token.' }, 401)
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: userResult, error: userError } = await admin.auth.getUser(token)
  if (userError || !userResult.user) {
    return jsonResponse({ message: 'Invalid or expired session.' }, 401)
  }

  let payload: RegisterCustomerRequest
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ message: 'Invalid JSON payload.' }, 400)
  }

  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  if (!name || name.length < 2) {
    return jsonResponse({ message: "Customer's full name is required." }, 400)
  }

  if (!email || !email.includes('@')) {
    return jsonResponse({ message: 'A valid customer email is required.' }, 400)
  }

  const { data: actorProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, business_id')
    .eq('id', userResult.user.id)
    .single()

  if (profileError || !actorProfile) {
    return jsonResponse({ message: 'Actor profile not found.' }, 404)
  }

  const actor = actorProfile as ProfileRow
  if (actor.role !== 'business-owner' && actor.role !== 'business-staff' && actor.role !== 'platform-admin') {
    return jsonResponse({ message: 'Only staff accounts can register customers.' }, 403)
  }

  try {
    const canUsePlatform = await hasRequiredAgreements(admin, actor)
    if (!canUsePlatform) {
      return jsonResponse({ message: 'Required staff agreement has not been signed.' }, 403)
    }
  } catch (error) {
    return jsonResponse(
      { message: error instanceof Error ? error.message : 'Agreement check failed.' },
      500,
    )
  }

  const businessId = actor.role === 'platform-admin' ? payload.businessId : actor.business_id
  if (!businessId) {
    return jsonResponse({ message: 'No business context is available.' }, 400)
  }

  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, program_id')
    .eq('id', businessId)
    .single()

  if (businessError || !business?.program_id) {
    return jsonResponse({ message: 'The business program could not be resolved.' }, 400)
  }

  const programId = business.program_id as string

  if (actor.role !== 'platform-admin') {
    const { data: activeBusinessMembership, error: membershipError } = await admin
      .from('program_memberships')
      .select('id')
      .eq('program_id', programId)
      .eq('profile_id', actor.id)
      .eq('business_id', businessId)
      .eq('role', actor.role)
      .eq('status', 'active')
      .maybeSingle()

    if (membershipError) {
      return jsonResponse({ message: 'Business access could not be verified.' }, 500)
    }

    if (!activeBusinessMembership) {
      return jsonResponse({ message: 'Active business program access is required.' }, 403)
    }
  }

  const { data: existingProfile, error: existingProfileError } = await admin
    .from('profiles')
    .select('id, full_name, email, role, registered_by_business_id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfileError) {
    return jsonResponse({ message: existingProfileError.message }, 500)
  }

  if (existingProfile) {
    if (existingProfile.role !== 'customer') {
      return jsonResponse({ message: 'A customer with this email already exists.' }, 409)
    }

    const { data: activeMembership, error: activeMembershipError } = await admin
      .from('program_memberships')
      .select('id')
      .eq('program_id', programId)
      .eq('profile_id', existingProfile.id)
      .eq('role', 'member')
      .eq('status', 'active')
      .maybeSingle()

    if (activeMembershipError) {
      return jsonResponse({ message: activeMembershipError.message }, 500)
    }

    // Do not reveal or attach an identity that belongs only to another tenant.
    if (!activeMembership) {
      return jsonResponse({ message: 'A customer with this email already exists.' }, 409)
    }

    const [existingBalanceError, linkResult] = await Promise.all([
      ensureRewardBalance(admin, programId, existingProfile.id),
      ensureBusinessCustomerLink(
        admin,
        programId,
        businessId,
        existingProfile.id,
        actor.id,
      ),
    ])

    if (existingBalanceError || linkResult.error) {
      return jsonResponse(
        { message: existingBalanceError?.message ?? linkResult.error?.message },
        500,
      )
    }

    return jsonResponse({
      message: linkResult.created
        ? 'Existing customer linked to this business.'
        : 'Customer is already linked to this business.',
      user: {
        id: existingProfile.id,
        email: existingProfile.email,
        fullName: existingProfile.full_name,
        existing: true,
        linkedToBusiness: true,
        linkCreated: linkResult.created,
      },
    })
  }

  let invitationRedirectError: unknown = null
  const redirectTo = await resolveInvitationRedirect(
    admin,
    programId,
    req.headers.get('origin'),
  ).catch((error: unknown) => {
    invitationRedirectError = error
    return null
  })

  if (!redirectTo) {
    return jsonResponse(
      {
        message: invitationRedirectError instanceof Error
          ? invitationRedirectError.message
          : 'Customer invitation redirect could not be resolved.',
      },
      500,
    )
  }

  const { data: created, error: createError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      full_name: name,
      registered_by_business_id: businessId,
      active_program_id: programId,
    },
  })

  if (createError || !created.user) {
    const message = createError?.message.toLowerCase().includes('already')
      ? 'A customer with this email already exists.'
      : createError?.message ?? 'Customer invitation could not be sent.'
    return jsonResponse({ message }, 409)
  }

  const { error: updateUserError } = await admin.auth.admin.updateUserById(created.user.id, {
    app_metadata: {
      role: 'customer',
      registered_by_business_id: businessId,
      active_program_id: programId,
    },
    user_metadata: {
      full_name: name,
      registered_by_business_id: businessId,
      active_program_id: programId,
    },
  })

  if (updateUserError) {
    return jsonResponse({ message: updateUserError.message }, 500)
  }

  const { data: linkedProfiles, error: linkError } = await admin
    .from('profiles')
    .update({ registered_by_business_id: businessId })
    .eq('id', created.user.id)
    .eq('role', 'customer')
    .select('id')

  if (linkError) {
    return jsonResponse({ message: linkError.message }, 500)
  }

  if (!linkedProfiles?.length) {
    const { error: upsertProfileError } = await admin
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          full_name: name,
          email: created.user.email ?? email,
          role: 'customer',
          registered_by_business_id: businessId,
          referral_code: generateReferralCode(),
        },
        { onConflict: 'id' },
      )

    if (upsertProfileError) {
      return jsonResponse({ message: upsertProfileError.message }, 500)
    }
  }

  const programMembershipError = await ensureMemberProgramAccess(admin, programId, created.user.id)

  if (programMembershipError) {
    return jsonResponse({ message: programMembershipError.message }, 500)
  }

  const balanceError = await ensureRewardBalance(admin, programId, created.user.id)

  if (balanceError) {
    return jsonResponse({ message: balanceError.message }, 500)
  }

  const linkResult = await ensureBusinessCustomerLink(
    admin,
    programId,
    businessId,
    created.user.id,
    actor.id,
  )

  if (linkResult.error) {
    return jsonResponse({ message: linkResult.error.message }, 500)
  }

  return jsonResponse({
    message: 'Customer invited and linked to this business.',
    user: {
      id: created.user.id,
      email: created.user.email,
      fullName: name,
      existing: false,
      linkedToBusiness: true,
      linkCreated: linkResult.created,
    },
  })
})
