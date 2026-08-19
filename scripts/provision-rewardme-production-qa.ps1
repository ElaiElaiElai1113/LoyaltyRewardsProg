[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [switch]$Apply,
  [switch]$RunAuthenticatedChecks,
  [switch]$RunGiftCardChecks,
  [ValidateSet('RewardMe', 'Wondertown')]
  [string]$Target = 'RewardMe',
  [switch]$Reset,
  [switch]$ConfigureGitHubActions
)

$ErrorActionPreference = 'Stop'
$projectRef = 'bftuvmywtmpflizsomim'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

if ($Reset -and $Target -ne 'Wondertown') {
  throw '-Reset is available only for the dedicated Wondertown demo tenant.'
}

if (-not ('RewardMeCredentialReader' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class RewardMeCredentialReader
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct NativeCredential
    {
        public uint Flags;
        public uint Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public uint Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredRead(string target, uint type, uint reservedFlag, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", SetLastError = true)]
    private static extern void CredFree(IntPtr buffer);

    public static byte[] ReadGenericSecret(string target)
    {
        IntPtr credentialPtr;
        if (!CredRead(target, 1, 0, out credentialPtr))
        {
            throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
        }

        try
        {
            var credential = Marshal.PtrToStructure<NativeCredential>(credentialPtr);
            var secret = new byte[credential.CredentialBlobSize];
            if (secret.Length > 0)
            {
                Marshal.Copy(credential.CredentialBlob, secret, 0, secret.Length);
            }
            return secret;
        }
        finally
        {
            CredFree(credentialPtr);
        }
    }
}
'@
}

function Get-RewardMeManagementToken {
  $bytes = [RewardMeCredentialReader]::ReadGenericSecret('Supabase CLI:synergizebusinessgroup')
  $candidates = @(
    [Text.Encoding]::UTF8.GetString($bytes).Trim([char]0),
    [Text.Encoding]::Unicode.GetString($bytes).Trim([char]0)
  )
  $token = $candidates | Where-Object { $_ -match '^sbp_[A-Za-z0-9]+' } | Select-Object -First 1
  if (-not $token) {
    throw 'The saved Supabase management credential could not be decoded.'
  }
  return $token
}

function Test-KeyEnabled($record) {
  return -not ($record.PSObject.Properties.Name -contains 'disabled') -or $record.disabled -ne $true
}

function Get-KeyValue($record) {
  foreach ($property in @('api_key', 'key', 'value', 'secret')) {
    if ($record.PSObject.Properties.Name -contains $property) {
      $candidate = [string]$record.$property
      if ($candidate) { return $candidate }
    }
  }
  return $null
}

function Set-RepositorySecret {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  if ($Name -notmatch '^[A-Z][A-Z0-9_]*$') {
    throw "Invalid GitHub Actions secret name: $Name"
  }

  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = (Get-Command gh -ErrorAction Stop).Source
  $startInfo.WorkingDirectory = $repoRoot.Path
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  # Windows PowerShell 5.1 runs on a .NET version where ArgumentList is not
  # available. Secret names are validated above, so Arguments remains safe.
  $startInfo.Arguments = "secret set $Name"

  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  if (-not $process.Start()) { throw "Could not start GitHub CLI for $Name." }
  $process.StandardInput.Write($Value)
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) {
    throw "Could not configure GitHub secret ${Name}: $stderr$stdout"
  }
}

$accessToken = Get-RewardMeManagementToken
$headers = @{ Authorization = "Bearer $accessToken"; Accept = 'application/json' }
$keyResponse = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$projectRef/api-keys?reveal=true" -Headers $headers
$keys = if ($keyResponse -is [array]) {
  @($keyResponse)
} elseif ($keyResponse.PSObject.Properties.Name -contains 'api_keys') {
  @($keyResponse.api_keys)
} else {
  @($keyResponse)
}

$clientRecord = $keys |
  Where-Object { (Test-KeyEnabled $_) -and ($_.type -eq 'publishable' -or $_.name -eq 'anon') } |
  Sort-Object @{ Expression = { if ($_.type -eq 'publishable') { 0 } else { 1 } } } |
  Select-Object -First 1
$serverRecord = $keys |
  Where-Object { (Test-KeyEnabled $_) -and ($_.type -eq 'secret' -or $_.name -eq 'service_role') } |
  Sort-Object @{ Expression = { if ($_.type -eq 'secret') { 0 } else { 1 } } } |
  Select-Object -First 1
$clientKey = Get-KeyValue $clientRecord
$serverKey = Get-KeyValue $serverRecord

$preflight = [ordered]@{
  projectRef = $projectRef
  clientKeyAvailable = [bool]$clientKey
  clientKeyType = if ($clientRecord.type) { $clientRecord.type } else { $clientRecord.name }
  serverKeyAvailable = [bool]$serverKey
  serverKeyType = if ($serverRecord.type) { $serverRecord.type } else { $serverRecord.name }
  applyRequested = $Apply.IsPresent
  authenticatedChecksRequested = $RunAuthenticatedChecks.IsPresent
  giftCardChecksRequested = $RunGiftCardChecks.IsPresent
  target = $Target
  resetRequested = $Reset.IsPresent
  configureGitHubActionsRequested = $ConfigureGitHubActions.IsPresent
}
$preflight | ConvertTo-Json

if (-not $clientKey -or -not $serverKey) {
  throw 'RewardMe provisioning requires an active publishable/anon key and secret/service-role key.'
}

if ($ConfigureGitHubActions -and $PSCmdlet.ShouldProcess('GitHub repository', 'Configure encrypted RewardMe/Wondertown operations secrets')) {
  Set-RepositorySecret -Name 'VITE_SUPABASE_URL' -Value "https://$projectRef.supabase.co"
  Set-RepositorySecret -Name 'VITE_SUPABASE_ANON_KEY' -Value $clientKey
  Set-RepositorySecret -Name 'SUPABASE_SERVICE_ROLE_KEY' -Value $serverKey
  Set-RepositorySecret -Name 'E2E_PASSWORD' -Value 'Rewards 123!'
  Write-Output 'Configured four encrypted GitHub Actions secrets for reward-site operations.'
}
if (-not $Apply) {
  return
}

$operation = if ($Target -eq 'Wondertown' -and $Reset) {
  'Reset and reseed the isolated Wondertown demo tenant'
} elseif ($Target -eq 'Wondertown') {
  'Refresh the isolated Wondertown demo fixtures without deleting test history'
} else {
  'Provision isolated RewardMe QA accounts and fixtures'
}
if (-not $PSCmdlet.ShouldProcess($projectRef, $operation)) {
  return
}

$environmentNames = @(
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_PASSWORD',
  'QA_PROGRAM_SLUG'
)
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
  $projectUrl = "https://$projectRef.supabase.co"
  $env:SUPABASE_URL = $projectUrl
  $env:VITE_SUPABASE_URL = $projectUrl
  $env:VITE_SUPABASE_ANON_KEY = $clientKey
  $env:SUPABASE_SERVICE_ROLE_KEY = $serverKey
  $env:E2E_PASSWORD = 'Rewards 123!'
  $env:QA_PROGRAM_SLUG = 'pinas'

  Push-Location $repoRoot
  try {
    if ($Target -eq 'Wondertown') {
      $wondertownArguments = @('scripts/provision-wondertown-demo.mjs')
      if ($Reset) {
        $wondertownArguments += @('--reset', '--confirm-reset-wondertown')
      }
      & node @wondertownArguments
    } else {
      & node scripts/provision-tenant-qa-fixtures.mjs
    }
    if ($LASTEXITCODE -ne 0) {
      throw "$Target fixture provisioning failed with exit code $LASTEXITCODE."
    }

    if ($RunAuthenticatedChecks) {
      if ($Target -eq 'Wondertown') {
        & npm.cmd run test:e2e:wondertown-demo
        if ($LASTEXITCODE -ne 0) {
          throw "Wondertown authenticated Playwright checks failed with exit code $LASTEXITCODE."
        }
      } else {
        & npm.cmd run test:e2e:rewardme-accounts
        if ($LASTEXITCODE -ne 0) {
          throw "Published-account Playwright checks failed with exit code $LASTEXITCODE."
        }

        & npm.cmd run test:e2e:rewardme-safe
        if ($LASTEXITCODE -ne 0) {
          throw "Hosted-safe RewardMe Playwright checks failed with exit code $LASTEXITCODE."
        }
      }
    }

    if ($RunGiftCardChecks) {
      $giftCardScript = if ($Target -eq 'Wondertown') {
        'test:e2e:wondertown-gift-cards-live'
      } else {
        'test:e2e:rewardme-gift-cards-live'
      }
      & npm.cmd run $giftCardScript
      if ($LASTEXITCODE -ne 0) {
        throw "$Target live gift-card Playwright checks failed with exit code $LASTEXITCODE."
      }
    }

    if ($RunAuthenticatedChecks -or $RunGiftCardChecks) {
      & npm.cmd run qa:verify-reward-sites
      if ($LASTEXITCODE -ne 0) {
        throw "RewardMe/Wondertown deep verification failed with exit code $LASTEXITCODE."
      }
    }
  } finally {
    Pop-Location
  }
} finally {
  foreach ($name in $environmentNames) {
    $previous = $previousEnvironment[$name]
    if ($null -eq $previous) {
      Remove-Item "Env:$name" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($name, $previous, 'Process')
    }
  }
  $accessToken = $null
  $clientKey = $null
  $serverKey = $null
}
