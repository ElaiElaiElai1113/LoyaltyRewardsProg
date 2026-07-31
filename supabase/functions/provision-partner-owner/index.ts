import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  resolveInvitationOrigin,
  type InvitationDomain,
} from '../_shared/invitation-origin.ts'

type ProvisionPartnerOwnerRequest = {
  businessId?: string
  businessName?: string
  email?: string
}

type ProfileRow = {
  id: string
  role: 'customer' | 'platform-admin' | 'business-owner' | 'business-staff'
  business_id: string | null
}

type BusinessRow = {
  id: string
  name: string
  program_id: string
  active: boolean
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

function cleanEmail(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

async function resolveOwnerInvitationRedirect(
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
  if (!origin) throw new Error('No verified invitation domain is configured for this rewards program.')
  return `${origin}/accept-invitation`
}

async function actorCanManageProgram(
  admin: ReturnType<typeof createClient>,
  actor: ProfileRow,
  programId: string,
) {
  if (actor.role === 'platform-admin') return true
  const { data, error } = await admin
    .from('program_memberships')
    .select('id')
    .eq('program_id', programId)
    .eq('profile_id', actor.id)
    .eq('role', 'program-admin')
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

async function ensureOwnerMembership(
  admin: ReturnType<typeof createClient>,
  programId: string,
  businessId: string,
  profileId: string,
) {
  const { data, error } = await admin
    .from('program_memberships')
    .select('id, role')
    .eq('program_id', programId)
    .eq('profile_id', profileId)
    .eq('business_id', businessId)
    .in('role', ['business-owner', 'business-staff'])
  if (error) throw error

  const owner = data?.find((membership) => membership.role === 'business-owner')
  const staff = data?.find((membership) => membership.role === 'business-staff')
  if (owner) {
    const { error: updateError } = await admin
      .from('program_memberships')
      .update({ status: 'active' })
      .eq('id', owner.id)
    if (updateError) throw updateError
  } else if (staff) {
    const { error: updateError } = await admin
      .from('program_memberships')
      .update({ role: 'business-owner', status: 'active' })
      .eq('id', staff.id)
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await admin.from('program_memberships').insert({
      program_id: programId,
      profile_id: profileId,
      role: 'business-owner',
      business_id: businessId,
      status: 'active',
    })
    if (insertError) throw insertError
  }
}

async function demotePreviousOwner(
  admin: ReturnType<typeof createClient>,
  programId: string,
  businessId: string,
  profileId: string,
) {
  const { data: staffMembership, error: staffError } = await admin
    .from('program_memberships')
    .select('id')
    .eq('program_id', programId)
    .eq('profile_id', profileId)
    .eq('business_id', businessId)
    .eq('role', 'business-staff')
    .maybeSingle()
  if (staffError) throw staffError

  const ownerWrite = staffMembership
    ? admin.from('program_memberships').delete()
    : admin.from('program_memberships').update({ role: 'business-staff', status: 'active' })
  const { error: membershipError } = await ownerWrite
    .eq('program_id', programId)
    .eq('profile_id', profileId)
    .eq('business_id', businessId)
    .eq('role', 'business-owner')
  if (membershipError) throw membershipError

  const { error: profileError } = await admin
    .from('profiles')
    .update({ role: 'business-staff', business_id: businessId })
    .eq('id', profileId)
  if (profileError) throw profileError

  const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
    app_metadata: {
      role: 'business-staff',
      business_id: businessId,
      active_program_id: programId,
    },
  })
  if (authError) throw authError
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ message: 'Method not allowed.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const secretKey = getSecretKey()
  if (!supabaseUrl || !secretKey) {
    return jsonResponse({ message: 'Supabase function secrets are not configured.' }, 500)
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return jsonResponse({ message: 'Missing Authorization bearer token.' }, 401)

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userResult, error: userError } = await admin.auth.getUser(token)
  if (userError || !userResult.user) return jsonResponse({ message: 'Invalid or expired session.' }, 401)

  const { data: actorProfile, error: actorProfileError } = await admin
    .from('profiles')
    .select('id, role, business_id')
    .eq('id', userResult.user.id)
    .single()
  if (actorProfileError || !actorProfile) return jsonResponse({ message: 'Actor profile not found.' }, 404)

  let payload: ProvisionPartnerOwnerRequest
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ message: 'Invalid JSON payload.' }, 400)
  }

  const businessId = payload.businessId?.trim()
  const businessName = payload.businessName?.trim() || 'Partner'
  const email = cleanEmail(payload.email)
  if (!businessId) return jsonResponse({ message: 'Business is required.' }, 400)
  if (!email || !email.includes('@')) return jsonResponse({ message: 'A valid partner email is required.' }, 400)

  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, name, program_id, active')
    .eq('id', businessId)
    .single()
  if (businessError || !business) return jsonResponse({ message: 'Business not found.' }, 404)
  const scopedBusiness = business as BusinessRow
  if (!scopedBusiness.active) return jsonResponse({ message: 'The business must be active before owner access is provisioned.' }, 409)

  const { data: program, error: programError } = await admin
    .from('programs')
    .select('id, status')
    .eq('id', scopedBusiness.program_id)
    .single()
  if (programError || !program || program.status !== 'active') {
    return jsonResponse({ message: 'The rewards program is not active.' }, 409)
  }

  let canManage = false
  try {
    canManage = await actorCanManageProgram(admin, actorProfile as ProfileRow, scopedBusiness.program_id)
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Program authorization could not be verified.' }, 500)
  }
  if (!canManage) return jsonResponse({ message: 'You cannot provision owners for this rewards program.' }, 403)

  let redirectTo: string
  try {
    redirectTo = await resolveOwnerInvitationRedirect(admin, scopedBusiness.program_id, req.headers.get('origin'))
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Invitation redirect could not be resolved.' }, 500)
  }

  const fullName = `${businessName} Owner`
  const { data: existingProfile, error: existingProfileError } = await admin
    .from('profiles')
    .select('id, role, business_id')
    .ilike('email', email)
    .maybeSingle()
  if (existingProfileError) return jsonResponse({ message: existingProfileError.message }, 500)

  let userId = existingProfile?.id as string | undefined
  let accountCreated = false
  let invitationSent = false

  if (existingProfile) {
    const { data: existingAuth, error: existingAuthError } = await admin.auth.admin.getUserById(existingProfile.id)
    if (existingAuthError || !existingAuth.user) return jsonResponse({ message: 'Existing owner account could not be verified.' }, 409)
    const metadata = existingAuth.user.user_metadata ?? {}
    const resumableInvite = existingProfile.role === 'customer'
      && metadata.business_id === businessId
      && metadata.active_program_id === scopedBusiness.program_id
    const sameBusinessOperator = (
      existingProfile.role === 'business-owner' || existingProfile.role === 'business-staff'
    ) && existingProfile.business_id === businessId
    if (!resumableInvite && !sameBusinessOperator) {
      return jsonResponse({ message: 'That email already belongs to another account. Use a different owner email.' }, 409)
    }
  } else {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: fullName,
        business_id: businessId,
        active_program_id: scopedBusiness.program_id,
      },
    })
    if (inviteError || !invited.user) {
      return jsonResponse({ message: inviteError?.message ?? 'Partner owner invitation could not be sent.' }, 409)
    }
    userId = invited.user.id
    accountCreated = true
    invitationSent = true
  }

  if (!userId) return jsonResponse({ message: 'Partner owner account could not be resolved.' }, 500)

  const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role: 'business-owner',
      business_id: businessId,
      active_program_id: scopedBusiness.program_id,
    },
    user_metadata: {
      full_name: fullName,
      business_id: businessId,
      active_program_id: scopedBusiness.program_id,
    },
  })
  if (updateUserError) return jsonResponse({ message: updateUserError.message }, 500)

  const { error: profileUpdateError } = await admin
    .from('profiles')
    .update({ full_name: fullName, email, role: 'business-owner', business_id: businessId })
    .eq('id', userId)
  if (profileUpdateError) return jsonResponse({ message: profileUpdateError.message }, 500)

  try {
    await ensureOwnerMembership(admin, scopedBusiness.program_id, businessId, userId)
    if (accountCreated) {
      const { error: memberCleanupError } = await admin
        .from('program_memberships')
        .delete()
        .eq('program_id', scopedBusiness.program_id)
        .eq('profile_id', userId)
        .eq('role', 'member')
        .is('business_id', null)
      if (memberCleanupError) throw memberCleanupError
    }

    const { data: previousOwners, error: previousOwnersError } = await admin
      .from('profiles')
      .select('id')
      .eq('business_id', businessId)
      .eq('role', 'business-owner')
      .neq('id', userId)
    if (previousOwnersError) throw previousOwnersError
    for (const previousOwner of previousOwners ?? []) {
      await demotePreviousOwner(admin, scopedBusiness.program_id, businessId, previousOwner.id)
    }
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Owner program access could not be synchronized.' }, 500)
  }

  const { error: businessUpdateError } = await admin
    .from('businesses')
    .update({ owner_profile_id: userId })
    .eq('id', businessId)
    .eq('program_id', scopedBusiness.program_id)
  if (businessUpdateError) return jsonResponse({ message: businessUpdateError.message }, 500)

  return jsonResponse({
    email,
    userId,
    businessId,
    programId: scopedBusiness.program_id,
    accountCreated,
    invitationSent,
  })
})
