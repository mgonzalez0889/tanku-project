import type { Gift } from "@tanku/shared";

export type GiftAction =
  | { type: "paymentApproved" }
  | { type: "paymentRejected" }
  | { type: "retryPayment" }
  | { type: "accept" }
  | { type: "changeVariant"; variantId: string; productVariantIds: string[] };

export class DomainError extends Error {
  constructor(
    readonly code: "INVALID_TRANSITION" | "INVALID_VARIANT",
    message: string,
  ) {
    super(message);
  }
}

function invalidTransition(gift: Gift, action: GiftAction): DomainError {
  return new DomainError(
    "INVALID_TRANSITION",
    `Cannot apply "${action.type}" to a gift in status "${gift.status}"`,
  );
}

/** Pure: returns a new gift or throws a DomainError; never mutates the input. */
export function transitionGift(gift: Gift, action: GiftAction): Gift {
  switch (action.type) {
    case "paymentApproved":
      if (gift.status !== "payment_pending") throw invalidTransition(gift, action);
      return { ...gift, status: "sent" };

    case "paymentRejected":
      if (gift.status !== "payment_pending") throw invalidTransition(gift, action);
      return { ...gift, status: "payment_failed" };

    case "retryPayment":
      if (gift.status !== "payment_failed") throw invalidTransition(gift, action);
      return { ...gift, status: "payment_pending" };

    case "accept":
      if (gift.status !== "sent") throw invalidTransition(gift, action);
      return { ...gift, status: "accepted" };

    case "changeVariant":
      if (gift.status !== "sent") throw invalidTransition(gift, action);
      if (action.variantId === gift.variantId || !action.productVariantIds.includes(action.variantId)) {
        throw new DomainError("INVALID_VARIANT", `Variant "${action.variantId}" is not a valid change`);
      }
      return {
        ...gift,
        status: "accepted",
        variantId: action.variantId,
        originalVariantId: gift.variantId,
      };
  }
}
