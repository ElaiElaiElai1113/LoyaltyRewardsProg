param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$pgRestore = Join-Path $repoRoot '.tools\postgresql-17.10\pgsql\bin\pg_restore.exe'
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
$manifestFile = "$resolvedBackup.manifest.json"

if (-not (Test-Path -LiteralPath $pgRestore)) {
  throw "PostgreSQL restore client not found at $pgRestore"
}

if (-not (Test-Path -LiteralPath $manifestFile)) {
  throw "Backup manifest not found at $manifestFile"
}

$manifest = Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
$backup = Get-Item -LiteralPath $resolvedBackup
$hash = Get-FileHash -LiteralPath $resolvedBackup -Algorithm SHA256
$archiveLines = & $pgRestore --list $resolvedBackup

if ($LASTEXITCODE -ne 0) {
  throw "pg_restore could not read the backup archive (exit code $LASTEXITCODE)"
}

$archiveEntries = ($archiveLines | Where-Object { $_ -and -not $_.StartsWith(';') }).Count
$errors = @()

if ($backup.Length -ne [long]$manifest.bytes) {
  $errors += "Size mismatch: expected $($manifest.bytes), found $($backup.Length)"
}
if ($hash.Hash -ne $manifest.sha256) {
  $errors += "SHA256 mismatch: expected $($manifest.sha256), found $($hash.Hash)"
}
if ($archiveEntries -ne [int]$manifest.archive_entries) {
  $errors += "Archive entry mismatch: expected $($manifest.archive_entries), found $archiveEntries"
}

if ($errors.Count -gt 0) {
  throw ($errors -join [Environment]::NewLine)
}

Write-Output "Backup is structurally valid: $resolvedBackup"
Write-Output "Project: $($manifest.project_ref)"
Write-Output "Bytes: $($backup.Length)"
Write-Output "SHA256: $($hash.Hash)"
Write-Output "Archive entries: $archiveEntries"
Write-Output 'A real restore drill still requires a disposable PostgreSQL or Supabase environment.'
