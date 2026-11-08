// Tester at testserveren i Playwright alltid går i mock, også når .env har
// AI_PROVIDER=openai (I/O-matrisen i Story 1.2, AD-8). Kjøres med Vitest.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { afterEach, expect, test, vi } from "vitest";
import config from "./playwright.config";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("webServer setter AI_PROVIDER=mock uten VAR=x foran kommandoen", () => {
  const webServer = Array.isArray(config.webServer)
    ? config.webServer[0]
    : config.webServer;
  expect(webServer?.env?.AI_PROVIDER).toBe("mock");
  expect(webServer?.command).not.toMatch(/\bAI_PROVIDER=/);
});

// Playwright sender webServer.env til next start som miljøvariabler. Next
// leser .env med @next/env, som ikke overstyrer variabler som allerede finnes.
test("en verdi i miljøet vinner over AI_PROVIDER=openai i .env", () => {
  const dir = mkdtempSync(join(tmpdir(), "localfix-env-"));
  try {
    writeFileSync(join(dir, ".env"), "AI_PROVIDER=openai\n");
    vi.stubEnv("AI_PROVIDER", "mock");
    loadEnvConfig(dir, false, { info: () => {}, error: () => {} }, true);
    expect(process.env.AI_PROVIDER).toBe("mock");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
