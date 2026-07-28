param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[0-9a-fA-F-]{36}$')][string]$UserId,
  [string]$OutputDirectory = 'artifacts\privacy-exports'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$psql = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin\psql.exe'
$connectionUrl = (Get-Content (Join-Path $repoRoot 'supabase\.temp\pooler-url') -Raw).Trim()
$securePassword = if ($env:SUPABASE_DB_PASSWORD) { ConvertTo-SecureString $env:SUPABASE_DB_PASSWORD -AsPlainText -Force } else { Read-Host 'Supabase database password' -AsSecureString }
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$sql = @'
select jsonb_pretty(jsonb_build_object(
  'generatedAtUtc', now(),
  'profile', (select to_jsonb(x) from public.profiles x where x.id = :'user_id'::uuid),
  'programMemberships', coalesce((select jsonb_agg(to_jsonb(x)) from public.program_memberships x where x.user_id = :'user_id'::uuid), '[]'::jsonb),
  'balances', coalesce((select jsonb_agg(to_jsonb(x)) from public.reward_balances x where x.profile_id = :'user_id'::uuid), '[]'::jsonb),
  'agreementAcceptances', coalesce((select jsonb_agg(to_jsonb(x)) from public.agreement_acceptances x where x.profile_id = :'user_id'::uuid), '[]'::jsonb),
  'transactions', coalesce((select jsonb_agg(to_jsonb(x)) from public.member_transactions x where x.profile_id = :'user_id'::uuid), '[]'::jsonb)
));
'@
try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $json = (& $psql --dbname $connectionUrl --no-psqlrc --tuples-only --no-align --set ON_ERROR_STOP=1 --set "user_id=$UserId" --command $sql) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0 -or -not $json.Trim()) { throw 'Privacy export failed.' }
  $output = Join-Path $repoRoot $OutputDirectory
  New-Item -ItemType Directory -Path $output -Force | Out-Null
  $file = Join-Path $output "$UserId-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
  $json | Set-Content $file -Encoding utf8
  $hash = (Get-FileHash $file -Algorithm SHA256).Hash
  [ordered]@{ user_id = $UserId; sha256 = $hash; created_at_utc = (Get-Date).ToUniversalTime().ToString('o') } |
    ConvertTo-Json | Set-Content "$file.manifest.json" -Encoding utf8
  Write-Output "Privacy export: $file"
} finally {
  $env:PGPASSWORD = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
