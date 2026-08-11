[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$PreflightOnly,
  [switch]$KeepLocalStack
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$expectedConfig = Join-Path $repoRoot 'supabase\config.toml'
if (-not (Test-Path -LiteralPath $expectedConfig)) {
  throw 'Run this script from the RewardMe repository containing supabase/config.toml.'
}

function Get-RequiredCommand {
  param([Parameter(Mandatory = $true)][string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "$Name is required but is not installed or available on PATH."
  }
  return $command.Source
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [switch]$SuppressOutput
  )

  if ($SuppressOutput) {
    & $FilePath @Arguments | Out-Null
  }
  else {
    & $FilePath @Arguments
  }
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Get-StatusValue {
  param(
    [Parameter(Mandatory = $true)]$Status,
    [Parameter(Mandatory = $true)][string[]]$Names
  )

  foreach ($name in $Names) {
    $property = $Status.PSObject.Properties[$name]
    if ($property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
      return [string]$property.Value
    }
  }
  return $null
}

$docker = Get-Command 'docker.exe' -ErrorAction SilentlyContinue
if (-not $docker) {
  [Console]::Error.WriteLine('Docker Desktop (or another Docker-compatible runtime) is required for isolated Supabase QA. Install and start it, then rerun npm run qa:isolated.')
  exit 2
}

$dockerVersion = & $docker.Source version --format '{{.Server.Version}}' 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($dockerVersion | Out-String))) {
  [Console]::Error.WriteLine('Docker is installed, but its engine is not ready. Start Docker Desktop and wait for the engine before retrying.')
  exit 3
}

$npx = Get-RequiredCommand 'npx.cmd'
$npm = Get-RequiredCommand 'npm.cmd'
$supabaseVersion = & $npx supabase --version
if ($LASTEXITCODE -ne 0) {
  throw 'The project-local Supabase CLI could not be executed.'
}

$preflight = [ordered]@{
  passed = $true
  dockerServerVersion = ($dockerVersion | Out-String).Trim()
  supabaseCliVersion = ($supabaseVersion | Out-String).Trim()
  repository = $repoRoot
  localOnly = $true
}
Write-Output ($preflight | ConvertTo-Json -Compress)

if ($PreflightOnly) {
  exit 0
}
if (-not $Apply) {
  throw 'Use -Apply (or npm run qa:isolated) to reset the disposable local database and run authenticated workflows.'
}

$stackStarted = $false
Push-Location $repoRoot
try {
  Invoke-Checked -FilePath $npx -Arguments @('supabase', 'start', '--yes') -SuppressOutput
  $stackStarted = $true
  Invoke-Checked -FilePath $npx -Arguments @('supabase', 'db', 'reset', '--local', '--yes')

  $statusJson = & $npx supabase status --output json
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not read local Supabase status.'
  }
  $status = ($statusJson | Out-String) | ConvertFrom-Json
  $apiUrl = Get-StatusValue -Status $status -Names @('API_URL', 'api_url')
  $anonKey = Get-StatusValue -Status $status -Names @('ANON_KEY', 'PUBLISHABLE_KEY', 'anon_key', 'publishable_key')
  $serviceRoleKey = Get-StatusValue -Status $status -Names @('SERVICE_ROLE_KEY', 'SECRET_KEY', 'service_role_key', 'secret_key')
  if (-not $apiUrl -or -not $anonKey -or -not $serviceRoleKey) {
    throw 'Local Supabase status did not return the API, browser, and service-role values required for QA.'
  }
  if ($apiUrl -notmatch '^http://(127\.0\.0\.1|localhost):54321/?$') {
    throw "Refusing non-local Supabase URL: $apiUrl"
  }

  $env:VITE_SUPABASE_URL = $apiUrl
  $env:VITE_SUPABASE_ANON_KEY = $anonKey
  $env:SUPABASE_URL = $apiUrl
  $env:SUPABASE_SERVICE_ROLE_KEY = $serviceRoleKey
  $env:E2E_AUTH_ENABLED = 'true'
  $env:E2E_PASSWORD = 'Rewards 123!'
  $env:VITE_SHOW_PUBLIC_QA_CREDENTIALS = 'true'

  $env:QA_PROGRAM_SLUG = 'pinas'
  $env:E2E_REWARDME_RECOVERY_REDIRECT = 'http://pinas.localhost:5177/reset-password'
  Invoke-Checked -FilePath $npm -Arguments @('run', 'qa:provision-tenant')

  # Run the deterministic platform workflows against the disposable seeded tenant.
  $env:E2E_TENANT_SLUG = 'medellin'
  $env:E2E_CUSTOMER_EMAIL = 'customer@medellin.test'
  $env:E2E_UNVERIFIED_CUSTOMER_EMAIL = 'unverified@medellin.test'
  $env:E2E_BUSINESS_STAFF_EMAIL = 'staff@velvetbrew.test'
  $env:E2E_BUSINESS_OWNER_EMAIL = 'owner@velvetbrew.test'
  $env:E2E_ADMIN_EMAIL = 'admin@medellin.test'
  $env:E2E_AGREEMENT_PENDING_CUSTOMER_EMAIL = 'agreement-pending-customer@medellin.test'
  $env:E2E_AGREEMENT_PENDING_BUSINESS_OWNER_EMAIL = 'agreement-pending-owner@velvetbrew.test'
  $env:E2E_AGREEMENT_UNSIGNED_CUSTOMER_EMAIL = 'agreement-unsigned-customer@medellin.test'
  Invoke-Checked -FilePath $npm -Arguments @('run', 'test:e2e:workflows')

  # Then validate the RewardMe-specific provisioned tenant and all three roles.
  $env:E2E_TENANT_SLUG = 'pinas'
  $env:E2E_INCLUDE_TENANT_AUTH_SMOKE = 'true'
  $env:E2E_TENANT_NAME = 'RewardMe'
  $env:E2E_TENANT_CUSTOMER_EMAIL = 'member@rewardme.test'
  $env:E2E_TENANT_BUSINESS_OWNER_EMAIL = 'owner@rewardme.test'
  $env:E2E_TENANT_BUSINESS_STAFF_EMAIL = 'staff@rewardme.test'
  $env:E2E_TENANT_BUSINESS_NAME = 'RewardMe QA Partner'
  $env:E2E_TENANT_PRODUCT_NAME = 'QA Coffee'
  $env:E2E_TENANT_REWARD_NAME = 'QA Welcome Reward'
  $env:E2E_TENANT_GIFT_CARD_NAME = 'QA Gift Card'
  Invoke-Checked -FilePath $npx -Arguments @(
    'playwright',
    'test',
    'tests/e2e/tenant-authenticated-smoke.spec.ts',
    '--config=playwright.local.config.ts',
    '--workers=1'
  )

  Write-Output 'RewardMe isolated QA completed successfully.'
}
finally {
  Pop-Location
  if ($stackStarted -and -not $KeepLocalStack) {
    Push-Location $repoRoot
    try {
      & $npx supabase stop --no-backup
    }
    finally {
      Pop-Location
    }
  }
}
