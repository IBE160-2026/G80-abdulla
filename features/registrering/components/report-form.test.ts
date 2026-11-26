// Vakttester for skjemaet og KI-forslagene (Story 2.3): forslag og oppsummering
// vises alltid som ren tekst (ingen dangerouslySetInnerHTML i app/, features/
// og shared/), og komponenter importerer aldri ai/, men kaller bare
// Server Actions, så nøkkel og leverandørkode aldri havner i klientkoden.
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SELF = "features/registrering/components/report-form.test.ts";

function sources(pattern: string): string[] {
  return globSync(pattern, { cwd: ROOT })
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file !== SELF);
}

const read = (file: string) => readFileSync(join(ROOT, file), "utf8");

test("vakttesten finner kildefilene", () => {
  const files = sources("{app,features}/**/*.{ts,tsx}");
  expect(files).toContain("features/registrering/components/report-form.tsx");
  expect(files).toContain("features/registrering/components/ai-tag.tsx");
  expect(files).toContain("features/registrering/actions.ts");
});

test("ingen fil i app/, features/ eller shared/ bruker dangerouslySetInnerHTML", () => {
  const breaches = sources("{app,features,shared}/**/*.{ts,tsx,js,jsx}").filter((file) =>
    /dangerouslySetInnerHTML/.test(read(file)),
  );
  expect(breaches, "filer med dangerouslySetInnerHTML").toEqual([]);
});

test("ingen komponent importerer features/registrering/ai", () => {
  const files = sources("features/*/components/**/*.{ts,tsx,js,jsx}");
  expect(files).toContain("features/registrering/components/report-form.tsx");
  const breaches = files.filter((file) =>
    /from\s+["'](@\/features\/registrering\/ai|(\.{1,2}\/)+ai)(\/[^"']*)?["']/.test(read(file)),
  );
  expect(breaches, "komponenter som importerer features/registrering/ai").toEqual([]);
});

test("skjemaet kaller KI-en bare via Server Action", () => {
  const form = read("features/registrering/components/report-form.tsx");
  expect(form).toMatch(/suggestReport/);
  expect(form).toMatch(/from "@\/features\/registrering\/actions"/);
  expect(form).not.toMatch(/registrering\/ai/);
  expect(form).not.toMatch(/shared\/lib\/env/);
});

// Story 2.4: bildebehandlingen ligger på serveren. `sharp` er en native pakke og
// skal aldri inn i klientkoden, og skjemaet sender bare filen med Server Action.
test("ingen komponent importerer features/registrering/image-process eller sharp", () => {
  const breaches = sources("features/*/components/**/*.{ts,tsx,js,jsx}").filter((file) =>
    /from\s+["'](sharp|@\/features\/registrering\/image-process|(\.{1,2}\/)+image-process)["']/.test(
      read(file),
    ),
  );
  expect(breaches, "komponenter som importerer sharp eller features/registrering/image-process").toEqual([]);
});

test("bildefeltet bruker bare image-input og image-resize, og skjemaet bruker ImageField", () => {
  const field = read("features/registrering/components/image-field.tsx");
  expect(field).toMatch(/from "@\/features\/registrering\/image-input"/);
  expect(field).toMatch(/from "@\/features\/registrering\/image-resize"/);
  expect(field).not.toMatch(/image-process|sharp/);
  expect(field).not.toMatch(/\bcapture\s*=/);
  // Skaleringen i nettleseren bruker canvas, aldri serverens bildebehandling.
  expect(read("features/registrering/image-resize.ts")).not.toMatch(/image-process|sharp/);
  expect(read("features/registrering/components/report-form.tsx")).toMatch(
    /from "@\/features\/registrering\/components\/image-field"/,
  );
});
