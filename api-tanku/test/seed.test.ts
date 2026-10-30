import type { Category } from "@tanku/shared";
import { describe, expect, it } from "vitest";
import { seed } from "../src/data/seed.js";
import { createStore } from "../src/data/store.js";

const categories: Category[] = ["fashion", "tech", "home", "beauty", "experiences"];
const fashion = seed.products.filter((product) => product.category === "fashion");

describe("seed catalog", () => {
  it("has 15 products and at least one per category", () => {
    expect(seed.products).toHaveLength(15);
    for (const category of categories) {
      expect(seed.products.some((product) => product.category === category)).toBe(true);
    }
  });

  it("has unique product ids, unique variant ids per product and at least 2 variants", () => {
    const productIds = seed.products.map((product) => product.id);
    expect(new Set(productIds).size).toBe(productIds.length);
    for (const product of seed.products) {
      const variantIds = product.variants.map((variant) => variant.id);
      expect(variantIds.length).toBeGreaterThanOrEqual(2);
      expect(new Set(variantIds).size).toBe(variantIds.length);
    }
  });

  it("prices every product in whole positive pesos", () => {
    for (const product of seed.products) {
      expect(Number.isInteger(product.priceCop)).toBe(true);
      expect(product.priceCop).toBeGreaterThan(0);
    }
  });

  it("gives every fashion product the sizes s, m and l", () => {
    expect(fashion.length).toBeGreaterThan(0);
    for (const product of fashion) {
      const variantIds = product.variants.map((variant) => variant.id);
      expect(variantIds).toEqual(expect.arrayContaining(["s", "m", "l"]));
    }
  });
});

describe("seed users and taste cards", () => {
  it("has 2 users and a taste card for each", () => {
    expect(seed.users).toHaveLength(2);
    for (const user of seed.users) {
      expect(seed.tasteCards[user.id]?.userId).toBe(user.id);
    }
  });

  it("only uses tags that exist in the catalog and a size that fashion products offer", () => {
    const catalogTags = new Set(seed.products.flatMap((product) => product.tags));
    for (const card of Object.values(seed.tasteCards)) {
      for (const tag of [...card.likedTags, ...card.avoidedTags]) {
        expect(catalogTags.has(tag)).toBe(true);
      }
      if (card.preferredSize !== undefined) {
        const offeredByAllFashion = fashion.every((product) =>
          product.variants.some((variant) => variant.id === card.preferredSize),
        );
        expect(offeredByAllFashion).toBe(true);
      }
    }
  });
});

describe("createStore", () => {
  it("starts with no gifts or payments", () => {
    const store = createStore();
    expect(store.gifts).toEqual([]);
    expect(store.payments).toEqual([]);
  });

  it("returns independent copies: changing one store does not touch another or the seed", () => {
    const first = createStore();
    const second = createStore();
    const originalName = seed.products[0]!.name;

    first.products[0]!.name = "changed";

    expect(second.products[0]!.name).toBe(originalName);
    expect(seed.products[0]!.name).toBe(originalName);
  });
});
