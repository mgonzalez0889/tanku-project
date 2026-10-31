import type { Gift, Product, TasteCard, User } from "@tanku/shared";
import { DomainError } from "./errors.js";

export interface GiftContext {
  users: readonly User[];
  products: readonly Product[];
  /** Keyed by user id; a user may have no card. */
  tasteCards: Partial<Record<string, TasteCard>>;
}

const MAX_MESSAGE_LENGTH = 280;

function invalid(message: string): DomainError {
  return new DomainError("INVALID_GIFT", message);
}

/** The variant the giver asked for or, for fashion without one, the recipient's preferred size. */
function chooseVariantId(product: Product, variantId: unknown, recipientCard: TasteCard | undefined): string {
  if (variantId === undefined && product.category === "fashion") {
    const size = recipientCard?.preferredSize;
    if (size && product.variants.some((variant) => variant.id === size)) return size;
    // "According to their taste" was asked for but there is no size to use: tell the giver to pick one.
    throw new DomainError("RECIPIENT_SIZE_UNKNOWN", "The recipient has no size this product offers");
  }
  if (typeof variantId !== "string" || !product.variants.some((variant) => variant.id === variantId)) {
    throw invalid("variantId must be a variant of the product");
  }
  return variantId;
}

/** Validates a gift request and returns the new gift, waiting for its payment. */
export function createGift(body: unknown, ctx: GiftContext, id: string): Gift {
  if (typeof body !== "object" || body === null) throw invalid("body must be an object");
  const fields = body as Record<string, unknown>;

  function requireUserId(field: string): string {
    const value = fields[field];
    if (typeof value !== "string" || !ctx.users.some((user) => user.id === value)) {
      throw invalid(`${field} must be a known user`);
    }
    return value;
  }

  const giverId = requireUserId("giverId");
  const recipientId = requireUserId("recipientId");
  if (giverId === recipientId) throw invalid("a gift needs two different people");

  const { productId, variantId, message } = fields;

  const product = ctx.products.find((candidate) => candidate.id === productId);
  if (!product) throw invalid("productId is not in the catalog");

  const chosenVariantId = chooseVariantId(product, variantId, ctx.tasteCards[recipientId]);

  if (message !== undefined && typeof message !== "string") throw invalid("message must be text");
  const text = typeof message === "string" ? message.trim() : "";
  if (text.length > MAX_MESSAGE_LENGTH) throw invalid(`message is longer than ${MAX_MESSAGE_LENGTH} characters`);

  return {
    id,
    giverId,
    recipientId,
    productId: product.id,
    variantId: chosenVariantId,
    message: text,
    status: "payment_pending",
  };
}
