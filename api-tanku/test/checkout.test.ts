import type { Gift, GiftStatus, Product } from "@tanku/shared";
import { describe, expect, it } from "vitest";
import { checkout } from "../src/domain/checkout.js";
import { codeOf } from "./helpers/code-of.js";

const product: Product = {
  id: "speaker",
  name: "Speaker",
  description: "",
  category: "tech",
  priceCop: 179900,
  tags: [],
  variants: [{ id: "black", label: "Negro" }],
};

function giftIn(status: GiftStatus): Gift {
  return {
    id: "gift-1",
    giverId: "user-ana",
    recipientId: "user-luis",
    productId: "speaker",
    variantId: "black",
    message: "",
    status,
  };
}

const approvedCard = { cardNumber: "4242424242420000" };
const rejectedCard = { cardNumber: "4242424242420002" };
const pendingCard = { cardNumber: "4242424242420001" };

const pay = (status: GiftStatus, body: unknown) => checkout(giftIn(status), product, body, "payment-1");

describe("checkout outcomes", () => {
  it("approves a card ending in 0000: the gift is sent", () => {
    const { gift, payment } = pay("payment_pending", approvedCard);

    expect(gift.status).toBe("sent");
    expect(payment).toEqual({ id: "payment-1", giftId: "gift-1", amountCop: 179900, status: "approved" });
  });

  it("rejects a card ending in 0002: the gift becomes payment_failed", () => {
    const { gift, payment } = pay("payment_pending", rejectedCard);

    expect(gift.status).toBe("payment_failed");
    expect(payment.status).toBe("rejected");
  });

  it("leaves the payment pending for a card ending in 0001: the gift does not change", () => {
    const { gift, payment } = pay("payment_pending", pendingCard);

    expect(gift.status).toBe("payment_pending");
    expect(payment.status).toBe("pending");
  });

  it("approves any other valid card", () => {
    expect(pay("payment_pending", { cardNumber: "4242 4242 4242 4242" }).payment.status).toBe("approved");
  });

  it("accepts spaces and dashes in the number", () => {
    expect(pay("payment_pending", { cardNumber: "4242-4242-4242-0002" }).payment.status).toBe("rejected");
  });
});

describe("paying again after a rejection", () => {
  it("sends the gift when the new card is approved", () => {
    expect(pay("payment_failed", approvedCard).gift.status).toBe("sent");
  });

  it("keeps it payment_failed when the new card is rejected", () => {
    expect(pay("payment_failed", rejectedCard).gift.status).toBe("payment_failed");
  });

  it("moves it back to payment_pending when the new payment is pending", () => {
    expect(pay("payment_failed", pendingCard).gift.status).toBe("payment_pending");
  });
});

describe("checkout validation", () => {
  const invalidBodies: [string, unknown][] = [
    ["a body that is not an object", null],
    ["a missing cardNumber", {}],
    ["a cardNumber that is a number", { cardNumber: 4242424242420000 }],
    ["15 digits", { cardNumber: "424242424242000" }],
    ["17 digits", { cardNumber: "42424242424200000" }],
    ["letters", { cardNumber: "4242abcd42420000" }],
  ];

  it.each(invalidBodies)("rejects %s with INVALID_PAYMENT", (_name, body) => {
    expect(codeOf(() => pay("payment_pending", body))).toBe("INVALID_PAYMENT");
  });

  it("checks the card before the gift status", () => {
    expect(codeOf(() => pay("sent", { cardNumber: "123" }))).toBe("INVALID_PAYMENT");
  });
});

describe("paying a gift that is already paid", () => {
  const cards: [string, unknown][] = [
    ["approved", approvedCard],
    ["rejected", rejectedCard],
    ["pending", pendingCard],
  ];

  for (const status of ["sent", "accepted"] as const) {
    it.each(cards)(`a ${status} gift with an %s card -> INVALID_TRANSITION`, (_name, body) => {
      expect(codeOf(() => pay(status, body))).toBe("INVALID_TRANSITION");
    });
  }
});

describe("immutability", () => {
  it("does not mutate the gift it receives", () => {
    const gift = Object.freeze(giftIn("payment_pending"));

    const { gift: paid } = checkout(gift, product, approvedCard, "payment-1");

    expect(paid).not.toBe(gift);
    expect(gift).toEqual(giftIn("payment_pending"));
  });
});
