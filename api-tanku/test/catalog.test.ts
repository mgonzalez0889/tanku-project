import type { Product } from "@tanku/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { seed } from "../src/data/seed.js";
import { startTestServer } from "./helpers/server.js";

let server: Awaited<ReturnType<typeof startTestServer>>;

// A fresh app per test: PUT requests change the store.
beforeEach(async () => {
  server = await startTestServer(createApp());
});

afterEach(() => {
  server.close();
});

const get = (path: string) => server.get(path);
const put = (path: string, body: unknown) => server.send("PUT", path, body);

describe("catalog", () => {
  it("GET /api/users returns the 2 preloaded users", async () => {
    const res = await get("/api/users");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(seed.users);
  });

  it("GET /api/products returns the 15 catalog products", async () => {
    const res = await get("/api/products");
    const products = (await res.json()) as unknown[];

    expect(res.status).toBe(200);
    expect(products).toHaveLength(15);
  });
});

describe("taste card", () => {
  const santiagoCard = "/api/users/user-santiago/taste-card";

  it("GET returns the user's card", async () => {
    const res = await get(santiagoCard);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(seed.tasteCards["user-santiago"]);
  });

  it("GET answers 404 USER_NOT_FOUND for an unknown user", async () => {
    const res = await get("/api/users/nobody/taste-card");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "USER_NOT_FOUND" });
  });

  it("PUT saves the card and a later GET returns it", async () => {
    const body = { favoriteCategories: ["home"], likedTags: ["decor"], avoidedTags: [], preferredSize: "s" };

    const putRes = await put(santiagoCard, body);
    const getRes = await get(santiagoCard);

    expect(putRes.status).toBe(200);
    expect(await putRes.json()).toEqual({ userId: "user-santiago", ...body });
    expect(await getRes.json()).toEqual({ userId: "user-santiago", ...body });
  });

  it("PUT with an invalid card answers 400 INVALID_TASTE_CARD and keeps the stored card", async () => {
    const res = await put(santiagoCard, { favoriteCategories: [], likedTags: ["nope"], avoidedTags: [] });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "INVALID_TASTE_CARD" });
    expect(await (await get(santiagoCard)).json()).toEqual(seed.tasteCards["user-santiago"]);
  });

  it("PUT with malformed JSON answers 400 INVALID_JSON, not a server error", async () => {
    const res = await fetch(`${server.baseUrl}${santiagoCard}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "INVALID_JSON" });
  });

  it("PUT answers 404 USER_NOT_FOUND for an unknown user", async () => {
    const res = await put("/api/users/nobody/taste-card", {
      favoriteCategories: [],
      likedTags: [],
      avoidedTags: [],
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "USER_NOT_FOUND" });
  });
});

describe("catalog ranked for a recipient", () => {
  it("hides avoided tags, starts with a favorite category and exposes no score", async () => {
    const res = await get("/api/products?recipientId=user-valentina");
    const products = (await res.json()) as Product[];

    expect(res.status).toBe(200);
    expect(products.length).toBeLessThan(15);
    expect(products.some((p) => p.tags.includes("sport"))).toBe(false);
    expect(["beauty", "home"]).toContain(products[0]!.category);
    expect(products.every((p) => !("score" in p))).toBe(true);
  });

  it("answers 404 USER_NOT_FOUND for an unknown recipient", async () => {
    const res = await get("/api/products?recipientId=nobody");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "USER_NOT_FOUND" });
  });
});
