$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$clientBin = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin'
$pgDump = Join-Path $clientBin 'pg_dump.exe'
$pgRestore = Join-Path $clientBin 'pg_restore.exe'
$poolerFile = Join-Path $repoRoot 'supabase\.temp\pooler-url'

if (-not (Test-Path -LiteralPath $pgDump)) {
  throw "PostgreSQL client not found at $pgDump"
}

if (-not (Test-Path -LiteralPath $poolerFile)) {
  throw 'Supabase project is not linked. Run supabase link first.'
}

$connectionUrl = (Get-Content -LiteralPath $poolerFile -Raw).Trim()
$securePassword = Read-Host 'Supabase database password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupDirectory = Join-Path $repoRoot 'backups'
  $backupFile = Join-Path $backupDirectory "rewards-program-$timestamp.dump"

  New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

  & $pgDump `
    --dbname $connectionUrl `
    --format custom `
    --no-owner `
    --no-acl `
    --file $backupFile

  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
  }

  & $pgRestore --list $backupFile | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Backup verification failed with exit code $LASTEXITCODE"
  }

  $backup = Get-Item -LiteralPath $backupFile
  $hash = Get-FileHash -LiteralPath $backupFile -Algorithm SHA256
  Write-Output "Backup verified: $($backup.FullName)"
  Write-Output "Bytes: $($backup.Length)"
  Write-Output "SHA256: $($hash.Hash)"
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
