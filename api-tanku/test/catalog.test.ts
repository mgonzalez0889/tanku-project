import { afterAll, beforeAll, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { seed } from "../src/data/seed.js";
import { startTestServer } from "./helpers/server.js";

let server: Awaited<ReturnType<typeof startTestServer>>;

beforeAll(async () => {
  server = await startTestServer(createApp());
});

afterAll(() => {
  server.close();
});

it("GET /api/users returns the 2 preloaded users", async () => {
  const res = await fetch(`${server.baseUrl}/api/users`);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(seed.users);
});

it("GET /api/products returns the 15 catalog products", async () => {
  const res = await fetch(`${server.baseUrl}/api/products`);
  const products = (await res.json()) as unknown[];

  expect(res.status).toBe(200);
  expect(products).toHaveLength(15);
});
