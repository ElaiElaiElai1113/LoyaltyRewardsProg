export type PasswordSetupType = 'recovery' | 'invite'

export const PASSWORD_MIN_LENGTH = 12

const passwordSetupTypes = new Set<PasswordSetupType>(['recovery', 'invite'])

function parseParams(value: string) {
  return new URLSearchParams(value.startsWith('#') || value.startsWith('?') ? value.slice(1) : value)
}

export function isPasswordSetupType(value: string | null): value is PasswordSetupType {
  return value !== null && passwordSetupTypes.has(value as PasswordSetupType)
}

export function getPasswordSetupParams(search: string, hash: string) {
  const searchParams = parseParams(search)
  const hashParams = parseParams(hash)
  if (isPasswordSetupType(searchParams.get('type')) || searchParams.has('code')) {
    for (const [key, value] of searchParams) hashParams.set(key, value)
    return hashParams
  }

  return hashParams
}

export function getPasswordSetupType(search: string, hash: string) {
  const type = getPasswordSetupParams(search, hash).get('type')
  return isPasswordSetupType(type) ? type : null
}

export function getPasswordSetupRoute(type: PasswordSetupType) {
  return type === 'invite' ? '/accept-invitation' : '/reset-password'
}
