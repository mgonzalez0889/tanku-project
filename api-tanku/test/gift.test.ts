import type { Gift, GiftStatus } from "@tanku/shared";
import { describe, expect, it } from "vitest";
import { transitionGift, type GiftAction } from "../src/domain/gift.js";
import { codeOf } from "./helpers/code-of.js";

function makeGift(status: GiftStatus, overrides: Partial<Gift> = {}): Gift {
  return {
    id: "gift-1",
    giverId: "user-ana",
    recipientId: "user-luis",
    productId: "product-1",
    variantId: "M",
    message: "Feliz cumpleaños",
    status,
    ...overrides,
  };
}

function changeVariant(variantId: string, productVariantIds: string[]): GiftAction {
  return { type: "changeVariant", variantId, productVariantIds };
}

describe("valid transitions", () => {
  it("payment_pending + paymentApproved -> sent", () => {
    const next = transitionGift(makeGift("payment_pending"), { type: "paymentApproved" });
    expect(next.status).toBe("sent");
  });

  it("payment_pending + paymentRejected -> payment_failed", () => {
    const next = transitionGift(makeGift("payment_pending"), { type: "paymentRejected" });
    expect(next.status).toBe("payment_failed");
  });

  it("payment_failed + retryPayment -> payment_pending", () => {
    const next = transitionGift(makeGift("payment_failed"), { type: "retryPayment" });
    expect(next.status).toBe("payment_pending");
  });

  it("sent + accept -> accepted, without originalVariantId", () => {
    const next = transitionGift(makeGift("sent"), { type: "accept" });
    expect(next.status).toBe("accepted");
    expect(next.originalVariantId).toBeUndefined();
  });

  it("sent + changeVariant -> accepted with the new variant and the original one kept", () => {
    const next = transitionGift(makeGift("sent"), changeVariant("L", ["M", "L"]));
    expect(next.status).toBe("accepted");
    expect(next.variantId).toBe("L");
    expect(next.originalVariantId).toBe("M");
  });
});

describe("changeVariant validation", () => {
  it("rejects the variant the gift already has", () => {
    expect(codeOf(() => transitionGift(makeGift("sent"), changeVariant("M", ["M", "L"])))).toBe(
      "INVALID_VARIANT",
    );
  });

  it("rejects a variant that does not belong to the product", () => {
    expect(codeOf(() => transitionGift(makeGift("sent"), changeVariant("XL", ["M", "L"])))).toBe(
      "INVALID_VARIANT",
    );
  });
});

describe("invalid transitions", () => {
  const statuses: GiftStatus[] = ["payment_pending", "payment_failed", "sent", "accepted"];
  const actions: GiftAction[] = [
    { type: "paymentApproved" },
    { type: "paymentRejected" },
    { type: "retryPayment" },
    { type: "accept" },
    changeVariant("L", ["M", "L"]),
  ];
  const allowed = new Set([
    "payment_pending|paymentApproved",
    "payment_pending|paymentRejected",
    "payment_failed|retryPayment",
    "sent|accept",
    "sent|changeVariant",
  ]);

  for (const status of statuses) {
    for (const action of actions) {
      if (allowed.has(`${status}|${action.type}`)) continue;
      it(`${status} + ${action.type} -> INVALID_TRANSITION`, () => {
        expect(codeOf(() => transitionGift(makeGift(status), action))).toBe("INVALID_TRANSITION");
      });
    }
  }
});

describe("immutability", () => {
  it("returns a new gift and leaves a frozen input untouched", () => {
    const gift = Object.freeze(makeGift("sent"));

    const next = transitionGift(gift, changeVariant("L", ["M", "L"]));

    expect(next).not.toBe(gift);
    expect(gift).toEqual(makeGift("sent"));
  });
});
