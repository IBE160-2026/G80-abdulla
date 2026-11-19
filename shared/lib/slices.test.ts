// Vakttest for vertical slices (AD-17): en slice i features/<slice>/ importerer
// bare fra seg selv og fra shared/, og shared/ importerer verken features/ eller
// app/. ESLint (no-restricted-imports) tar aliasene, og denne testen tar også
// relative stier og dynamiske importer, som `../../auth/auth-errors`.
// Leser kildefilene, som no-cache.test.ts. Testfilene er med: en test skal
// heller ikke trekke en slice inn i en annen.
import { globSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const norm = (p: string) => p.replaceAll("\\", "/");

const files = globSync("{features,shared}/**/*.{ts,tsx}", { cwd: ROOT }).map(norm);

// Statiske og dynamiske importer, og vi.mock/vi.importActual med en sti.
const SPECIFIER = /(?:from\s*|import\s*\(\s*|vi\.(?:mock|importActual|doMock)\s*\(\s*)["']([^"']+)["']/g;

/** Stien fra rota uten filendelse, eller null for pakker (`react`, `next/link`). */
function resolveTarget(file: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return specifier.slice(2);
  if (specifier.startsWith(".")) return norm(normalize(join(dirname(file), specifier)));
  return null;
}

/** «features/auth», «shared», «app», eller null for alt annet (rotfiler). */
function owner(path: string): string | null {
  const feature = path.match(/^features\/([^/]+)/);
  if (feature) return `features/${feature[1]}`;
  const top = path.match(/^(shared|app)(\/|$)/);
  return top ? top[1] : null;
}

const imports = files.flatMap((file) => {
  const source = readFileSync(join(ROOT, file), "utf8");
  return [...source.matchAll(SPECIFIER)].flatMap(([, specifier]) => {
    const target = resolveTarget(file, specifier);
    return target ? [{ file, specifier, from: owner(file), to: owner(target) }] : [];
  });
});

test("vakttesten finner sliceene og de felles mappene", () => {
  const slices = new Set(files.map(owner).filter((o) => o?.startsWith("features/")));
  for (const slice of ["rapporter", "registrering", "auth", "bekreftelser"]) {
    expect(slices, `features/${slice}`).toContain(`features/${slice}`);
  }
  expect(files).toContain("shared/lib/slices.test.ts");
  expect(files).toContain("shared/supabase/server.ts");
  expect(imports.length).toBeGreaterThan(100);
});

test("en slice importerer bare fra seg selv og fra shared/", () => {
  const breaches = imports.filter(
    ({ from, to }) => from?.startsWith("features/") && to !== null && to !== "shared" && to !== from,
  );
  expect(
    breaches.map(({ file, specifier }) => `${file} importerer ${specifier}`),
    "importer på tvers av slices eller fra app/",
  ).toEqual([]);
});

test("shared/ importerer verken features/ eller app/", () => {
  const breaches = imports.filter(({ from, to }) => from === "shared" && to !== null && to !== "shared");
  expect(
    breaches.map(({ file, specifier }) => `${file} importerer ${specifier}`),
    "shared/ som kjenner en slice",
  ).toEqual([]);
});
