[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'

if (-not ('WindowsCredentialReader' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class WindowsCredentialReader
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

function Get-SupabaseAccessToken {
  $bytes = [WindowsCredentialReader]::ReadGenericSecret('Supabase CLI:supabase')
  $candidates = @(
    [Text.Encoding]::UTF8.GetString($bytes).Trim([char]0),
    [Text.Encoding]::Unicode.GetString($bytes).Trim([char]0)
  )
  $token = $candidates | Where-Object { $_ -match '^sbp_[A-Za-z0-9]+' } | Select-Object -First 1
  if (-not $token) {
    throw 'The Supabase CLI credential could not be decoded.'
  }
  return $token
}

$projectRef = 'retfuxpfstatpdsunkgj'
$endpoint = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$headers = @{
  Accept = 'application/json'
  Authorization = "Bearer $(Get-SupabaseAccessToken)"
}

$current = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
$requiredRedirects = @(
  'https://www.medellinrewards.com/',
  'https://www.medellinrewards.com/reset-password',
  'https://www.medellinrewards.com/auth/confirm',
  'https://www.medellinrewards.com/auth/reset-password',
  'https://www.medellinrewards.com/accept-invitation',
  'https://guatemalarewards.com/',
  'https://guatemalarewards.com/reset-password',
  'https://guatemalarewards.com/auth/confirm',
  'https://guatemalarewards.com/auth/reset-password',
  'https://guatemalarewards.com/accept-invitation',
  'https://pinas-rewards.vercel.app/',
  'https://pinas-rewards.vercel.app/reset-password',
  'https://pinas-rewards.vercel.app/auth/confirm',
  'https://pinas-rewards.vercel.app/auth/reset-password',
  'https://pinas-rewards.vercel.app/accept-invitation',
  'https://synergize-rewards.vercel.app/',
  'https://synergize-rewards.vercel.app/reset-password',
  'https://synergize-rewards.vercel.app/auth/confirm',
  'https://synergize-rewards.vercel.app/auth/reset-password',
  'https://synergize-rewards.vercel.app/accept-invitation',
  'http://localhost:5173/**',
  'http://127.0.0.1:5173/**',
  'http://127.0.0.1:5177/**',
  'http://127.0.0.1:5275/**'
)

$existingRedirects = @($current.uri_allow_list -split ',') |
  ForEach-Object { $_.Trim() } |
  Where-Object {
    $_ -and
    $_ -notin @('http://localhost:3000', 'http://localhost:3000/**')
  }
$redirects = @($existingRedirects + $requiredRedirects) | Sort-Object -Unique
$desiredSiteUrl = 'https://pinas-rewards.vercel.app/'

$preview = [ordered]@{
  projectRef = $projectRef
  currentSiteUrl = $current.site_url
  desiredSiteUrl = $desiredSiteUrl
  currentRedirectCount = @($existingRedirects).Count
  desiredRedirectCount = $redirects.Count
  requiredRedirectsPresent = @($requiredRedirects | Where-Object { $_ -in $redirects }).Count -eq $requiredRedirects.Count
  applyRequested = $Apply.IsPresent
}
$preview | ConvertTo-Json

if (-not $Apply) {
  return
}

if ($PSCmdlet.ShouldProcess($projectRef, 'Update Supabase Auth site URL and redirect allowlist')) {
  $body = @{
    site_url = $desiredSiteUrl
    uri_allow_list = $redirects -join ','
  } | ConvertTo-Json

  $updated = Invoke-RestMethod -Method Patch -Uri $endpoint -Headers $headers -ContentType 'application/json' -Body $body
  [ordered]@{
    projectRef = $projectRef
    siteUrl = $updated.site_url
    redirectCount = @($updated.uri_allow_list -split ',').Count
    updated = $true
  } | ConvertTo-Json
}
