param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')][string]$ProgramSlug,
  [string]$OutputDirectory = 'artifacts\tenant-exports'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$psql = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin\psql.exe'
$connectionUrl = (Get-Content (Join-Path $repoRoot 'supabase\.temp\pooler-url') -Raw).Trim()
$securePassword = if ($env:SUPABASE_DB_PASSWORD) {
  ConvertTo-SecureString $env:SUPABASE_DB_PASSWORD -AsPlainText -Force
} else { Read-Host 'Supabase database password' -AsSecureString }
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$sql = @'
with target as (
  select id, slug, name, locale, currency, timezone from public.programs where slug = :'program_slug'
), payload as (
  select jsonb_build_object(
    'program', to_jsonb(target),
    'profiles', coalesce((select jsonb_agg(to_jsonb(x)) from public.profiles x where x.program_id = target.id), '[]'::jsonb),
    'memberships', coalesce((select jsonb_agg(to_jsonb(x)) from public.program_memberships x where x.program_id = target.id), '[]'::jsonb),
    'businesses', coalesce((select jsonb_agg(to_jsonb(x)) from public.businesses x where x.program_id = target.id), '[]'::jsonb),
    'balances', coalesce((select jsonb_agg(to_jsonb(x)) from public.reward_balances x where x.program_id = target.id), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(x)) from public.member_transactions x where x.program_id = target.id), '[]'::jsonb),
    'agreements', coalesce((select jsonb_agg(to_jsonb(x)) from public.agreement_acceptances x where x.program_id = target.id), '[]'::jsonb),
    'giftCards', coalesce((select jsonb_agg(to_jsonb(x)) from public.gift_cards x where x.program_id = target.id), '[]'::jsonb),
    'orders', coalesce((select jsonb_agg(to_jsonb(x)) from public.orders x where x.program_id = target.id), '[]'::jsonb)
  ) as value from target
) select jsonb_pretty(value) from payload;
'@
try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $json = (& $psql --dbname $connectionUrl --no-psqlrc --tuples-only --no-align --set ON_ERROR_STOP=1 --set "program_slug=$ProgramSlug" --command $sql) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0 -or -not $json.Trim()) { throw 'Program export failed or program was not found.' }
  $output = Join-Path $repoRoot $OutputDirectory
  New-Item -ItemType Directory -Path $output -Force | Out-Null
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $file = Join-Path $output "$ProgramSlug-$timestamp.json"
  $json | Set-Content $file -Encoding utf8
  $hash = (Get-FileHash $file -Algorithm SHA256).Hash
  [ordered]@{ program_slug = $ProgramSlug; file = (Split-Path $file -Leaf); sha256 = $hash; created_at_utc = (Get-Date).ToUniversalTime().ToString('o') } |
    ConvertTo-Json | Set-Content "$file.manifest.json" -Encoding utf8
  Write-Output "Tenant export: $file"
} finally {
  $env:PGPASSWORD = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
