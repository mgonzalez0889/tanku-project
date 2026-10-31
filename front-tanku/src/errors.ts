import { ApiError } from './api.ts'
import { hasKey, t } from './i18n/index.ts'

/** The Spanish text for any error: an API code we know, or the generic one. */
export function errorMessage(error: unknown): string {
  const key = `error.${error instanceof ApiError ? error.code : 'UNKNOWN'}`
  return t(hasKey(key) ? key : 'error.UNKNOWN')
}
