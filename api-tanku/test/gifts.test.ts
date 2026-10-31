import type { Gift } from "@tanku/shared";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer } from "./helpers/server.js";

let server: Awaited<ReturnType<typeof startTestServer>>;

// A fresh app per test: POST requests change the store.
beforeEach(async () => {
  server = await startTestServer(createApp());
});

afterEach(() => {
  server.close();
});

const postGift = (body: unknown) => server.send("POST", "/api/gifts", body);
const giftsOf = (userId: string) => server.get(`/api/users/${userId}/gifts`);

const speakerFromValentinaToSantiago = {
  giverId: "user-valentina",
  recipientId: "user-santiago",
  productId: "product-speaker",
  variantId: "black",
  message: "Para tus caminatas",
};

it("POST /api/gifts creates a payment_pending gift that the giver then sees", async () => {
  const res = await postGift(speakerFromValentinaToSantiago);
  const gift = (await res.json()) as Gift;

  expect(res.status).toBe(201);
  expect(gift.status).toBe("payment_pending");
  expect(typeof gift.id).toBe("string");
  expect(await (await giftsOf("user-valentina")).json()).toEqual([gift]);
});

it("preselects the recipient's size for a fashion product without variantId", async () => {
  const res = await postGift({
    giverId: "user-valentina",
    recipientId: "user-santiago",
    productId: "product-tshirt",
  });
  const gift = (await res.json()) as Gift;

  expect(res.status).toBe(201);
  expect(gift.variantId).toBe("l");
});

it("answers 400 RECIPIENT_SIZE_UNKNOWN when the recipient saved no size, and accepts a size the giver picks", async () => {
  // Santiago's card without a size, as the "Mi tarjeta" screen saves it for "Sin preferencia".
  await server.send("PUT", "/api/users/user-santiago/taste-card", {
    favoriteCategories: [],
    likedTags: [],
    avoidedTags: [],
  });
  const shirtForSantiago = { giverId: "user-valentina", recipientId: "user-santiago", productId: "product-tshirt" };

  const withoutSize = await postGift(shirtForSantiago);
  const withSize = await postGift({ ...shirtForSantiago, variantId: "m" });

  expect(withoutSize.status).toBe(400);
  expect(await withoutSize.json()).toEqual({ error: "RECIPIENT_SIZE_UNKNOWN" });
  expect(withSize.status).toBe(201);
});

it("keeps the gift hidden from the recipient until it is paid", async () => {
  await postGift(speakerFromValentinaToSantiago);

  const res = await giftsOf("user-santiago");

  expect(await res.json()).toEqual([]);
});

it("answers 400 INVALID_GIFT for a bad body and stores nothing", async () => {
  const res = await postGift({ ...speakerFromValentinaToSantiago, productId: "nothing" });

  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: "INVALID_GIFT" });
  expect(await (await giftsOf("user-valentina")).json()).toEqual([]);
});

it("GET /api/users/:userId/gifts answers 404 USER_NOT_FOUND for an unknown user", async () => {
  const res = await giftsOf("nobody");

  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: "USER_NOT_FOUND" });
});
