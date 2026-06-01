import { createClient } from 'npm:@supabase/supabase-js@2'

type SignAgreementRequest = {
  agreementVersionId?: string
  typedSignature?: string
  acceptedElectronicRecords?: boolean
  acceptedTerms?: boolean
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

function getSignerIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return req.headers.get('cf-connecting-ip') ?? forwardedFor ?? null
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

  let payload: SignAgreementRequest
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ message: 'Invalid JSON payload.' }, 400)
  }

  const typedSignature = payload.typedSignature?.trim()
  if (!payload.agreementVersionId) {
    return jsonResponse({ message: 'Agreement version is required.' }, 400)
  }

  if (!typedSignature || typedSignature.length < 2) {
    return jsonResponse({ message: 'Typed signature is required.' }, 400)
  }

  if (!payload.acceptedElectronicRecords || !payload.acceptedTerms) {
    return jsonResponse({ message: 'Both consent confirmations are required.' }, 400)
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, business_id')
    .eq('id', userResult.user.id)
    .single()

  if (profileError || !profile) {
    return jsonResponse({ message: 'Profile not found.' }, 404)
  }

  const { data: agreement, error: agreementError } = await admin
    .from('agreement_versions')
    .select('*')
    .eq('id', payload.agreementVersionId)
    .eq('is_active', true)
    .single()

  if (agreementError || !agreement) {
    return jsonResponse({ message: 'Active agreement version not found.' }, 404)
  }

  if (!agreement.required_role || agreement.required_role !== profile.role) {
    return jsonResponse({ message: 'This agreement is not required for this account.' }, 403)
  }

  const { data: existing, error: existingError } = await admin
    .from('agreement_acceptances')
    .select('*')
    .eq('profile_id', userResult.user.id)
    .eq('agreement_version_id', agreement.id)
    .maybeSingle()

  if (existingError) {
    return jsonResponse({ message: 'Could not check existing signature.' }, 500)
  }

  if (existing) {
    return jsonResponse({ acceptance: existing, alreadySigned: true })
  }

  const { data: acceptance, error: acceptanceError } = await admin
    .from('agreement_acceptances')
    .insert({
      profile_id: userResult.user.id,
      business_id: profile.business_id,
      agreement_version_id: agreement.id,
      agreement_kind: agreement.kind,
      agreement_version: agreement.version,
      content_hash: agreement.content_hash,
      typed_signature: typedSignature,
      accepted_electronic_records: true,
      accepted_terms: true,
      signer_ip: getSignerIp(req),
      signer_user_agent: req.headers.get('user-agent'),
    })
    .select('*')
    .single()

  if (acceptanceError || !acceptance) {
    return jsonResponse({ message: acceptanceError?.message ?? 'Signature could not be saved.' }, 500)
  }

  return jsonResponse({ acceptance })
})
