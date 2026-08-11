const partnerHeaders = [
  'external_id', 'legal_name', 'display_name', 'slug', 'category', 'description',
  'location', 'address', 'currency', 'reward_rate_percent',
  'commission_rate_percent', 'settlement_cycle', 'owner_full_name',
  'owner_email', 'owner_phone', 'active', 'agreement_status',
]

const offerHeaders = [
  'external_id', 'business_external_id', 'title', 'description', 'offer_type',
  'reward_rate_percent', 'inventory', 'start_date', 'end_date', 'restrictions', 'active',
]

export function parseCsv(input) {
  const text = String(input ?? '').replace(/^\uFEFF/, '')
  const records = []
  let record = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true
    } else if (character === ',') {
      record.push(field.trim())
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      record.push(field.trim())
      if (record.some((value) => value !== '')) records.push(record)
      record = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field.')
  record.push(field.trim())
  if (record.some((value) => value !== '')) records.push(record)
  if (records.length === 0) return { headers: [], rows: [] }

  const headers = records[0]
  const rows = records.slice(1).map((values, index) => ({
    line: index + 2,
    values: Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ''])),
    extraValues: values.slice(headers.length),
  }))
  return { headers, rows }
}

function validateHeaders(actual, required, label, errors) {
  const missing = required.filter((header) => !actual.includes(header))
  const unexpected = actual.filter((header) => !required.includes(header))
  if (missing.length) errors.push(`${label} is missing header(s): ${missing.join(', ')}`)
  if (unexpected.length) errors.push(`${label} has unexpected header(s): ${unexpected.join(', ')}`)
  if (new Set(actual).size !== actual.length) errors.push(`${label} has duplicate headers`)
}

function requireFields(row, fields, label, errors) {
  for (const field of fields) {
    if (!row.values[field]?.trim()) errors.push(`${label} line ${row.line}: ${field} is required`)
  }
}

function numberInRange(value, minimum, maximum) {
  const number = Number(value)
  return Number.isFinite(number) && number >= minimum && number <= maximum
}

function validBoolean(value) {
  return value === 'true' || value === 'false'
}

function validIsoDate(value) {
  return value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function addDuplicateErrors(rows, field, label, errors) {
  const seen = new Set()
  for (const row of rows) {
    const value = row.values[field]?.trim().toLowerCase()
    if (!value) continue
    if (seen.has(value)) errors.push(`${label} line ${row.line}: duplicate ${field} ${value}`)
    seen.add(value)
  }
}

export function analyzeRewardMePartnerCatalog(partnerCsv, offerCsv) {
  const errors = []
  const warnings = []
  let partners
  let offers
  try {
    partners = parseCsv(partnerCsv)
    offers = parseCsv(offerCsv)
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'CSV parsing failed.'],
      warnings,
      summary: { partners: 0, activePartners: 0, offers: 0, activeOffers: 0 },
    }
  }

  validateHeaders(partners.headers, partnerHeaders, 'partners CSV', errors)
  validateHeaders(offers.headers, offerHeaders, 'offers CSV', errors)
  addDuplicateErrors(partners.rows, 'external_id', 'partners CSV', errors)
  addDuplicateErrors(partners.rows, 'slug', 'partners CSV', errors)
  addDuplicateErrors(offers.rows, 'external_id', 'offers CSV', errors)

  const partnerById = new Map()
  for (const row of partners.rows) {
    requireFields(row, [
      'external_id', 'legal_name', 'display_name', 'slug', 'category', 'location',
      'currency', 'reward_rate_percent', 'commission_rate_percent',
      'settlement_cycle', 'owner_full_name', 'owner_email', 'active', 'agreement_status',
    ], 'partners CSV', errors)
    const value = row.values
    if (value.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) {
      errors.push(`partners CSV line ${row.line}: slug must use lowercase letters, numbers and hyphens`)
    }
    if (value.currency && !/^[A-Z]{3}$/.test(value.currency)) {
      errors.push(`partners CSV line ${row.line}: currency must be a three-letter uppercase code`)
    }
    if (value.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.owner_email)) {
      errors.push(`partners CSV line ${row.line}: owner_email is invalid`)
    }
    if (value.reward_rate_percent && !numberInRange(value.reward_rate_percent, 0, 100)) {
      errors.push(`partners CSV line ${row.line}: reward_rate_percent must be from 0 to 100`)
    }
    if (value.commission_rate_percent && !numberInRange(value.commission_rate_percent, 0, 100)) {
      errors.push(`partners CSV line ${row.line}: commission_rate_percent must be from 0 to 100`)
    }
    if (value.active && !validBoolean(value.active)) {
      errors.push(`partners CSV line ${row.line}: active must be true or false`)
    }
    if (value.agreement_status && !['draft', 'sent', 'signed'].includes(value.agreement_status)) {
      errors.push(`partners CSV line ${row.line}: agreement_status must be draft, sent or signed`)
    }
    if (value.active === 'true' && value.agreement_status !== 'signed') {
      errors.push(`partners CSV line ${row.line}: an active partner must have a signed agreement`)
    }
    if (row.extraValues.some((entry) => entry.trim())) {
      errors.push(`partners CSV line ${row.line}: contains values without matching headers`)
    }
    if (value.external_id) partnerById.set(value.external_id.toLowerCase(), value)
  }

  for (const row of offers.rows) {
    requireFields(row, [
      'external_id', 'business_external_id', 'title', 'description', 'offer_type',
      'reward_rate_percent', 'inventory', 'start_date', 'end_date', 'restrictions', 'active',
    ], 'offers CSV', errors)
    const value = row.values
    const partner = partnerById.get(value.business_external_id?.toLowerCase())
    if (value.business_external_id && !partner) {
      errors.push(`offers CSV line ${row.line}: unknown business_external_id ${value.business_external_id}`)
    }
    if (value.offer_type && !['reward', 'discount', 'experience', 'gift-card'].includes(value.offer_type)) {
      errors.push(`offers CSV line ${row.line}: offer_type must be reward, discount, experience or gift-card`)
    }
    if (value.reward_rate_percent && !numberInRange(value.reward_rate_percent, 0, 100)) {
      errors.push(`offers CSV line ${row.line}: reward_rate_percent must be from 0 to 100`)
    }
    if (value.inventory && (!Number.isInteger(Number(value.inventory)) || Number(value.inventory) < 0)) {
      errors.push(`offers CSV line ${row.line}: inventory must be a non-negative integer`)
    }
    if (!validIsoDate(value.start_date) || !validIsoDate(value.end_date)) {
      errors.push(`offers CSV line ${row.line}: dates must use YYYY-MM-DD`)
    } else if (value.start_date && value.end_date && value.end_date < value.start_date) {
      errors.push(`offers CSV line ${row.line}: end_date must not be before start_date`)
    }
    if (value.active && !validBoolean(value.active)) {
      errors.push(`offers CSV line ${row.line}: active must be true or false`)
    }
    if (value.active === 'true' && partner?.active !== 'true') {
      errors.push(`offers CSV line ${row.line}: an active offer requires an active partner`)
    }
    if (row.extraValues.some((entry) => entry.trim())) {
      errors.push(`offers CSV line ${row.line}: contains values without matching headers`)
    }
  }

  if (partners.rows.length === 0) warnings.push('No partner rows were supplied.')
  if (offers.rows.length === 0) warnings.push('No offer rows were supplied.')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      partners: partners.rows.length,
      activePartners: partners.rows.filter((row) => row.values.active === 'true').length,
      offers: offers.rows.length,
      activeOffers: offers.rows.filter((row) => row.values.active === 'true').length,
    },
  }
}
