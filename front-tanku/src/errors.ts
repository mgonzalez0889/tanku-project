import { ApiError } from './api.ts'
import { messages } from './i18n/es-CO.ts'
import { t, type MessageKey } from './i18n/index.ts'

/** The Spanish text for any error: an API code we know, or the generic one. */
export function errorMessage(error: unknown): string {
  const key = `error.${error instanceof ApiError ? error.code : 'UNKNOWN'}`
  return t(key in messages ? (key as MessageKey) : 'error.UNKNOWN')
}
