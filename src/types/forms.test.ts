import { describe, expect, it } from 'vitest'

import { PASSWORD_MIN_LENGTH } from '@/lib/password-setup'

import { memberSignUpSchema, profileSchema, signAgreementSchema } from './forms'

const drawnSignatureSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" data-signature="drawn"><path d="M 10 10 L 60 45" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

describe('signAgreementSchema', () => {
  it('rejects missing e-signature consent confirmations', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      signatureSvg: drawnSignatureSvg,
      acceptedElectronicRecords: false,
      acceptedTerms: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.acceptedElectronicRecords).toContain(
        'Electronic records consent is required',
      )
      expect(result.error.flatten().fieldErrors.acceptedTerms).toContain(
        'Agreement confirmation is required',
      )
    }
  })

  it('rejects blank typed signatures', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: '',
      signatureSvg: drawnSignatureSvg,
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing drawn signatures', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      signatureSvg: '',
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.signatureSvg).toContain('Draw your signature')
    }
  })

  it('accepts typed and drawn signatures with both confirmations', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      signatureSvg: drawnSignatureSvg,
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(true)
  })
})

describe('profileSchema', () => {
  it('allows a member to save required contact details without optional preferences', () => {
    expect(profileSchema.safeParse({
      fullName: 'E2E Verified Customer',
      phone: '+57 300 123 4567',
      location: '',
      favoriteOrder: '',
    }).success).toBe(true)
  })
})

describe('memberSignUpSchema', () => {
  const validSubmission = {
    fullName: 'RewardMe Member',
    email: 'member@example.com',
    phone: '+63 900 000 0000',
    role: 'customer' as const,
  }

  it('rejects a password one character below the shared minimum', () => {
    const result = memberSignUpSchema.safeParse({
      ...validSubmission,
      password: 'a'.repeat(PASSWORD_MIN_LENGTH - 1),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        `Use at least ${PASSWORD_MIN_LENGTH} characters`,
      )
    }
  })

  it('accepts a password exactly at the shared minimum', () => {
    expect(memberSignUpSchema.safeParse({
      ...validSubmission,
      password: 'a'.repeat(PASSWORD_MIN_LENGTH),
    }).success).toBe(true)
  })
})
