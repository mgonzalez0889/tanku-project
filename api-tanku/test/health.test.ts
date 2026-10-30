import { afterAll, beforeAll, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer } from "./helpers/server.js";

let server: Awaited<ReturnType<typeof startTestServer>>;

beforeAll(async () => {
  server = await startTestServer(createApp());
});

afterAll(() => {
  server.close();
});

it("responds ok on /api/health", async () => {
  const res = await fetch(`${server.baseUrl}/api/health`);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
