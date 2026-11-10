// Vakttest for AR-11 (AD-13): sider som leser visningen skal aldri caches.
// Leser kildefilene i app/, components/ og lib/ og feiler på cache-direktivet og
// unstable_cache, og hvis rapportlista eller detaljsiden ikke er force-dynamic.
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SELF = "lib/no-cache.test.ts";

// Sidene som leser reports_with_counts, og skjemasiden, som krever innlogging.
const PAGES = [
  "app/(liste)/page.tsx",
  "app/rapporter/[id]/page.tsx",
  "app/rapporter/ny/page.tsx",
];

const sources = globSync("{app,components,lib}/**/*.{ts,tsx,js,jsx,mjs}", { cwd: ROOT })
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => file !== SELF);

test("vakttesten finner kildefilene", () => {
  for (const page of PAGES) expect(sources).toContain(page);
  expect(sources).toContain("components/report-card.tsx");
  expect(sources).toContain("components/report-detail.tsx");
  expect(sources).toContain("lib/supabase/reports.ts");
});

test("ingen kildefil i app/, components/ eller lib/ bruker cache-direktivet eller unstable_cache", () => {
  const breaches = sources.filter((file) => {
    const source = readFileSync(join(ROOT, file), "utf8");
    return /["']use cache(:[^"']*)?["']/.test(source) || /\bunstable_cache\b/.test(source);
  });
  expect(breaches, "filer med 'use cache' eller unstable_cache").toEqual([]);
});

test.each(PAGES)("%s er force-dynamic", (file) => {
  const page = readFileSync(join(ROOT, file), "utf8");
  expect(page).toMatch(
    /^export const dynamic = ["']force-dynamic["'];?$/m,
  );
});
