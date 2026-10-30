import { randomUUID } from "node:crypto";
import type { Gift, Product } from "@tanku/shared";
import express, { type NextFunction, type Request, type Response } from "express";
import { createStore, type Store } from "./data/store.js";
import { rankProducts } from "./domain/affinity.js";
import { checkout } from "./domain/checkout.js";
import { createGift } from "./domain/create-gift.js";
import { DomainError, type DomainErrorCode } from "./domain/errors.js";
import { isVisibleTo, transitionGift } from "./domain/gift.js";
import { parseTasteCard } from "./domain/taste-card.js";
import { noopNotifier, type Notifier } from "./realtime.js";

// Typed by code: adding a DomainErrorCode without a status here is a compile error.
const statusByCode: Record<DomainErrorCode, number> = {
  INVALID_TRANSITION: 409,
  INVALID_VARIANT: 400,
  INVALID_TASTE_CARD: 400,
  INVALID_GIFT: 400,
  INVALID_PAYMENT: 400,
  USER_NOT_FOUND: 404,
  GIFT_NOT_FOUND: 404,
};

export function createApp(store: Store = createStore(), notifier: Notifier = noopNotifier) {
  const app = express();
  app.use(express.json());

  function requireUser(userId: string): void {
    if (!store.users.some((user) => user.id === userId)) {
      throw new DomainError("USER_NOT_FOUND", `Unknown user "${userId}"`);
    }
  }

  function requireGift(giftId: string): { index: number; gift: Gift } {
    const gift = store.gifts.find((candidate) => candidate.id === giftId);
    if (!gift) throw new DomainError("GIFT_NOT_FOUND", `Unknown gift "${giftId}"`);
    return { index: store.gifts.indexOf(gift), gift };
  }

  /** Stores the gift the recipient answered, tells the giver and replies with it. */
  function answerGift(index: number, answered: Gift, res: Response): void {
    store.gifts[index] = answered;
    notifier.giftAccepted(answered);
    res.json(answered);
  }

  function requireProduct(gift: Gift): Product {
    const product = store.products.find((candidate) => candidate.id === gift.productId);
    if (!product) throw new Error(`Gift ${gift.id} points to a product that is not in the catalog`);
    return product;
  }

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/users", (_req, res) => {
    res.json(store.users);
  });

  // With ?recipientId the catalog is ordered for that person: avoided products are hidden and
  // the taste card itself is never sent. Without it, the full catalog.
  app.get("/api/products", (req, res) => {
    const { recipientId } = req.query;
    if (typeof recipientId !== "string" || recipientId === "") {
      res.json(store.products);
      return;
    }
    requireUser(recipientId);
    res.json(rankProducts(store.products, store.tasteCards[recipientId]));
  });

  // No login: these two endpoints trust the caller (documented in the README).
  app.get("/api/users/:userId/taste-card", (req, res) => {
    const { userId } = req.params;
    requireUser(userId);
    res.json(store.tasteCards[userId]);
  });

  app.put("/api/users/:userId/taste-card", (req, res) => {
    const { userId } = req.params;
    requireUser(userId);
    store.tasteCards[userId] = parseTasteCard(userId, req.body, store.products);
    res.json(store.tasteCards[userId]);
  });

  app.post("/api/gifts", (req, res) => {
    const gift = createGift(req.body, store, randomUUID());
    store.gifts.push(gift);
    res.status(201).json(gift);
  });

  // Simulated checkout. The handler is synchronous, so two quick requests run one after the other and
  // the second finds the gift already paid (409): no idempotency key is needed.
  app.post("/api/gifts/:giftId/pay", (req, res) => {
    const { index, gift } = requireGift(req.params.giftId);

    const result = checkout(gift, requireProduct(gift), req.body, randomUUID());
    store.gifts[index] = result.gift;
    store.payments.push(result.payment);
    // Only an approved payment makes the gift visible to the recipient, so only then they hear about it.
    if (result.payment.status === "approved") notifier.giftReceived(result.gift);
    res.status(201).json(result);
  });

  // The recipient answers a paid gift: accept it, or change its variant first ("cambio previo").
  // Changing is accepting with another variant, so it can only happen once. Like the rest of the
  // API there is no login: whoever calls these routes is trusted to be the recipient.
  app.post("/api/gifts/:giftId/accept", (req, res) => {
    const { index, gift } = requireGift(req.params.giftId);

    answerGift(index, transitionGift(gift, { type: "accept" }), res);
  });

  app.post("/api/gifts/:giftId/change-variant", (req, res) => {
    const { index, gift } = requireGift(req.params.giftId);
    const variantId: unknown = req.body?.variantId;
    if (typeof variantId !== "string") throw new DomainError("INVALID_VARIANT", "variantId must be text");
    // The valid variants come from the catalog, never from the request.
    const productVariantIds = requireProduct(gift).variants.map((variant) => variant.id);

    answerGift(index, transitionGift(gift, { type: "changeVariant", variantId, productVariantIds }), res);
  });

  // The recipient does not see a gift until it is paid (see isVisibleTo).
  app.get("/api/users/:userId/gifts", (req, res) => {
    const { userId } = req.params;
    requireUser(userId);
    res.json(store.gifts.filter((gift) => isVisibleTo(gift, userId)));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof DomainError) {
      res.status(statusByCode[error.code]).json({ error: error.code });
      return;
    }
    // express.json() reports a malformed body with this type; it is the client's mistake.
    if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.parse.failed") {
      res.status(400).json({ error: "INVALID_JSON" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  });

  return app;
}
