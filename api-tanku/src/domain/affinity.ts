import type { Product, TasteCard } from "@tanku/shared";

function score(product: Product, card: TasteCard): number {
  const categoryPoints = card.favoriteCategories.includes(product.category) ? 2 : 0;
  const likedTagPoints = product.tags.filter((tag) => card.likedTags.includes(tag)).length;
  return categoryPoints + likedTagPoints;
}

/**
 * Hides products with an avoided tag and orders the rest by affinity (best first).
 * Ties keep catalog order. The score stays here: callers only get the order.
 */
export function rankProducts(products: readonly Product[], card: TasteCard): Product[] {
  return products
    .filter((product) => !product.tags.some((tag) => card.avoidedTags.includes(tag)))
    .map((product) => ({ product, score: score(product, card) }))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}
