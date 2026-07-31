import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('admin verification document loading', () => {
  it('checks object existence before requesting a signed URL', () => {
    const source = readFileSync(
      new URL('./admin-service.ts', import.meta.url),
      'utf8',
    )

    const listIndex = source.indexOf('bucket.list(folder')
    const signedUrlIndex = source.indexOf('bucket.createSignedUrl(documentPath')

    expect(listIndex).toBeGreaterThan(-1)
    expect(signedUrlIndex).toBeGreaterThan(listIndex)
    expect(source).toContain('objects?.some((entry) => entry.name === filename)')
    expect(source).toContain('profile.verificationDocumentPath = null')
  })
})
