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

/** Business-rule errors the API answers as `{ error: code }`; each one has an HTTP status. */
export type DomainErrorCode =
  | "INVALID_TRANSITION"
  | "INVALID_VARIANT"
  | "INVALID_TASTE_CARD"
  | "INVALID_GIFT"
  | "INVALID_PAYMENT"
  | "USER_NOT_FOUND"
  | "GIFT_NOT_FOUND";

/** Every error code a client can receive from the API. */
export type ApiErrorCode = DomainErrorCode | "INVALID_JSON" | "INTERNAL_ERROR";

/** Events the server sends to a user's sockets. */
export interface ServerToClientEvents {
  /** The payment was approved: the gift is now visible to its recipient. */
  "gift:received": (gift: Gift) => void;
  /** The recipient accepted the gift; `originalVariantId` is set when they changed the variant first. */
  "gift:accepted": (gift: Gift) => void;
}

/** What `POST /api/gifts/:giftId/pay` answers (accept and change-variant answer a plain Gift). */
export interface PayResponse {
  gift: Gift;
  payment: Payment;
}

export type Category ="fashion" | "tech" | "home" | "beauty" | "experiences";

export interface ProductVariant {
  /** Unique within its product, e.g. "m". */
  id: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  /** Whole Colombian pesos. */
  priceCop: number;
  tags: string[];
  variants: ProductVariant[];
}

export interface User {
  id: string;
  name: string;
}

/** Private to its owner: the giver never receives it. */
export interface TasteCard {
  userId: string;
  favoriteCategories: Category[];
  likedTags: string[];
  avoidedTags: string[];
  /** A variant id shared by every fashion product ("s", "m" or "l"). */
  preferredSize?: string;
}
