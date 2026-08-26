import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apply = process.argv.includes('--apply')
const requestedProgram = process.argv.find((value) => value.startsWith('--program='))?.split('=')[1] ?? 'all'
const olderThanHours = Number(process.argv.find((value) => value.startsWith('--older-than-hours='))?.split('=')[1] ?? 6)

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}
if (!Number.isFinite(olderThanHours) || olderThanHours < 0) {
  throw new Error('--older-than-hours must be zero or a positive number.')
}
if (!['all', 'rewardme', 'wondertown', 'loyality'].includes(requestedProgram)) {
  throw new Error('--program must be all, rewardme, wondertown, or loyality.')
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString()

async function must(result, message) {
  if (result.error) throw new Error(`${message}: ${result.error.message}`)
  return result.data ?? []
}

const programSlugs = requestedProgram === 'all'
  ? ['rewardme', 'wondertown', 'loyality']
  : [requestedProgram]
const programs = await must(
  await client.from('programs').select('id,slug').in('slug', programSlugs),
  'Could not load programs',
)
const programIds = programs.map((program) => program.id)
const businesses = programIds.length
  ? await must(
      await client.from('businesses').select('id,program_id,slug').in('program_id', programIds),
      'Could not load businesses',
    )
  : []
const businessIds = businesses.map((business) => business.id)

const actions = []

if (businessIds.length && programs.some((program) => program.slug === 'rewardme' || program.slug === 'wondertown')) {
  const rewardProgramIds = new Set(programs.filter((program) => program.slug === 'rewardme' || program.slug === 'wondertown').map((program) => program.id))
  const rewardBusinessIds = businesses.filter((business) => rewardProgramIds.has(business.program_id)).map((business) => business.id)
  const workflowCatalog = rewardBusinessIds.length
    ? await must(
        await client
          .from('gift_card_catalog')
          .select('id,business_id,title,description,is_active,created_at')
          .in('business_id', rewardBusinessIds)
          .ilike('title', 'Workflow Gift Card %')
          .eq('description', 'Workflow automation gift card.')
          .eq('is_active', true)
          .lte('created_at', cutoff),
        'Could not inspect workflow gift cards',
      )
    : []
  actions.push({ table: 'gift_card_catalog', field: 'is_active', value: false, rows: workflowCatalog })
}

const loyalityProgram = programs.find((program) => program.slug === 'loyality')
if (loyalityProgram) {
  const loyalityBusinessIds = businesses.filter((business) => business.program_id === loyalityProgram.id).map((business) => business.id)
  const definitions = [
    { table: 'loyality_offers', label: 'title', field: 'active', value: false },
    { table: 'loyality_visit_rules', label: 'name', field: 'active', value: false },
    { table: 'loyality_voucher_catalog', label: 'title', field: 'active', value: false },
    { table: 'loyality_raffles', label: 'title', field: 'status', value: 'cancelled' },
  ]
  for (const definition of definitions) {
    const rows = loyalityBusinessIds.length
      ? await must(
          await client
            .from(definition.table)
            .select(`id,business_id,${definition.label},created_at`)
            .in('business_id', loyalityBusinessIds)
            .ilike(definition.label, 'QA %')
            .lte('created_at', cutoff),
          `Could not inspect ${definition.table}`,
        )
      : []
    actions.push({ ...definition, rows })
  }
}

const report = actions.map(({ table, field, value, rows }) => ({
  table,
  action: `${field}=${String(value)}`,
  matches: rows.length,
  ids: rows.map((row) => row.id),
}))

if (apply) {
  for (const { table, field, value, rows } of actions) {
    const ids = rows.map((row) => row.id)
    if (!ids.length) continue
    const result = await client.from(table).update({ [field]: value }).in('id', ids).select('id')
    const updated = await must(result, `Could not update ${table}`)
    if (updated.length !== ids.length) {
      throw new Error(`${table} cleanup updated ${updated.length} of ${ids.length} expected rows.`)
    }
  }
}

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  requestedProgram,
  cutoff,
  note: 'Only clearly labelled QA definitions are disabled or cancelled. Financial transactions, issued vouchers, and real customer data are never deleted.',
  report,
}, null, 2))
