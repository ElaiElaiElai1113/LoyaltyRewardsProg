param(
  [string]$BackupDirectory = 'backups',
  [int]$DailyDays = 14,
  [int]$WeeklyDays = 56,
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$root = Join-Path $repoRoot $BackupDirectory
if (-not (Test-Path -LiteralPath $root)) { Write-Output 'No backup directory found.'; exit 0 }
$now = Get-Date
$candidates = Get-ChildItem -LiteralPath $root -Filter '*.dump' -File | Where-Object {
  $age = ($now - $_.LastWriteTime).TotalDays
  $age -gt $WeeklyDays -or ($age -gt $DailyDays -and $_.LastWriteTime.DayOfWeek -ne 'Sunday')
}
foreach ($file in $candidates) {
  $resolved = $file.FullName
  if (-not $resolved.StartsWith((Resolve-Path $root).Path, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing path outside backup directory: $resolved"
  }
  $action = if ($Apply) { 'Removing' } else { 'Would remove' }
  Write-Output "${action}: $resolved"
  if ($Apply) {
    Remove-Item -LiteralPath $resolved
    if (Test-Path -LiteralPath "$resolved.manifest.json") { Remove-Item -LiteralPath "$resolved.manifest.json" }
  }
}
Write-Output "Retention review complete: $($candidates.Count) candidate(s). Apply=$Apply"
