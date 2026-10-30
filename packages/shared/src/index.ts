export type GiftStatus = "payment_pending" | "payment_failed" | "sent" | "accepted";

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface Gift {
  id: string;
  giverId: string;
  recipientId: string;
  productId: string;
  variantId: string;
  /** Only set when the recipient swapped the variant before accepting. */
  originalVariantId?: string;
  message: string;
  status: GiftStatus;
}

export interface Payment {
  id: string;
  giftId: string;
  amountCop: number;
  status: PaymentStatus;
}
