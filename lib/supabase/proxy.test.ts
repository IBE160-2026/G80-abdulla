// Tester at proxyen aldri sender besøkende til innlogging (AR-2, I/O-matrisen
// i Story 1.1). Kjøres med `node --test lib/supabase/proxy.test.ts` til Vitest
// kommer i Story 1.2.
//
// updateSession kjøres i en egen Node-prosess med Supabase-variablene satt, og
// stiene med «@/» oversettes til prosjektroten med en resolve-hook, siden Node
// ikke leser `paths` i tsconfig.json.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const ROOT_URL = new URL("../../", import.meta.url).href;
const PATHS = ["/", "/noe", "/auth/login", "/rapporter/123"];

function runProxy(paths: string[]) {
  const script = `
    import { registerHooks } from "node:module";
    const root = ${JSON.stringify(ROOT_URL)};
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier.startsWith("@/")) {
          return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
        }
        // next har ikke et exports-kart, så ESM i Node trenger filendelsen.
        if (specifier === "next/server") {
          return nextResolve("next/server.js", context);
        }
        return nextResolve(specifier, context);
      },
    });
    const { NextRequest } = await import("next/server.js");
    const { updateSession } = await import(new URL("lib/supabase/proxy.ts", root).href);
    const results = [];
    for (const path of ${JSON.stringify(paths)}) {
      const response = await updateSession(new NextRequest("http://localhost:3000" + path));
      results.push({ path, status: response.status, location: response.headers.get("location") });
    }
    console.log(JSON.stringify(results));
  `;
  const child = spawnSync(
    process.execPath,
    ["--no-warnings", "--input-type=module", "--eval", script],
    {
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      },
      encoding: "utf8",
      timeout: 30000,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim().split("\n").at(-1) ?? "[]") as {
    path: string;
    status: number;
    location: string | null;
  }[];
}

test("besøkende på undersider sendes ikke til /auth/login", () => {
  const results = runProxy(PATHS);
  assert.equal(results.length, PATHS.length);
  for (const { path, status, location } of results) {
    assert.equal(location, null, `${path} sendte videre til ${location}`);
    assert.equal(status, 200, `${path} ga status ${status}`);
  }
});
