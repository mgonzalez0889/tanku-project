import type { Category, Product, TasteCard } from "@tanku/shared";
import { DomainError } from "./errors.js";

function invalid(message: string): DomainError {
  return new DomainError("INVALID_TASTE_CARD", message);
}

function uniqueStrings(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw invalid(`${field} must be an array of strings`);
  }
  if (new Set(value).size !== value.length) throw invalid(`${field} has duplicates`);
  return value;
}

/**
 * Validates a taste card sent by the client against the catalog and returns it.
 * The userId always comes from the route, never from the body.
 */
export function parseTasteCard(userId: string, body: unknown, products: readonly Product[]): TasteCard {
  if (typeof body !== "object" || body === null) throw invalid("body must be an object");
  const { favoriteCategories, likedTags, avoidedTags, preferredSize } = body as Record<string, unknown>;

  const categories = uniqueStrings(favoriteCategories, "favoriteCategories");
  const liked = uniqueStrings(likedTags, "likedTags");
  const avoided = uniqueStrings(avoidedTags, "avoidedTags");

  const catalogCategories = new Set<string>(products.map((product) => product.category));
  if (!categories.every((category) => catalogCategories.has(category))) {
    throw invalid("favoriteCategories has a category that is not in the catalog");
  }

  const catalogTags = new Set(products.flatMap((product) => product.tags));
  if (![...liked, ...avoided].every((tag) => catalogTags.has(tag))) {
    throw invalid("a tag is not in the catalog");
  }
  if (liked.some((tag) => avoided.includes(tag))) throw invalid("a tag cannot be liked and avoided");

  const fashionSizes = new Set(
    products
      .filter((product) => product.category === "fashion")
      .flatMap((product) => product.variants.map((variant) => variant.id)),
  );
  if (preferredSize !== undefined && (typeof preferredSize !== "string" || !fashionSizes.has(preferredSize))) {
    throw invalid("preferredSize must be a fashion size");
  }

  return {
    userId,
    favoriteCategories: categories as Category[],
    likedTags: liked,
    avoidedTags: avoided,
    preferredSize: preferredSize as string | undefined,
  };
}
