import { describe, expect, it } from 'vitest'

import { signAgreementSchema } from './forms'

describe('signAgreementSchema', () => {
  it('rejects missing e-signature consent confirmations', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
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
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(false)
  })

  it('accepts a typed signature with both confirmations', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(true)
  })
})
