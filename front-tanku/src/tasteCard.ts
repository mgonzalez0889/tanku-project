import type { Category, Product, ProductVariant, TasteCard } from '@tanku/shared'

/** Where a tag stands for a person: they like it, they want to avoid it, or they do not mind. */
export type TagPreference = 'liked' | 'avoided' | 'neutral'

/** The body of `PUT /api/users/:id/taste-card`. */
export interface TasteCardRequest {
  favoriteCategories: Category[]
  likedTags: string[]
  avoidedTags: string[]
  preferredSize?: string
}

export const catalogCategories = (products: Product[]): Category[] => [
  ...new Set(products.map((product) => product.category)),
]

export const catalogTags = (products: Product[]): string[] =>
  [...new Set(products.flatMap((product) => product.tags))].sort()

/** The sizes of the fashion products, each once, in order of appearance. */
export function fashionSizes(products: Product[]): ProductVariant[] {
  const sizes = new Map<string, ProductVariant>()
  for (const product of products) {
    if (product.category !== 'fashion') continue
    for (const variant of product.variants) {
      if (!sizes.has(variant.id)) sizes.set(variant.id, variant)
    }
  }
  return [...sizes.values()]
}

export function toggleCategory(card: TasteCard, category: Category): TasteCard {
  const favoriteCategories = card.favoriteCategories.includes(category)
    ? card.favoriteCategories.filter((favorite) => favorite !== category)
    : [...card.favoriteCategories, category]
  return { ...card, favoriteCategories }
}

export function tagPreference(card: TasteCard, tag: string): TagPreference {
  if (card.likedTags.includes(tag)) return 'liked'
  if (card.avoidedTags.includes(tag)) return 'avoided'
  return 'neutral'
}

/** Moves a tag to the list that matches `preference`; it is never in both. Does not change `card`. */
export function setTagPreference(card: TasteCard, tag: string, preference: TagPreference): TasteCard {
  const without = (tags: string[]) => tags.filter((known) => known !== tag)
  const withTag = (tags: string[]) => (tags.includes(tag) ? tags : [...tags, tag])
  return {
    ...card,
    likedTags: preference === 'liked' ? withTag(card.likedTags) : without(card.likedTags),
    avoidedTags: preference === 'avoided' ? withTag(card.avoidedTags) : without(card.avoidedTags),
  }
}

/** What the API takes: the lists, and the size only if there is one. The userId comes from the URL. */
export function buildTasteCardRequest(card: TasteCard): TasteCardRequest {
  const request: TasteCardRequest = {
    favoriteCategories: card.favoriteCategories,
    likedTags: card.likedTags,
    avoidedTags: card.avoidedTags,
  }
  if (card.preferredSize) request.preferredSize = card.preferredSize
  return request
}
