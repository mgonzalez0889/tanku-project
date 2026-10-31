import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/data/store.js";
import { noopNotifier } from "../src/realtime.js";
import { startTestServer, type TestServer } from "./helpers/server.js";

// A stand-in for front-tanku/dist: a page and one real file.
let frontDir: string;
let server: TestServer;

beforeAll(() => {
  frontDir = mkdtempSync(join(tmpdir(), "tanku-front-"));
  writeFileSync(join(frontDir, "index.html"), "<!doctype html><title>Nido</title>");
  writeFileSync(join(frontDir, "app.js"), "console.log('app')");
});

afterAll(() => {
  rmSync(frontDir, { recursive: true, force: true });
});

afterEach(() => {
  server.close();
});

const serve = async (staticDir?: string) => {
  server = await startTestServer(createApp(createStore(), noopNotifier, { staticDir }));
};

it("serves the front's page at the root", async () => {
  await serve(frontDir);

  const res = await server.get("/");

  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<title>Nido</title>");
});

it("serves the page for a route that only the front knows, so reloading works", async () => {
  await serve(frontDir);

  const res = await server.get("/una/ruta/del/front");

  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<title>Nido</title>");
});

it("serves a real file as it is, not the page", async () => {
  await serve(frontDir);

  const res = await server.get("/app.js");

  expect(await res.text()).toBe("console.log('app')");
  expect(res.headers.get("content-type")).toContain("javascript");
});

it("keeps the API: /api answers JSON and an unknown /api route is a 404, not the page", async () => {
  await serve(frontDir);

  const health = await server.get("/api/health");
  const unknown = await server.get("/api/no-existe");

  expect(await health.json()).toEqual({ status: "ok" });
  expect(unknown.status).toBe(404);
  expect(await unknown.text()).not.toContain("Nido");
});

it("serves nothing at the root when there is no front to serve (development with Vite)", async () => {
  await serve();

  expect((await server.get("/")).status).toBe(404);
});

it("does not answer the bare /api path with the page either", async () => {
  await serve(frontDir);

  const res = await server.get("/api");

  expect(res.status).toBe(404);
});
