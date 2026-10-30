import express from "express";
import { createStore, type Store } from "./data/store.js";

export function createApp(store: Store = createStore()) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/users", (_req, res) => {
    res.json(store.users);
  });

  app.get("/api/products", (_req, res) => {
    res.json(store.products);
  });

  return app;
}
