import type { ApiErrorCode, Gift, PayResponse, Product, User } from '@tanku/shared'
import type { GiftRequest } from './gifts.ts'

/** The API answered with an error; `code` is UNKNOWN when there was no usable answer. */
export class ApiError extends Error {
  code: ApiErrorCode | 'UNKNOWN'

  constructor(code: ApiErrorCode | 'UNKNOWN') {
    super(code)
    this.code = code
  }
}

function errorCodeOf(body: unknown): ApiErrorCode | undefined {
  if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
    return body.error as ApiErrorCode
  }
  return undefined
}

/** Calls the API and returns its JSON; any failure becomes an ApiError. */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('UNKNOWN')
  }

  const data: unknown = await response.json().catch(() => undefined)
  if (!response.ok) throw new ApiError(errorCodeOf(data) ?? 'UNKNOWN')
  return data as T
}

export const api = {
  users: () => request<User[]>('GET', '/api/users'),
  /** The catalog ordered for `recipientId`: their avoided products are hidden. */
  productsFor: (recipientId: string) =>
    request<Product[]>('GET', `/api/products?recipientId=${encodeURIComponent(recipientId)}`),
  createGift: (gift: GiftRequest) => request<Gift>('POST', '/api/gifts', gift),
  pay: (giftId: string, cardNumber: string) =>
    request<PayResponse>('POST', `/api/gifts/${encodeURIComponent(giftId)}/pay`, { cardNumber }),
}
