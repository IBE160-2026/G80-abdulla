// Tester I/O-matrisen for lib/env.ts. Kjøres med `node --test lib/env.test.ts`
// (Node 24 kjører TypeScript direkte) til Vitest kommer i Story 1.2.
//
// Hver rad kjøres i en egen Node-prosess med nøyaktig de miljøvariablene raden
// trenger, slik at valideringen ved oppstart kjøres på nytt og testen ikke
// trenger å endre miljøet til testprosessen.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const ENV_URL = new URL("./env.ts", import.meta.url).href;
const SECRET = "hemmelig-testverdi-123";
const SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
};

// Importerer lib/env.ts, kaller serverEnv() og skriver ut resultatet som JSON.
function start(env: Record<string, string>) {
  const script = `
    try {
      const { serverEnv } = await import(${JSON.stringify(ENV_URL)});
      console.log(JSON.stringify({ ok: true, env: serverEnv() }));
    } catch (error) {
      console.log(JSON.stringify({ ok: false, message: error.message }));
    }
  `;
  const child = spawnSync(
    process.execPath,
    ["--no-warnings", "--input-type=module", "--eval", script],
    { env: { NODE_ENV: "test", ...env }, encoding: "utf8" },
  );
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim().split("\n").at(-1) ?? "");
}

test("uten KI-nøkkel: AI_PROVIDER ikke satt gir mock", () => {
  const result = start({ ...SUPABASE });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.env.AI_PROVIDER, "mock");
});

test("openai uten nøkkel: feiler og navngir variabelen uten verdier", () => {
  const result = start({
    ...SUPABASE,
    AI_PROVIDER: "openai",
    AI_BASE_URL: "https://example.test/v1",
    AI_MODEL: SECRET,
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /AI_API_KEY/);
  assert.ok(!result.message.includes(SECRET));
  assert.ok(!result.message.includes("example.test"));
});

test("ugyldig verdi: AI_PROVIDER=foo feiler og navngir variabelen uten verdien", () => {
  const result = start({ ...SUPABASE, AI_PROVIDER: "foo" });
  assert.equal(result.ok, false);
  assert.match(result.message, /AI_PROVIDER/);
  assert.ok(!result.message.includes("foo"));
});

test("mangler Supabase-URL: oppstart feiler og peker til README og .env.example", () => {
  const result = start({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      SUPABASE.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(result.message, /README/);
  assert.match(result.message, /\.env\.example/);
});
