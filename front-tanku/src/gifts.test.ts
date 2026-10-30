import type { Gift, GiftStatus } from '@tanku/shared'
import { describe, expect, it } from 'vitest'
import { AS_THEY_LIKE, buildGiftRequest, canPay } from './gifts.ts'

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
