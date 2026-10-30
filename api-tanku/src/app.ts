import express, { type NextFunction, type Request, type Response } from "express";
import { createStore, type Store } from "./data/store.js";
import { rankProducts } from "./domain/affinity.js";
import { DomainError, type DomainErrorCode } from "./domain/errors.js";
import { parseTasteCard } from "./domain/taste-card.js";

// Typed by code: adding a DomainErrorCode without a status here is a compile error.
const statusByCode: Record<DomainErrorCode, number> = {
  INVALID_TRANSITION: 409,
  INVALID_VARIANT: 400,
  INVALID_TASTE_CARD: 400,
  USER_NOT_FOUND: 404,
};

export function createApp(store: Store = createStore()) {
  const app = express();
  app.use(express.json());

  function requireUser(userId: string): void {
    if (!store.users.some((user) => user.id === userId)) {
      throw new DomainError("USER_NOT_FOUND", `Unknown user "${userId}"`);
    }
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
