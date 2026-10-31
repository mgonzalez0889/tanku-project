import type { Category, Product, TasteCard } from '@tanku/shared'
import { describe, expect, it } from 'vitest'
import {
  buildTasteCardRequest,
  catalogCategories,
  catalogTags,
  fashionSizes,
  setTagPreference,
  tagPreference,
  toggleCategory,
} from './tasteCard.ts'

function product(category: Category, tags: string[], variantIds: string[] = ['a', 'b']): Product {
  return {
    id: `product-${category}-${tags.join('-')}`,
    name: 'Producto',
    description: '',
    category,
    priceCop: 1000,
    tags,
    variants: variantIds.map((id) => ({ id, label: id.toUpperCase() })),
  }
}

const card: TasteCard = {
  userId: 'user-santiago',
  favoriteCategories: ['tech'],
  likedTags: ['music', 'cooking'],
  avoidedTags: ['decor'],
  preferredSize: 'l',
}

describe('catalogTags', () => {
  it('lists every tag once and in order', () => {
    const products = [product('tech', ['music', 'sport']), product('home', ['decor', 'music'])]

    expect(catalogTags(products)).toEqual(['decor', 'music', 'sport'])
  })
})

describe('catalogCategories', () => {
  it('lists the categories the catalog has, once each and in order of appearance', () => {
    const products = [product('tech', []), product('home', []), product('tech', ['music'])]

    expect(catalogCategories(products)).toEqual(['tech', 'home'])
  })
})

describe('fashionSizes', () => {
  it('lists the sizes of fashion products once and in order of appearance', () => {
    const products = [
      product('tech', [], ['black', 'blue']),
      product('fashion', [], ['s', 'm', 'l']),
      product('fashion', [], ['m', 'l', 'xl']),
    ]

    expect(fashionSizes(products).map((size) => size.id)).toEqual(['s', 'm', 'l', 'xl'])
  })

  it('is empty when there is no fashion product', () => {
    expect(fashionSizes([product('tech', [])])).toEqual([])
  })
})

describe('toggleCategory', () => {
  it('adds a category that is not there', () => {
    expect(toggleCategory(card, 'home').favoriteCategories).toEqual(['tech', 'home'])
  })

  it('removes a category that is already there', () => {
    expect(toggleCategory(card, 'tech').favoriteCategories).toEqual([])
  })

  it('does not change the card it receives', () => {
    toggleCategory(card, 'home')

    expect(card.favoriteCategories).toEqual(['tech'])
  })
})

describe('setTagPreference', () => {
  it('puts a neutral tag among the ones the person likes', () => {
    const result = setTagPreference(card, 'sport', 'liked')

    expect(result.likedTags).toEqual(['music', 'cooking', 'sport'])
    expect(result.avoidedTags).toEqual(['decor'])
  })

  it('moves a liked tag to the avoided ones: it is never in both', () => {
    const result = setTagPreference(card, 'music', 'avoided')

    expect(result.likedTags).toEqual(['cooking'])
    expect(result.avoidedTags).toEqual(['decor', 'music'])
  })

  it('takes a tag out of both lists when it becomes neutral', () => {
    const result = setTagPreference(card, 'decor', 'neutral')

    expect(result.avoidedTags).toEqual([])
    expect(result.likedTags).toEqual(['music', 'cooking'])
  })

  it('does not repeat a tag that is already there', () => {
    expect(setTagPreference(card, 'music', 'liked').likedTags).toEqual(['music', 'cooking'])
  })

  it('does not change the card it receives', () => {
    setTagPreference(card, 'music', 'avoided')

    expect(card.likedTags).toEqual(['music', 'cooking'])
    expect(card.avoidedTags).toEqual(['decor'])
  })
})

describe('tagPreference', () => {
  it('tells where a tag is: liked, avoided, or neither', () => {
    expect(tagPreference(card, 'music')).toBe('liked')
    expect(tagPreference(card, 'decor')).toBe('avoided')
    expect(tagPreference(card, 'sport')).toBe('neutral')
  })
})

describe('buildTasteCardRequest', () => {
  it('sends the lists and the size, but not the userId', () => {
    expect(buildTasteCardRequest(card)).toEqual({
      favoriteCategories: ['tech'],
      likedTags: ['music', 'cooking'],
      avoidedTags: ['decor'],
      preferredSize: 'l',
    })
  })

  it('leaves the size out when there is none', () => {
    const request = buildTasteCardRequest({ ...card, preferredSize: undefined })

    expect('preferredSize' in request).toBe(false)
  })

  it('also leaves it out when the size is an empty string', () => {
    const request = buildTasteCardRequest({ ...card, preferredSize: '' })

    expect('preferredSize' in request).toBe(false)
  })
})
