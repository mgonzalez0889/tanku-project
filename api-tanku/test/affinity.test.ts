import type { Category, Product, TasteCard } from "@tanku/shared";
import { describe, expect, it } from "vitest";
import { rankProducts } from "../src/domain/affinity.js";

function product(id: string, category: Category, tags: string[] = []): Product {
  return {
    id,
    name: id,
    description: "",
    category,
    priceCop: 1000,
    tags,
    variants: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
  };
}

function card(overrides: Partial<TasteCard> = {}): TasteCard {
  return {
    userId: "user-1",
    favoriteCategories: [],
    likedTags: [],
    avoidedTags: [],
    ...overrides,
  };
}

const idsOf = (products: Product[]) => products.map((p) => p.id);

describe("rankProducts", () => {
  it("hides products that have an avoided tag", () => {
    const products = [product("sporty", "tech", ["sport"]), product("calm", "tech")];

    expect(idsOf(rankProducts(products, card({ avoidedTags: ["sport"] })))).toEqual(["calm"]);
  });

  it("puts a favorite category (+2) before a single liked tag (+1)", () => {
    const products = [product("liked-tag", "home", ["decor"]), product("favorite", "tech")];

    const ranked = rankProducts(products, card({ favoriteCategories: ["tech"], likedTags: ["decor"] }));

    expect(idsOf(ranked)).toEqual(["favorite", "liked-tag"]);
  });

  it("keeps catalog order when scores tie", () => {
    const products = [
      product("two-tags", "home", ["decor", "wellness"]),
      product("favorite", "tech"),
    ];

    const ranked = rankProducts(
      products,
      card({ favoriteCategories: ["tech"], likedTags: ["decor", "wellness"] }),
    );

    expect(idsOf(ranked)).toEqual(["two-tags", "favorite"]);
  });

  it("returns the catalog in its original order for an empty card", () => {
    const products = [product("one", "tech"), product("two", "home"), product("three", "beauty")];

    expect(idsOf(rankProducts(products, card()))).toEqual(["one", "two", "three"]);
  });

  it("does not mutate the catalog it receives", () => {
    const products = Object.freeze([product("one", "tech"), product("two", "home")]);

    const ranked = rankProducts(products as Product[], card({ favoriteCategories: ["home"] }));

    expect(idsOf(ranked)).toEqual(["two", "one"]);
    expect(idsOf(products as Product[])).toEqual(["one", "two"]);
  });
});
