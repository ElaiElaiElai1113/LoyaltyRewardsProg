param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')][string]$ProgramSlug,
  [string]$OutputDirectory = 'artifacts\audit-exports'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$psql = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin\psql.exe'
$connectionUrl = (Get-Content (Join-Path $repoRoot 'supabase\.temp\pooler-url') -Raw).Trim()
$securePassword = if ($env:SUPABASE_DB_PASSWORD) { ConvertTo-SecureString $env:SUPABASE_DB_PASSWORD -AsPlainText -Force } else { Read-Host 'Supabase database password' -AsSecureString }
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$sql = @'
with target as (select id from public.programs where slug = :'program_slug')
select jsonb_pretty(jsonb_build_object(
  'programSlug', :'program_slug',
  'adminLogs', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.admin_logs x, target where x.program_id = target.id), '[]'::jsonb),
  'domains', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.program_domains x, target where x.program_id = target.id), '[]'::jsonb),
  'memberships', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.program_memberships x, target where x.program_id = target.id), '[]'::jsonb),
  'importBatches', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.tenant_import_batches x, target where x.program_id = target.id), '[]'::jsonb)
));
'@
try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $json = (& $psql --dbname $connectionUrl --no-psqlrc --tuples-only --no-align --set ON_ERROR_STOP=1 --set "program_slug=$ProgramSlug" --command $sql) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'Audit export failed. Migration 20260730000000 must be applied first.' }
  $output = Join-Path $repoRoot $OutputDirectory
  New-Item -ItemType Directory -Path $output -Force | Out-Null
  $file = Join-Path $output "$ProgramSlug-audit-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
  $json | Set-Content $file -Encoding utf8
  Write-Output "Audit export: $file"
} finally {
  $env:PGPASSWORD = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
