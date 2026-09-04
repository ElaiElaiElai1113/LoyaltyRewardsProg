import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const permanentAccounts = [
  { email: 'member@rewardme.test', name: 'RewardMe Member' },
  { email: 'owner@rewardme.test', name: 'RewardMe Business Owner' },
  { email: 'staff@rewardme.test', name: 'RewardMe Business Staff' },
  { email: 'admin@rewardsplatform.test', name: 'Rewards Platform Administrator' },
]

async function dataOrThrow(promise, label) {
  const result = await promise
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data
}

const program = await dataOrThrow(
  client.from('programs').select('id').eq('slug', 'pinas').single(),
  'RewardMe program lookup failed',
)
const business = await dataOrThrow(
  client
    .from('businesses')
    .select('id,name,slug,description')
    .eq('program_id', program.id)
    .in('slug', ['pinas-qa-partner', 'rewardme-partner'])
    .single(),
  'RewardMe partner lookup failed',
)

const profiles = await dataOrThrow(
  client
    .from('profiles')
    .select('id,email,full_name')
    .in('email', permanentAccounts.map((account) => account.email)),
  'Permanent profile lookup failed',
)

if (profiles.length !== permanentAccounts.length) {
  throw new Error(`Expected ${permanentAccounts.length} permanent RewardMe profiles, found ${profiles.length}.`)
}

for (const account of permanentAccounts) {
  const profile = profiles.find((candidate) => candidate.email === account.email)
  if (!profile) throw new Error(`Missing permanent RewardMe profile: ${account.email}`)

  const { data: authData, error: authReadError } = await client.auth.admin.getUserById(profile.id)
  if (authReadError || !authData.user) {
    throw new Error(`Could not load ${account.email}: ${authReadError?.message ?? 'missing user'}`)
  }

  const { error: authUpdateError } = await client.auth.admin.updateUserById(profile.id, {
    user_metadata: {
      ...(authData.user.user_metadata ?? {}),
      full_name: account.name,
    },
  })
  if (authUpdateError) throw authUpdateError

  await dataOrThrow(
    client.from('profiles').update({ full_name: account.name }).eq('id', profile.id).select('id').single(),
    `Profile name update failed for ${account.email}`,
  )
}

await dataOrThrow(
  client
    .from('businesses')
    .update({
      name: 'RewardMe Partner',
      slug: 'rewardme-partner',
      description: 'Permanent RewardMe partner for member and business operations.',
    })
    .eq('id', business.id)
    .select('id')
    .single(),
  'RewardMe partner label update failed',
)

const catalogRenames = [
  {
    table: 'products',
    oldTitle: 'QA Coffee',
    title: 'Member Coffee',
    values: { description: 'RewardMe member catalog product.', highlight: 'Member favorite' },
  },
  {
    table: 'rewards',
    oldTitle: 'QA Welcome Reward',
    title: 'Welcome Reward',
    values: { description: 'RewardMe member catalog reward.', highlight: 'Welcome offer' },
  },
  {
    table: 'gift_card_catalog',
    oldTitle: 'QA Gift Card',
    title: 'RewardMe Gift Card',
    values: { description: 'RewardMe member gift card.' },
  },
  {
    table: 'promotions',
    oldTitle: 'QA Member Bonus',
    title: 'Member Bonus',
    values: {
      description: 'RewardMe member promotion.',
      badge: 'Member offer',
      cta: 'View partner',
      audience: 'RewardMe members',
    },
  },
]

for (const rename of catalogRenames) {
  const rows = await dataOrThrow(
    client
      .from(rename.table)
      .select('id,title')
      .eq('program_id', program.id)
      .eq('business_id', business.id)
      .in('title', [rename.oldTitle, rename.title]),
    `${rename.table} lookup failed`,
  )
  const newTitleExists = rows.some((row) => row.title === rename.title)
  const oldRows = rows.filter((row) => row.title === rename.oldTitle)

  for (const [index, row] of oldRows.entries()) {
    const title = newTitleExists || index > 0 ? `${rename.title} Archive ${index + 1}` : rename.title
    await dataOrThrow(
      client.from(rename.table).update({ title, ...rename.values }).eq('id', row.id).select('id').single(),
      `${rename.table} label update failed`,
    )
  }
}

const transactions = await dataOrThrow(
  client
    .from('member_transactions')
    .select('id,receipt_number,note')
    .eq('program_id', program.id)
    .eq('business_id', business.id),
  'RewardMe transaction label lookup failed',
)
const canonicalReceiptExists = transactions.some((transaction) => transaction.receipt_number === 'REWARDME-001')

for (const [index, transaction] of transactions.entries()) {
  const hasOldLabel = /\bqa\b|quality[\s-]+assurance/i.test(
    `${transaction.receipt_number ?? ''} ${transaction.note ?? ''}`,
  )
  if (!hasOldLabel) continue

  const receiptNumber = transaction.receipt_number === 'REWARDME-QA-001'
    ? canonicalReceiptExists
      ? `REWARDME-ARCHIVE-${String(index + 1).padStart(3, '0')}`
      : 'REWARDME-001'
    : transaction.receipt_number
  const note = String(transaction.note ?? '')
    .replace(/\bqa\b/gi, 'launch')
    .replace(/quality[\s-]+assurance/gi, 'launch review')

  await dataOrThrow(
    client
      .from('member_transactions')
      .update({ receipt_number: receiptNumber, note })
      .eq('id', transaction.id)
      .select('id')
      .single(),
    'RewardMe transaction label update failed',
  )
}

const activities = await dataOrThrow(
  client
    .from('activities')
    .select('id,title,description')
    .eq('program_id', program.id)
    .eq('business_id', business.id),
  'RewardMe activity label lookup failed',
)

for (const activity of activities) {
  const title = String(activity.title ?? '')
    .replaceAll('RewardMe QA Partner', 'RewardMe Partner')
    .replace(/\bqa\b/gi, 'launch')
  const description = String(activity.description ?? '')
    .replaceAll('REWARDME-QA-001', 'REWARDME-001')
    .replaceAll('RewardMe QA Partner', 'RewardMe Partner')
    .replace(/\bqa\b/gi, 'launch')
    .replace(/quality[\s-]+assurance/gi, 'launch review')

  if (title === activity.title && description === activity.description) continue
  await dataOrThrow(
    client.from('activities').update({ title, description }).eq('id', activity.id).select('id').single(),
    'RewardMe activity label update failed',
  )
}

const [verifiedProfiles, verifiedBusiness, verifiedProducts, verifiedRewards, verifiedGiftCards, verifiedPromotions, verifiedTransactions, verifiedActivities] = await Promise.all([
  dataOrThrow(client.from('profiles').select('email,full_name').in('email', permanentAccounts.map((account) => account.email)), 'Profile verification failed'),
  dataOrThrow(client.from('businesses').select('name,description').eq('id', business.id).single(), 'Business verification failed'),
  dataOrThrow(client.from('products').select('title,description,highlight').eq('business_id', business.id), 'Product verification failed'),
  dataOrThrow(client.from('rewards').select('title,description,highlight').eq('business_id', business.id), 'Reward verification failed'),
  dataOrThrow(client.from('gift_card_catalog').select('title,description').eq('business_id', business.id), 'Gift-card verification failed'),
  dataOrThrow(client.from('promotions').select('title,description,badge,cta,audience').eq('business_id', business.id), 'Promotion verification failed'),
  dataOrThrow(client.from('member_transactions').select('receipt_number,note').eq('business_id', business.id), 'Transaction verification failed'),
  dataOrThrow(client.from('activities').select('title,description').eq('business_id', business.id), 'Activity verification failed'),
])

const visibleRecords = [
  verifiedProfiles,
  verifiedBusiness,
  verifiedProducts,
  verifiedRewards,
  verifiedGiftCards,
  verifiedPromotions,
  verifiedTransactions,
  verifiedActivities,
]
const prohibitedMatch = JSON.stringify(visibleRecords).match(/\bqa\b|quality[\s-]+assurance/i)
if (prohibitedMatch) throw new Error(`A retired internal label remains in RewardMe visible data: ${prohibitedMatch[0]}`)

console.log(JSON.stringify({
  promotedAccounts: permanentAccounts.length,
  business: verifiedBusiness.name,
  catalogsVerified: verifiedProducts.length + verifiedRewards.length + verifiedGiftCards.length + verifiedPromotions.length,
  transactionsVerified: verifiedTransactions.length,
  activitiesVerified: verifiedActivities.length,
}, null, 2))
