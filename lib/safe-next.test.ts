// Tester at retur-adressen etter innlogging bare godtas fra samme opprinnelse
// (AD-3, AR-13). Kjøres med `npm test` til Vitest kommer i Story 1.2.
import assert from "node:assert/strict";
import { test } from "node:test";

// Node leser ikke `paths` i tsconfig.json og krever filendelsen, som tsc ikke
// godtar i en vanlig import. Derfor lastes modulen dynamisk.
const { safeNextPath } = (await import(
  new URL("./safe-next.ts", import.meta.url).href
)) as typeof import("./safe-next");

const ORIGIN = "http://localhost:3000";

test("en sti i appen godtas med spørring og anker", () => {
  assert.equal(safeNextPath("/rapporter/123", ORIGIN), "/rapporter/123");
  assert.equal(
    safeNextPath("/?category=waste&mine=true#topp", ORIGIN),
    "/?category=waste&mine=true#topp",
  );
});

test("manglende eller tom next gir /", () => {
  assert.equal(safeNextPath(null, ORIGIN), "/");
  assert.equal(safeNextPath("", ORIGIN), "/");
});

test("adresser til andre nettsteder gir /", () => {
  for (const next of [
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "http://localhost:3001/",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeNextPath(next, ORIGIN), "/", next);
  }
});

test("tab og linjeskift som nettleseren fjerner, gir ikke et annet nettsted", () => {
  for (const next of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example"]) {
    assert.equal(safeNextPath(next, ORIGIN), "/", JSON.stringify(next));
  }
});
