import type { DomainErrorCode } from "@tanku/shared";

// The list of codes lives in shared so the front can type its messages with it.
export type { DomainErrorCode };

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
  }
}
