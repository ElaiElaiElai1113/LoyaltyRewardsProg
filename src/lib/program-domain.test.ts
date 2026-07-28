import { describe, expect, it } from 'vitest'

import {
  getCustomDomainCount,
  isPlatformHostname,
  isValidProgramHostname,
  normalizeProgramHostname,
} from '@/lib/program-domain'

describe('program domains', () => {
  it('normalizes a pasted URL to its hostname', () => {
    expect(normalizeProgramHostname(' HTTPS://Rewards.Example.com/path ')).toBe('rewards.example.com')
  })

  it('rejects malformed or path-only hostnames', () => {
    expect(isValidProgramHostname('rewards.example.com')).toBe(true)
    expect(isValidProgramHostname('localhost')).toBe(false)
    expect(isValidProgramHostname('-bad.example.com')).toBe(false)
  })

  it('does not count the supplied platform subdomain against the custom-domain limit', () => {
    expect(isPlatformHostname('tenant.rewardsplatform.app')).toBe(true)
    expect(getCustomDomainCount(['tenant.rewardsplatform.app', 'rewards.example.com'])).toBe(1)
  })
})
