import type { Gift, GiftStatus, Product, User } from '@tanku/shared'
import { describe, expect, it } from 'vitest'
import {
  AS_THEY_LIKE,
  buildGiftRequest,
  canPay,
  noticeText,
  otherVariants,
  splitGifts,
  upsertGift,
  type Notice,
} from './gifts.ts'

function giftIn(status: GiftStatus): Gift {
  return {
    id: 'gift-1',
    giverId: 'user-valentina',
    recipientId: 'user-santiago',
    productId: 'product-speaker',
    variantId: 'black',
    message: '',
    status,
  }
}

describe('canPay', () => {
  it('is true while the gift waits for its payment or after a rejection', () => {
    expect(canPay(giftIn('payment_pending'))).toBe(true)
    expect(canPay(giftIn('payment_failed'))).toBe(true)
  })

  it('is false once the gift is paid', () => {
    expect(canPay(giftIn('sent'))).toBe(false)
    expect(canPay(giftIn('accepted'))).toBe(false)
  })
})

describe('buildGiftRequest', () => {
  const base = {
    giverId: 'user-valentina',
    recipientId: 'user-santiago',
    productId: 'product-speaker',
    variantChoice: 'blue',
    message: 'Para tus caminatas',
  }

  it('keeps who gives, who receives and what, as they are', () => {
    expect(buildGiftRequest(base)).toMatchObject({
      giverId: 'user-valentina',
      recipientId: 'user-santiago',
      productId: 'product-speaker',
    })
  })

  it('sends the variant the giver chose', () => {
    expect(buildGiftRequest(base).variantId).toBe('blue')
  })

  it('leaves the variant out when the giver picks "according to their taste"', () => {
    const request = buildGiftRequest({ ...base, variantChoice: AS_THEY_LIKE })

    expect('variantId' in request).toBe(false)
  })

  it('trims the message', () => {
    expect(buildGiftRequest({ ...base, message: '  hola  ' }).message).toBe('hola')
  })

  it('sends an empty message when nothing was written', () => {
    expect(buildGiftRequest({ ...base, message: '' }).message).toBe('')
  })
})

describe('upsertGift', () => {
  const first = { ...giftIn('sent'), id: 'gift-1' }
  const second = { ...giftIn('sent'), id: 'gift-2' }

  it('adds a gift it does not know at the end', () => {
    const third = { ...giftIn('sent'), id: 'gift-3' }

    expect(upsertGift([first, second], third).map((gift) => gift.id)).toEqual(['gift-1', 'gift-2', 'gift-3'])
  })

  it('replaces the gift with the same id in its place', () => {
    const accepted = { ...first, status: 'accepted' as const }

    const result = upsertGift([first, second], accepted)

    expect(result.map((gift) => gift.id)).toEqual(['gift-1', 'gift-2'])
    expect(result[0]!.status).toBe('accepted')
  })

  it('does not change the list it receives', () => {
    const gifts = [first, second]

    upsertGift(gifts, { ...first, status: 'accepted' })

    expect(gifts[0]!.status).toBe('sent')
    expect(gifts).toHaveLength(2)
  })

  it('gives the same result when the same gift arrives twice', () => {
    const accepted = { ...first, status: 'accepted' as const }

    expect(upsertGift(upsertGift([first], accepted), accepted)).toEqual([accepted])
  })
})

describe('splitGifts', () => {
  it('separates what the user gave from what the user received', () => {
    const gave = { ...giftIn('sent'), id: 'gave', giverId: 'user-valentina', recipientId: 'user-santiago' }
    const got = { ...giftIn('sent'), id: 'got', giverId: 'user-santiago', recipientId: 'user-valentina' }

    const { given, received } = splitGifts([gave, got], 'user-valentina')

    expect(given.map((gift) => gift.id)).toEqual(['gave'])
    expect(received.map((gift) => gift.id)).toEqual(['got'])
  })
})

describe('noticeText', () => {
  const users: User[] = [
    { id: 'user-valentina', name: 'Valentina' },
    { id: 'user-santiago', name: 'Santiago' },
  ]
  const products: Product[] = [
    {
      id: 'product-speaker',
      name: 'Parlante portátil',
      description: '',
      category: 'tech',
      priceCop: 179900,
      tags: [],
      variants: [
        { id: 'black', label: 'Negro' },
        { id: 'blue', label: 'Azul' },
      ],
    },
  ]
  const notice = (type: Notice['type'], gift: Gift): Notice => ({ id: 1, type, gift })

  it('tells the recipient who sent them a gift', () => {
    expect(noticeText(notice('received', giftIn('sent')), users, products)).toEqual({
      key: 'notice.received',
      values: { name: 'Valentina' },
    })
  })

  it('tells the giver who accepted their gift', () => {
    expect(noticeText(notice('accepted', giftIn('accepted')), users, products)).toEqual({
      key: 'notice.accepted',
      values: { name: 'Santiago' },
    })
  })

  it('tells the giver which variant the recipient changed from and to', () => {
    const changed = { ...giftIn('accepted'), variantId: 'blue', originalVariantId: 'black' }

    expect(noticeText(notice('accepted', changed), users, products)).toEqual({
      key: 'notice.changed',
      values: { name: 'Santiago', from: 'Negro', to: 'Azul' },
    })
  })

  it('falls back to the id when a user or a variant is not known', () => {
    const stranger = { ...giftIn('sent'), giverId: 'user-nobody' }
    const odd = { ...giftIn('accepted'), variantId: 'green', originalVariantId: 'black' }

    expect(noticeText(notice('received', stranger), users, products).values).toEqual({ name: 'user-nobody' })
    expect(noticeText(notice('accepted', odd), users, products).values).toMatchObject({ from: 'Negro', to: 'green' })
  })
})

describe('otherVariants', () => {
  const shirt: Product = {
    id: 'product-tshirt',
    name: 'Camiseta',
    description: '',
    category: 'fashion',
    priceCop: 59900,
    tags: [],
    variants: [
      { id: 's', label: 'S' },
      { id: 'm', label: 'M' },
      { id: 'l', label: 'L' },
    ],
  }
  const gift = { ...giftIn('sent'), productId: 'product-tshirt', variantId: 'm' }

  it('lists the variants of the product other than the one the gift has', () => {
    expect(otherVariants(shirt, gift).map((variant) => variant.id)).toEqual(['s', 'l'])
  })

  it('is empty when the product has no other variant', () => {
    const single = { ...shirt, variants: [{ id: 'm', label: 'M' }] }

    expect(otherVariants(single, gift)).toEqual([])
  })

  it('is empty when the product is not known', () => {
    expect(otherVariants(undefined, gift)).toEqual([])
  })
})
