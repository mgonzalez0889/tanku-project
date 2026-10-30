import type { Gift, Payment, Product, TasteCard, User } from "@tanku/shared";
import { seed } from "./seed.js";

export interface Store {
  users: User[];
  products: Product[];
  /** Keyed by user id. */
  tasteCards: Record<string, TasteCard>;
  gifts: Gift[];
  payments: Payment[];
}

/** A fresh deep copy of the seed, so each app (and each test) owns its data. */
export function createStore(): Store {
  const { users, products, tasteCards } = structuredClone(seed);
  return { users, products, tasteCards, gifts: [], payments: [] };
}
