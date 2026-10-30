import type { Gift, Payment, PaymentStatus, Product } from "@tanku/shared";
import { DomainError } from "./errors.js";
import { transitionGift } from "./gift.js";

/** Simulated cards, told apart by their last 4 digits; any other valid number is approved. */
function outcomeFor(cardNumber: unknown): PaymentStatus {
  const digits = typeof cardNumber === "string" ? cardNumber.replace(/[\s-]/g, "") : "";
  if (!/^\d{16}$/.test(digits)) {
    throw new DomainError("INVALID_PAYMENT", "cardNumber must have 16 digits");
  }
  if (digits.endsWith("0002")) return "rejected";
  if (digits.endsWith("0001")) return "pending";
  return "approved";
}

/**
 * Simulated checkout: validates the card, decides the payment and moves the gift accordingly.
 * Paying a gift whose last payment was rejected is a retry. The card number is never kept.
 */
export function checkout(
  gift: Gift,
  product: Product,
  body: unknown,
  paymentId: string,
): { gift: Gift; payment: Payment } {
  const cardNumber = typeof body === "object" && body !== null ? (body as Record<string, unknown>).cardNumber : undefined;
  const outcome = outcomeFor(cardNumber);

  const retried = gift.status === "payment_failed" ? transitionGift(gift, { type: "retryPayment" }) : gift;
  if (retried.status !== "payment_pending") {
    throw new DomainError("INVALID_TRANSITION", `A gift in status "${gift.status}" cannot be paid`);
  }

  const payment: Payment = { id: paymentId, giftId: gift.id, amountCop: product.priceCop, status: outcome };

  // A pending payment leaves the gift waiting; the other two outcomes move it.
  if (outcome === "pending") return { gift: retried, payment };
  const type = outcome === "approved" ? "paymentApproved" : "paymentRejected";
  return { gift: transitionGift(retried, { type }), payment };
}
