import type { Gift } from '@tanku/shared'

/** The longest message the API accepts. */
export const MAX_MESSAGE_LENGTH = 280

/** The variant choice that means "what they told us in their taste card": no variant is sent. */
export const AS_THEY_LIKE = ''

/** A gift can be paid while it waits for its payment or after a rejection (a retry). */
export function canPay(gift: Gift): boolean {
  return gift.status === 'payment_pending' || gift.status === 'payment_failed'
}

export interface GiftRequest {
  giverId: string
  recipientId: string
  productId: string
  variantId?: string
  message: string
}

/** The body of `POST /api/gifts` for what the giver filled in. */
export function buildGiftRequest(input: {
  giverId: string
  recipientId: string
  productId: string
  variantChoice: string
  message: string
}): GiftRequest {
  const { giverId, recipientId, productId, variantChoice, message } = input
  const request: GiftRequest = { giverId, recipientId, productId, message: message.trim() }
  if (variantChoice !== AS_THEY_LIKE) request.variantId = variantChoice
  return request
}
