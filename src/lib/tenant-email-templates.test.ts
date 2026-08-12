import { describe, expect, it } from 'vitest'

import { buildTenantEmail, tenantActionUrl, type TenantEmailBrand } from '../../api/_tenant-email-templates'

const brand: TenantEmailBrand = {
  name: 'RewardMe',
  hostname: 'loyalty-rewards-prog.vercel.app',
  supportEmail: 'support@rewardme.ph',
  primaryColor: '#176b45',
  accentColor: '#d7a832',
}

describe('tenant email templates', () => {
  for (const kind of ['welcome', 'invitation', 'password-recovery', 'email-verification', 'administrator-invitation', 'membership-request-received', 'membership-status-update'] as const) {
    it(`renders ${kind} with tenant identity`, () => {
      const email = buildTenantEmail({ kind, brand, recipientName: 'Shaun Example', actionUrl: tenantActionUrl(brand, '/signin?token=preview') })
      expect(email.subject).toContain(brand.name)
      expect(email.text).toContain(brand.hostname)
      expect(email.html).toContain(brand.supportEmail)
      expect(email.html).not.toContain('Medellin Rewards')
    })
  }

  it('rejects unsafe tenant hostnames', () => {
    expect(() => tenantActionUrl({ ...brand, hostname: 'javascript:alert(1)' }, '/signin')).toThrow()
  })
})
