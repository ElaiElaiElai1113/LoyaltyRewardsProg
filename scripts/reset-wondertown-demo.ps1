[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [switch]$RunAuthenticatedChecks,
  [switch]$RunGiftCardChecks
)

$ErrorActionPreference = 'Stop'
$manager = Join-Path $PSScriptRoot 'provision-rewardme-production-qa.ps1'

if (-not $PSCmdlet.ShouldProcess(
  'Wondertown only',
  'Delete Wondertown demo activity and catalog data, restore the permanent fixtures, and keep every other rewards program unchanged'
)) {
  return
}

& $manager -Apply -Target Wondertown -Reset -RunAuthenticatedChecks:$RunAuthenticatedChecks -RunGiftCardChecks:$RunGiftCardChecks -Confirm:$false
if ($LASTEXITCODE -ne 0) {
  throw "Wondertown reset failed with exit code $LASTEXITCODE."
}
