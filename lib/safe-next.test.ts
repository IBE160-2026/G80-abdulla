// Tester at retur-adressen etter innlogging bare godtas fra samme opprinnelse
// (AD-3, AR-13). Kjøres med `npm run test:unit` (Vitest).
import { safeNextPath } from "@/lib/safe-next";
import { expect, test } from "vitest";

const ORIGIN = "http://localhost:3000";

test("en sti i appen godtas med spørring og anker", () => {
  expect(safeNextPath("/rapporter/123", ORIGIN)).toBe("/rapporter/123");
  expect(safeNextPath("/?category=waste&mine=true#topp", ORIGIN)).toBe(
    "/?category=waste&mine=true#topp",
  );
});

test("manglende eller tom next gir /", () => {
  expect(safeNextPath(null, ORIGIN)).toBe("/");
  expect(safeNextPath("", ORIGIN)).toBe("/");
});

test("adresser til andre nettsteder gir /", () => {
  for (const next of [
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "http://localhost:3001/",
    "javascript:alert(1)",
  ]) {
    expect(safeNextPath(next, ORIGIN), next).toBe("/");
  }
});

test("tab og linjeskift som nettleseren fjerner, gir ikke et annet nettsted", () => {
  for (const next of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example"]) {
    expect(safeNextPath(next, ORIGIN), JSON.stringify(next)).toBe("/");
  }
});
