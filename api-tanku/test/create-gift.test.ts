import type { Product, TasteCard, User } from "@tanku/shared";
import { describe, expect, it } from "vitest";
import { createGift } from "../src/domain/create-gift.js";
import { codeOf } from "./helpers/code-of.js";

const users: User[] = [
  { id: "giver", name: "Ana" },
  { id: "recipient", name: "Luis" },
  { id: "no-size", name: "Marta" },
  { id: "no-card", name: "Pedro" },
];

const products: Product[] = [
  {
    id: "shirt",
    name: "Shirt",
    description: "",
    category: "fashion",
    priceCop: 50000,
    tags: [],
    variants: [
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
  },
  {
    id: "speaker",
    name: "Speaker",
    description: "",
    category: "tech",
    priceCop: 150000,
    tags: [],
    variants: [
      { id: "black", label: "Negro" },
      { id: "blue", label: "Azul" },
    ],
  },
];

const card = (userId: string, preferredSize?: string): TasteCard => ({
  userId,
  favoriteCategories: [],
  likedTags: [],
  avoidedTags: [],
  preferredSize,
});

// "no-card" has no entry at all: at runtime a user may not have a card.
const ctx = {
  users,
  products,
  tasteCards: { recipient: card("recipient", "m"), "no-size": card("no-size") },
};

const validBody = {
  giverId: "giver",
  recipientId: "recipient",
  productId: "speaker",
  variantId: "black",
  message: "Feliz cumpleaños",
};

const create = (body: unknown) => createGift(body, ctx, "gift-1");

describe("createGift", () => {
  it("creates a gift in payment_pending with the given id and explicit variant", () => {
    expect(create(validBody)).toEqual({
      id: "gift-1",
      giverId: "giver",
      recipientId: "recipient",
      productId: "speaker",
      variantId: "black",
      message: "Feliz cumpleaños",
      status: "payment_pending",
    });
  });

  it("preselects the recipient's preferredSize for a fashion product without variantId", () => {
    const gift = create({ giverId: "giver", recipientId: "recipient", productId: "shirt" });

    expect(gift.variantId).toBe("m");
  });

  it("lets an explicit variantId win over the preferredSize", () => {
    const gift = create({ giverId: "giver", recipientId: "recipient", productId: "shirt", variantId: "l" });

    expect(gift.variantId).toBe("l");
  });
});

describe("createGift message", () => {
  it("defaults to an empty message and trims the text", () => {
    const { message: _omitted, ...withoutMessage } = validBody;

    expect(create(withoutMessage).message).toBe("");
    expect(create({ ...validBody, message: "  hola  " }).message).toBe("hola");
  });

  it("accepts 280 characters and rejects 281", () => {
    expect(create({ ...validBody, message: "a".repeat(280) }).message).toHaveLength(280);
    expect(codeOf(() => create({ ...validBody, message: "a".repeat(281) }))).toBe("INVALID_GIFT");
  });

  it("rejects a message that is not a string", () => {
    expect(codeOf(() => create({ ...validBody, message: 5 }))).toBe("INVALID_GIFT");
  });
});

describe("createGift rejects with INVALID_GIFT", () => {
  const { variantId: _omitted, ...withoutVariant } = validBody;

  const invalidBodies: [string, unknown][] = [
    ["a body that is not an object", null],
    ["an unknown giver", { ...validBody, giverId: "nobody" }],
    ["an unknown recipient", { ...validBody, recipientId: "nobody" }],
    ["the same giver and recipient", { ...validBody, recipientId: "giver" }],
    ["an unknown product", { ...validBody, productId: "nothing" }],
    ["a variant that does not belong to the product", { ...validBody, variantId: "xl" }],
    ["a variantId that is not a string", { ...validBody, variantId: 5 }],
    ["a missing variantId on a non-fashion product", withoutVariant],
  ];

  it.each(invalidBodies)("%s", (_name, body) => {
    expect(codeOf(() => create(body))).toBe("INVALID_GIFT");
  });
});

describe("createGift when 'according to their taste' cannot give a size", () => {
  const { variantId: _omitted, ...withoutVariant } = validBody;

  // The giver asked for the recipient's size (no variantId) but there is none to use: say so, with its own code.
  const noSizeToUse: [string, unknown][] = [
    ["the recipient's card has no size", { ...withoutVariant, recipientId: "no-size", productId: "shirt" }],
    ["the recipient has no taste card", { ...withoutVariant, recipientId: "no-card", productId: "shirt" }],
  ];

  it.each(noSizeToUse)("answers RECIPIENT_SIZE_UNKNOWN when %s", (_name, body) => {
    expect(codeOf(() => create(body))).toBe("RECIPIENT_SIZE_UNKNOWN");
  });

  it("answers RECIPIENT_SIZE_UNKNOWN when the recipient's size is not one the product offers", () => {
    const ctxWithOddSize = { ...ctx, tasteCards: { recipient: card("recipient", "xxl") } };

    const failure = () =>
      createGift({ giverId: "giver", recipientId: "recipient", productId: "shirt" }, ctxWithOddSize, "gift-1");

    expect(codeOf(failure)).toBe("RECIPIENT_SIZE_UNKNOWN");
  });

  it("still lets the giver choose a size herself", () => {
    const gift = create({ giverId: "giver", recipientId: "no-size", productId: "shirt", variantId: "l" });

    expect(gift.variantId).toBe("l");
  });
});
