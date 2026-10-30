import { describe, expect, it } from 'vitest'
import { ApiError } from './api.ts'
import { errorMessage } from './errors.ts'
import { messages } from './i18n/es-CO.ts'

describe('errorMessage', () => {
  it('gives the Spanish text of a known API error code', () => {
    expect(errorMessage(new ApiError('INVALID_GIFT'))).toBe(messages['error.INVALID_GIFT'])
  })

  it('gives the generic text for a code it does not know', () => {
    expect(errorMessage(new ApiError('SOMETHING_NEW' as never))).toBe(messages['error.UNKNOWN'])
  })

  it('gives the generic text for an error that did not come from the API', () => {
    expect(errorMessage(new Error('boom'))).toBe(messages['error.UNKNOWN'])
  })
})
