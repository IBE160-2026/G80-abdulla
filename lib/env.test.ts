// Tester I/O-matrisen for lib/env.ts og at instrumentation.ts validerer ved
// oppstart. Kjøres med `npm run test:unit` (Vitest).
//
// Hver rad kjøres i en egen Node-prosess med nøyaktig de miljøvariablene raden
// trenger, slik at valideringen ved oppstart kjøres på nytt og testen ikke
// trenger å endre miljøet til testprosessen.
import { spawnSync } from "node:child_process";
import { expect, test } from "vitest";

const ROOT_URL = new URL("../", import.meta.url).href;
const SECRET = "hemmelig-testverdi-123";
const SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
};

// Kjører `body` i en ny Node-prosess og leser { ok, env | message } som JSON.
// Stiene med «@/» oversettes til prosjektroten med en resolve-hook, siden Node
// ikke leser `paths` i tsconfig.json.
function run(env: Record<string, string>, body: string) {
  const script = `
    import { registerHooks } from "node:module";
    const root = ${JSON.stringify(ROOT_URL)};
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier.startsWith("@/")) {
          return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
        }
        return nextResolve(specifier, context);
      },
    });
    try {
      ${body}
    } catch (error) {
      console.log(JSON.stringify({ ok: false, message: error.message }));
    }
  `;
  const child = spawnSync(
    process.execPath,
    ["--no-warnings", "--input-type=module", "--eval", script],
    { env: { NODE_ENV: "test", ...env }, encoding: "utf8", timeout: 30000 },
  );
  expect(child.status, child.stderr).toBe(0);
  return JSON.parse(child.stdout.trim().split("\n").at(-1) ?? "");
}

// Importerer lib/env.ts og kaller serverEnv().
function start(env: Record<string, string>) {
  return run(
    env,
    `const { serverEnv } = await import(new URL("lib/env.ts", root).href);
     console.log(JSON.stringify({ ok: true, env: serverEnv() }));`,
  );
}

test("uten KI-nøkkel: AI_PROVIDER ikke satt gir mock", () => {
  const result = start({ ...SUPABASE });
  expect(result.ok, result.message).toBe(true);
  expect(result.env.AI_PROVIDER).toBe("mock");
});

test("tom AI_PROVIDER gir mock", () => {
  const result = start({ ...SUPABASE, AI_PROVIDER: "" });
  expect(result.ok, result.message).toBe(true);
  expect(result.env.AI_PROVIDER).toBe("mock");
});

test("openai med alle variablene gir openai", () => {
  const result = start({
    ...SUPABASE,
    AI_PROVIDER: "openai",
    AI_BASE_URL: "https://example.test/v1",
    AI_MODEL: "testmodell",
    AI_API_KEY: SECRET,
  });
  expect(result.ok, result.message).toBe(true);
  expect(result.env.AI_PROVIDER).toBe("openai");
});

test("openai uten nøkkel: feiler og navngir variabelen uten verdier", () => {
  const result = start({
    ...SUPABASE,
    AI_PROVIDER: "openai",
    AI_BASE_URL: "https://example.test/v1",
    AI_MODEL: SECRET,
  });
  expect(result.ok).toBe(false);
  expect(result.message).toMatch(/AI_API_KEY/);
  expect(result.message).not.toContain(SECRET);
  expect(result.message).not.toContain("example.test");
});

test("ugyldig verdi: AI_PROVIDER=foo feiler og navngir variabelen uten verdien", () => {
  const result = start({ ...SUPABASE, AI_PROVIDER: "foo" });
  expect(result.ok).toBe(false);
  expect(result.message).toMatch(/AI_PROVIDER/);
  expect(result.message).not.toContain("foo");
});

test("mangler Supabase-URL: oppstart feiler og peker til README og .env.example", () => {
  const result = start({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      SUPABASE.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  expect(result.ok).toBe(false);
  expect(result.message).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  expect(result.message).toMatch(/README/);
  expect(result.message).toMatch(/\.env\.example/);
});

test("Supabase-URL som ikke er http eller https, feiler", () => {
  const result = start({
    ...SUPABASE,
    NEXT_PUBLIC_SUPABASE_URL: "ftp://127.0.0.1:54321",
  });
  expect(result.ok).toBe(false);
  expect(result.message).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  expect(result.message).not.toContain("ftp:");
});

test("instrumentation.ts: register() feiler ved oppstart når AI_PROVIDER=foo", () => {
  const result = run(
    { ...SUPABASE, AI_PROVIDER: "foo" },
    `const { register } = await import(new URL("instrumentation.ts", root).href);
     await register();
     console.log(JSON.stringify({ ok: true }));`,
  );
  expect(result.ok).toBe(false);
  expect(result.message).toMatch(/AI_PROVIDER/);
});
