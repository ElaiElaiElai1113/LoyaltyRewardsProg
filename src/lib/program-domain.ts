export const platformDomainSuffix = '.rewardsplatform.app'

export function normalizeProgramHostname(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

export function isValidProgramHostname(hostname: string) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)
}

export function isPlatformHostname(hostname: string) {
  return hostname.endsWith(platformDomainSuffix)
}

export function getCustomDomainCount(hostnames: string[]) {
  return hostnames.filter((hostname) => !isPlatformHostname(hostname)).length
}
