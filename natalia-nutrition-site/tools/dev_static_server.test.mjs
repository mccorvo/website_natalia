import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { createStaticServer } from "./dev_static_server.mjs";

test("serves the site index from the project root", async (t) => {
  const server = createStaticServer({ root: process.cwd() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/html\b/);
  assert.match(await response.text(), /<html/i);
});

test("redirects the retired English landing page to the canonical homepage", async (t) => {
  const server = createStaticServer({ root: process.cwd() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/en/`, { redirect: "manual" });

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "/");
});

test("does not serve files outside the project root", async (t) => {
  const server = createStaticServer({ root: path.join(process.cwd(), "assets") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/%2e%2e/package.json`);

  assert.equal(response.status, 404);
});
