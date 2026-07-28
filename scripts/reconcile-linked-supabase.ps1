$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$psql = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin\psql.exe'
$poolerFile = Join-Path $repoRoot 'supabase\.temp\pooler-url'
$projectRefFile = Join-Path $repoRoot 'supabase\.temp\project-ref'

if (-not (Test-Path -LiteralPath $psql)) {
  throw "PostgreSQL client not found at $psql"
}
if (-not (Test-Path -LiteralPath $poolerFile)) {
  throw 'Supabase project is not linked. Run supabase link first.'
}

$connectionUrl = (Get-Content -LiteralPath $poolerFile -Raw).Trim()
$projectRef = if (Test-Path -LiteralPath $projectRefFile) {
  (Get-Content -LiteralPath $projectRefFile -Raw).Trim()
} else {
  $null
}
$securePassword = if ($env:SUPABASE_DB_PASSWORD) {
  ConvertTo-SecureString $env:SUPABASE_DB_PASSWORD -AsPlainText -Force
} else {
  Read-Host 'Supabase database password' -AsSecureString
}
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

$sql = @'
with program_metrics as (
  select
    p.id,
    p.slug,
    p.name,
    jsonb_build_object(
      'profiles', (select count(*) from public.profiles x where x.program_id = p.id),
      'program_memberships', (select count(*) from public.program_memberships x where x.program_id = p.id),
      'businesses', (select count(*) from public.businesses x where x.program_id = p.id),
      'reward_balances', jsonb_build_object(
        'records', (select count(*) from public.reward_balances x where x.program_id = p.id),
        'points', (select coalesce(sum(x.points), 0) from public.reward_balances x where x.program_id = p.id),
        'available_credits', (select coalesce(sum(x.available_credits), 0) from public.reward_balances x where x.program_id = p.id)
      ),
      'orders', jsonb_build_object(
        'records', (select count(*) from public.orders x where x.program_id = p.id),
        'subtotal', (select coalesce(sum(x.subtotal), 0) from public.orders x where x.program_id = p.id),
        'tax', (select coalesce(sum(x.tax), 0) from public.orders x where x.program_id = p.id),
        'total', (select coalesce(sum(x.total), 0) from public.orders x where x.program_id = p.id),
        'points_earned', (select coalesce(sum(x.points_earned), 0) from public.orders x where x.program_id = p.id)
      ),
      'member_transactions', jsonb_build_object(
        'records', (select count(*) from public.member_transactions x where x.program_id = p.id),
        'purchase_amount', (select coalesce(sum(x.purchase_amount), 0) from public.member_transactions x where x.program_id = p.id),
        'reward_value', (select coalesce(sum(x.reward_value), 0) from public.member_transactions x where x.program_id = p.id),
        'points_awarded', (select coalesce(sum(x.points_awarded), 0) from public.member_transactions x where x.program_id = p.id),
        'commission_amount', (select coalesce(sum(x.commission_amount), 0) from public.member_transactions x where x.program_id = p.id)
      ),
      'agreement_acceptances', (select count(*) from public.agreement_acceptances x where x.program_id = p.id),
      'gift_cards', jsonb_build_object(
        'records', (select count(*) from public.gift_cards x where x.program_id = p.id),
        'points_spent', (select coalesce(sum(x.points_spent), 0) from public.gift_cards x where x.program_id = p.id),
        'active', (select count(*) from public.gift_cards x where x.program_id = p.id and x.status = 'active'),
        'redeemed', (select count(*) from public.gift_cards x where x.program_id = p.id and x.status = 'redeemed')
      ),
      'member_subscriptions', jsonb_build_object(
        'records', (select count(*) from public.memberships x where x.program_id = p.id),
        'price_cents', (select coalesce(sum(x.price_cents), 0) from public.memberships x where x.program_id = p.id)
      )
    ) as metrics
  from public.programs p
)
select jsonb_pretty(jsonb_build_object(
  'generated_at_utc', timezone('utc', now()),
  'database', current_database(),
  'programs', coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'slug', slug,
    'name', name,
    'metrics', metrics
  ) order by slug), '[]'::jsonb)
))
from program_metrics;
'@

try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $jsonText = (& $psql --dbname $connectionUrl --no-psqlrc --tuples-only --no-align --set ON_ERROR_STOP=1 --command $sql) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) {
    throw "Reconciliation query failed with exit code $LASTEXITCODE"
  }

  $report = $jsonText | ConvertFrom-Json
  $report | Add-Member -NotePropertyName project_ref -NotePropertyValue $projectRef
  $reportDirectory = Join-Path $repoRoot 'backups\reconciliation'
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $reportFile = Join-Path $reportDirectory "reconciliation-$timestamp.json"
  New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
  $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportFile -Encoding utf8

  Write-Output "Reconciliation report: $reportFile"
  foreach ($program in $report.programs) {
    Write-Output ("{0}: profiles={1}, businesses={2}, points={3}, order_total={4}, transaction_total={5}" -f `
      $program.slug,
      $program.metrics.profiles,
      $program.metrics.businesses,
      $program.metrics.reward_balances.points,
      $program.metrics.orders.total,
      $program.metrics.member_transactions.purchase_amount)
  }
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
