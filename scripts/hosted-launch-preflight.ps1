param(
  [string]$BackupFile = '',
  [string]$OutputDirectory = 'artifacts\hosted-preflight'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$psql = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin\psql.exe'
$poolerFile = Join-Path $repoRoot 'supabase\.temp\pooler-url'
$preflightSql = Join-Path $repoRoot 'supabase\preflight\tenant-launch-preflight.sql'
$performanceSql = Join-Path $repoRoot 'supabase\preflight\tenant-performance.sql'

if (-not (Test-Path -LiteralPath $psql)) { throw "PostgreSQL client not found at $psql" }
if (-not (Test-Path -LiteralPath $poolerFile)) { throw 'Supabase project is not linked.' }
if (-not $BackupFile) {
  $BackupFile = (Get-ChildItem (Join-Path $repoRoot 'backups') -Filter '*.dump' |
    Where-Object Length -gt 0 | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}
if (-not $BackupFile) { throw 'No non-empty backup was found.' }

$securePassword = if ($env:SUPABASE_DB_PASSWORD) {
  ConvertTo-SecureString $env:SUPABASE_DB_PASSWORD -AsPlainText -Force
} else {
  Read-Host 'Supabase database password' -AsSecureString
}
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$output = Join-Path $repoRoot $OutputDirectory
New-Item -ItemType Directory -Path $output -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

try {
  $env:SUPABASE_DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
  $connectionUrl = (Get-Content -LiteralPath $poolerFile -Raw).Trim()

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'validate-supabase-backup.ps1') -BackupFile $BackupFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup validation failed.' }

  $migrationStatus = (& npx.cmd supabase migration list --linked 2>&1) -join [Environment]::NewLine
  $migrationStatus | Set-Content (Join-Path $output "migration-status-$timestamp.txt") -Encoding utf8

  $quality = (& $psql --dbname $connectionUrl --no-psqlrc --set ON_ERROR_STOP=1 --file $preflightSql) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'Tenant data-quality preflight failed.' }
  $quality | Set-Content (Join-Path $output "data-quality-$timestamp.txt") -Encoding utf8

  $performance = (& $psql --dbname $connectionUrl --no-psqlrc --set ON_ERROR_STOP=1 --file $performanceSql) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'Tenant performance preflight failed.' }
  $performance | Set-Content (Join-Path $output "performance-$timestamp.txt") -Encoding utf8

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'reconcile-linked-supabase.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Reconciliation failed.' }

  $manifest = [ordered]@{
    generated_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    project_ref = (Get-Content (Join-Path $repoRoot 'supabase\.temp\project-ref') -Raw).Trim()
    backup = (Resolve-Path $BackupFile).Path
    migration_status = "migration-status-$timestamp.txt"
    data_quality = "data-quality-$timestamp.txt"
    performance = "performance-$timestamp.txt"
    reconciliation_directory = 'backups\reconciliation'
    passed = $true
  }
  $manifest | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $output "manifest-$timestamp.json") -Encoding utf8
  Write-Output "Hosted preflight evidence: $output"
} finally {
  $env:PGPASSWORD = $null
  $env:SUPABASE_DB_PASSWORD = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
