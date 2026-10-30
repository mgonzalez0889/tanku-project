import type { Gift, Product, User } from '@tanku/shared'

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

/** The gift in its place if the list already has it, or added at the end. Never changes `gifts`. */
export function upsertGift(gifts: Gift[], gift: Gift): Gift[] {
  return gifts.some((known) => known.id === gift.id)
    ? gifts.map((known) => (known.id === gift.id ? gift : known))
    : [...gifts, gift]
}

/** What the user gave and what the user received, each in the order of `gifts`. */
export function splitGifts(gifts: Gift[], userId: string): { given: Gift[]; received: Gift[] } {
  return {
    given: gifts.filter((gift) => gift.giverId === userId),
    received: gifts.filter((gift) => gift.recipientId === userId),
  }
}

export const userName = (users: User[], userId: string): string =>
  users.find((user) => user.id === userId)?.name ?? userId

export const productName = (products: Product[], productId: string): string =>
  products.find((product) => product.id === productId)?.name ?? productId

const variantLabel = (products: Product[], productId: string, variantId: string): string =>
  products.find((product) => product.id === productId)?.variants.find((variant) => variant.id === variantId)?.label ??
  variantId

/** A live event the user is told about: a gift arrived, or the recipient accepted it. */
export interface Notice {
  id: number
  type: 'received' | 'accepted'
  gift: Gift
}

/** The text key and its values for a notice (the text is chosen when it is drawn, not when it arrives). */
export function noticeText(
  notice: Notice,
  users: User[],
  products: Product[],
): { key: 'notice.received' | 'notice.accepted' | 'notice.changed'; values: Record<string, string> } {
  const { gift } = notice
  if (notice.type === 'received') {
    return { key: 'notice.received', values: { name: userName(users, gift.giverId) } }
  }

  const name = userName(users, gift.recipientId)
  if (gift.originalVariantId === undefined) return { key: 'notice.accepted', values: { name } }
  return {
    key: 'notice.changed',
    values: {
      name,
      from: variantLabel(products, gift.productId, gift.originalVariantId),
      to: variantLabel(products, gift.productId, gift.variantId),
    },
  }
}
