import { DomainError } from "../../src/domain/errors.js";

/** The DomainError code thrown by `fn`, or undefined if it throws something else or nothing. */
export function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof DomainError ? error.code : undefined;
  }
  return undefined;
}
