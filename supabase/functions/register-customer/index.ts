import { createClient } from 'npm:@supabase/supabase-js@2'

type RegisterCustomerRequest = {
  name?: string
  email?: string
  businessId?: string
}

type ProfileRow = {
  id: string
  role: 'customer' | 'platform-admin' | 'business-owner'
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

async function hasRequiredAgreements(admin: ReturnType<typeof createClient>, profile: ProfileRow) {
  if (profile.role === 'platform-admin') return true

  const { data: agreements, error: agreementsError } = await admin
    .from('agreement_versions')
    .select('*')
    .eq('is_active', true)
    .eq('required_role', profile.role)

  if (agreementsError) {
    throw new Error('Required agreements could not be loaded.')
  }

  if (!agreements || agreements.length === 0) return true

  const { data: acceptances, error: acceptancesError } = await admin
    .from('agreement_acceptances')
    .select('*')
    .eq('profile_id', profile.id)

  if (acceptancesError) {
    throw new Error('Agreement signatures could not be loaded.')
  }

  return agreements.every((agreement) =>
    (acceptances ?? []).some(
      (acceptance) =>
        acceptance.agreement_version_id === agreement.id &&
        acceptance.agreement_kind === agreement.kind &&
        acceptance.agreement_version === agreement.version &&
        acceptance.content_hash === agreement.content_hash &&
        acceptance.accepted_electronic_records &&
        acceptance.accepted_terms,
    ),
  )
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
  if (actor.role !== 'business-owner' && actor.role !== 'platform-admin') {
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

  const businessId = actor.role === 'business-owner' ? actor.business_id : payload.businessId
  if (!businessId) {
    return jsonResponse({ message: 'No business context is available.' }, 400)
  }

  const redirectTo = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? undefined
  const { data: created, error: createError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      full_name: name,
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
    },
    user_metadata: {
      full_name: name,
    },
  })

  if (updateUserError) {
    return jsonResponse({ message: updateUserError.message }, 500)
  }

  /*
   * Some Supabase projects create invited users before the profile trigger runs.
   * If the trigger is delayed, this update is harmlessly skipped and the user
   * can still sign in once the profile exists.
   */
  const { error: linkError } = await admin
    .from('profiles')
    .update({ registered_by_business_id: businessId })
    .eq('id', created.user.id)
    .eq('role', 'customer')

  if (linkError) {
    return jsonResponse({ message: linkError.message }, 500)
  }

  return jsonResponse({
    user: {
      id: created.user.id,
      email: created.user.email,
    },
  })
})
