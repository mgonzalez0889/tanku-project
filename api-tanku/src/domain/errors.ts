export type DomainErrorCode =
  | "INVALID_TRANSITION"
  | "INVALID_VARIANT"
  | "INVALID_TASTE_CARD"
  | "INVALID_GIFT"
  | "INVALID_PAYMENT"
  | "USER_NOT_FOUND"
  | "GIFT_NOT_FOUND";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
  }
}
