// Tester Playwright-oppsettet (Story 1.2, AD-15): at testserveren alltid går i
// mock, også når .env har AI_PROVIDER=openai (AD-8), at prosjektene kjører i
// rekkefølgen les → endrer → reset, at hver spec-fil i e2e/ hører til et
// prosjekt, og reglene i definisjonen av ferdig. Kjøres med Vitest.
import { globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { afterEach, expect, test, vi } from "vitest";
import config from "./playwright.config";

const ROOT = fileURLToPath(new URL("./", import.meta.url));

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
    writeFileSync(join(dir, ".env"), "AI_PROVIDER=openai\nLOCALFIX_CANARY=1\n");
    vi.stubEnv("AI_PROVIDER", "mock");
    // Fjernes før lesingen og settes tilbake av unstubAllEnvs etterpå.
    vi.stubEnv("LOCALFIX_CANARY", undefined);
    loadEnvConfig(dir, false, { info: () => {}, error: () => {} }, true);
    // Kontroll: .env-fila ble faktisk lest.
    expect(process.env.LOCALFIX_CANARY).toBe("1");
    expect(process.env.AI_PROVIDER).toBe("mock");
  } finally {
    delete process.env.LOCALFIX_CANARY;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("prosjektene kjører i rekkefølgen les → endrer → reset", () => {
  const projects = (config.projects ?? []).map((project) => ({
    name: project.name,
    testMatch: project.testMatch,
    dependencies: project.dependencies ?? [],
  }));
  const LES = ["les-360", "les-1280"];
  const ENDRER_MATCH = ["e2e/core-flow.spec.ts", "e2e/endrer/**/*.spec.ts"];
  expect(projects).toEqual([
    { name: "les-360", testMatch: "e2e/les/**/*.spec.ts", dependencies: [] },
    { name: "les-1280", testMatch: "e2e/les/**/*.spec.ts", dependencies: [] },
    { name: "endrer-360", testMatch: ENDRER_MATCH, dependencies: LES },
    { name: "endrer-1280", testMatch: ENDRER_MATCH, dependencies: LES },
    {
      name: "reset",
      testMatch: "e2e/reset/**/*.spec.ts",
      dependencies: ["endrer-360", "endrer-1280"],
    },
  ]);
});

// Samme regel som Playwright: et mønster som ikke starter med **/, får **/
// foran og sammenlignes med hele stien.
function matches(file: string, testMatch: unknown): boolean {
  const patterns = Array.isArray(testMatch) ? testMatch : [testMatch];
  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) return pattern.test(file);
    if (typeof pattern !== "string") return false;
    const glob = pattern.startsWith("**/") ? pattern : `**/${pattern}`;
    return posix.matchesGlob(file, glob);
  });
}

test("hver spec-fil i e2e/ kjøres av minst ett prosjekt", () => {
  const files = globSync("e2e/**/*.spec.ts", { cwd: ROOT }).map((file) =>
    posix.join(ROOT.replaceAll("\\", "/"), file.replaceAll("\\", "/")),
  );
  expect(files.some((file) => file.endsWith("/e2e/core-flow.spec.ts"))).toBe(
    true,
  );
  const orphans = files.filter(
    (file) =>
      !(config.projects ?? []).some((project) =>
        matches(file, project.testMatch),
      ),
  );
  expect(orphans, "spec-filer som ingen prosjekter kjører").toEqual([]);
});

test("e2e/ følger definisjonen av ferdig", () => {
  const files = globSync("e2e/**/*.ts", { cwd: ROOT });
  expect(files.length).toBeGreaterThan(0);
  const breaches = files.filter((file) => {
    const source = readFileSync(join(ROOT, file), "utf8");
    return /\btest\.(skip|fixme)\b/.test(source) || /\.only\(/.test(source);
  });
  expect(breaches, "filer med test.skip, test.fixme eller .only(").toEqual([]);

  // Kjerneflyttesten bruker bare tastaturet etter første goto (AD-15).
  // setInputFiles er tillatt.
  const coreFlow = readFileSync(join(ROOT, "e2e/core-flow.spec.ts"), "utf8");
  expect(coreFlow.match(/goto\(/g)?.length ?? 0).toBeLessThanOrEqual(1);
  expect(
    coreFlow.match(/\.(click|dblclick|fill|focus|check|tap|selectOption)\(/g),
  ).toBeNull();
});
