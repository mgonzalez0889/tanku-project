import type { Product } from "@tanku/shared";
import { describe, expect, it } from "vitest";
import { parseTasteCard } from "../src/domain/taste-card.js";
import { codeOf } from "./helpers/code-of.js";

const sizes = [
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
];

const products: Product[] = [
  {
    id: "shirt",
    name: "Shirt",
    description: "",
    category: "fashion",
    priceCop: 50000,
    tags: ["style"],
    variants: sizes,
  },
  {
    id: "speaker",
    name: "Speaker",
    description: "",
    category: "tech",
    priceCop: 150000,
    tags: ["music", "sport"],
    variants: [
      { id: "black", label: "Negro" },
      { id: "blue", label: "Azul" },
    ],
  },
];

const validBody = {
  favoriteCategories: ["tech"],
  likedTags: ["music"],
  avoidedTags: ["style"],
  preferredSize: "m",
};

describe("parseTasteCard", () => {
  it("returns the card with the userId from the route, ignoring the one in the body", () => {
    const card = parseTasteCard("user-1", { ...validBody, userId: "someone-else" }, products);

    expect(card).toEqual({ userId: "user-1", ...validBody });
  });

  it("accepts a card without preferredSize", () => {
    const { preferredSize: _omitted, ...body } = validBody;

    const card = parseTasteCard("user-1", body, products);

    expect(card.preferredSize).toBeUndefined();
  });

  const invalidBodies: [string, unknown][] = [
    ["a body that is not an object", null],
    ["missing arrays", {}],
    ["an array holding a non-string", { ...validBody, likedTags: [1] }],
    ["a category that is not in the catalog", { ...validBody, favoriteCategories: ["toys"] }],
    ["a tag that is not in the catalog", { ...validBody, likedTags: ["nope"] }],
    ["a duplicated tag", { ...validBody, likedTags: ["music", "music"] }],
    ["a tag both liked and avoided", { ...validBody, likedTags: ["music"], avoidedTags: ["music"] }],
    ["a size that fashion products do not offer", { ...validBody, preferredSize: "xl" }],
  ];

  it.each(invalidBodies)("rejects %s with INVALID_TASTE_CARD", (_name, body) => {
    expect(codeOf(() => parseTasteCard("user-1", body, products))).toBe("INVALID_TASTE_CARD");
  });
});
