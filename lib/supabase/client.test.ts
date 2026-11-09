// Vakttest for nettleserklienten (AD-3, Story 2.1): lib/supabase/client
// importeres bare i skjemaene for innlogging og registrering og i menyen, og
// bare til signInWithPassword, signUp og signOut({ scope: "local" }), aldri
// til data. Leser kildefilene, som images.test.ts. Testfilene er unntatt.
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OWNER = "lib/supabase/client.ts";

// Filene som får importere nettleserklienten, og auth-kallet hver av dem gjør.
const ALLOWED: Record<string, string[]> = {
  "components/login-form.tsx": ["signInWithPassword"],
  "components/sign-up-form.tsx": ["signUp"],
  "components/user-menu.tsx": ["signOut"],
};

const sources = globSync(
  "{app,components,lib,e2e,scripts,supabase}/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  { cwd: ROOT },
)
  .concat(globSync("*.{ts,tsx,js,jsx,mjs,cjs}", { cwd: ROOT }))
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => !/\.(test|spec)\.[cm]?[jt]sx?$/.test(file));

const read = (file: string) => readFileSync(join(ROOT, file), "utf8");

// Statisk og dynamisk import, med alias eller relativ sti.
const IMPORTS_CLIENT =
  /(?:from\s*|import\s*\(\s*)["'](?:@\/lib\/supabase\/client|\.\/client|(?:\.\.\/)+(?:lib\/)?supabase\/client)["']/;

test("vakttesten finner kildefilene", () => {
  expect(sources).toContain(OWNER);
  for (const file of Object.keys(ALLOWED)) expect(sources).toContain(file);
  expect(sources).toContain("components/auth-form.tsx");
  expect(sources).toContain("lib/supabase/auth.ts");
});

test("lib/supabase/client importeres bare i skjemaene og menyen", () => {
  const importers = sources.filter((file) => IMPORTS_CLIENT.test(read(file)));
  expect(importers.sort(), "filer som importerer nettleserklienten").toEqual(
    Object.keys(ALLOWED).sort(),
  );
});

test("createBrowserClient brukes bare i lib/supabase/client.ts", () => {
  const users = sources.filter((file) => /\bcreateBrowserClient\b/.test(read(file)));
  expect(users).toEqual([OWNER]);
});

test.each(Object.entries(ALLOWED))(
  "%s bruker klienten bare til %s",
  (file, methods) => {
    const source = read(file);
    const authCalls = [...source.matchAll(/\.auth\s*\.\s*(\w+)/g)].map((m) => m[1]);
    expect(authCalls, "auth-kall").toEqual(methods);
    // Ingen data: verken tabeller, lagring, RPC eller sanntid.
    expect(source).not.toMatch(/\.(from|rpc|channel|storage)\b/);
  },
);

test("menyen logger bare ut denne nettleseren", () => {
  const source = read("components/user-menu.tsx");
  expect(source).toMatch(/\.signOut\(\s*\{\s*scope:\s*["']local["']\s*\}\s*\)/);
});
