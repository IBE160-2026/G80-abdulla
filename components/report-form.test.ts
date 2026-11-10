// Vakttester for skjemaet og KI-forslagene (Story 2.3): forslag og oppsummering
// vises alltid som ren tekst (ingen dangerouslySetInnerHTML i app/ og
// components/), og komponenter importerer aldri lib/ai, men kaller bare
// Server Actions, så nøkkel og leverandørkode aldri havner i klientkoden.
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SELF = "components/report-form.test.ts";

function sources(pattern: string): string[] {
  return globSync(pattern, { cwd: ROOT })
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file !== SELF);
}

const read = (file: string) => readFileSync(join(ROOT, file), "utf8");

test("vakttesten finner kildefilene", () => {
  const files = sources("{app,components}/**/*.{ts,tsx}");
  expect(files).toContain("components/report-form.tsx");
  expect(files).toContain("components/ai-tag.tsx");
  expect(files).toContain("app/rapporter/ny/actions.ts");
});

test("ingen fil i app/ eller components/ bruker dangerouslySetInnerHTML", () => {
  const breaches = sources("{app,components}/**/*.{ts,tsx,js,jsx}").filter((file) =>
    /dangerouslySetInnerHTML/.test(read(file)),
  );
  expect(breaches, "filer med dangerouslySetInnerHTML").toEqual([]);
});

test("ingen komponent importerer lib/ai", () => {
  const breaches = sources("components/**/*.{ts,tsx,js,jsx}").filter((file) =>
    /from\s+["'](@\/lib\/ai|\.{1,2}\/(\.\.\/)*lib\/ai)(\/[^"']*)?["']/.test(read(file)),
  );
  expect(breaches, "komponenter som importerer lib/ai").toEqual([]);
});

test("skjemaet kaller KI-en bare via Server Action", () => {
  const form = read("components/report-form.tsx");
  expect(form).toMatch(/suggestReport/);
  expect(form).toMatch(/from "@\/app\/rapporter\/ny\/actions"/);
  expect(form).not.toMatch(/lib\/ai/);
  expect(form).not.toMatch(/lib\/env/);
});
