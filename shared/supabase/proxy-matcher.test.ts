// Tester `config.matcher` i rot-`proxy.ts` (gap fra code review v1 gruppe A,
// deferred-work.md): at proxyen kjører for sider, og ikke for statiske filer,
// bilder, ikoner og manifestet. Et ødelagt uttrykk ville enten stoppet
// fornyelsen av sesjonen eller kjørt proxyen for hver bildefil. Matcheren
// kompileres med Nexts egen `getMiddlewareMatchers` (den samme som `next build`
// bruker), så testen ser det Next ser, ikke en etterligning. Funksjonen ligger
// i en intern modul uten typer, så den hentes med `require` og types her. Går
// den bort i en Next-oppgradering, feiler testen tydelig. Testen ligger her
// fordi `vitest.config.ts` bare tar med tester under shared/, features/ og app/.
import { createRequire } from "node:module";
import { NextRequest, NextResponse } from "next/server";
import { expect, test, vi } from "vitest";

const { updateSession } = vi.hoisted(() => ({ updateSession: vi.fn() }));
vi.mock("@/shared/supabase/proxy", () => ({ updateSession }));

import { config, proxy } from "../../proxy";

type CompiledMatcher = { regexp: string; originalSource: string };
const { getMiddlewareMatchers } = createRequire(import.meta.url)(
  "next/dist/build/analysis/get-page-static-info",
) as {
  getMiddlewareMatchers: (matchers: string[], nextConfig: object) => CompiledMatcher[];
};

const compiled = getMiddlewareMatchers(config.matcher, {});

/** Om proxyen kjører for stien, slik Next avgjør det. */
function runs(path: string): boolean {
  return compiled.some((matcher) => new RegExp(matcher.regexp).test(path));
}

test("config har nøyaktig én matcher, og Next kan kompilere den", () => {
  expect(config.matcher).toHaveLength(1);
  expect(compiled).toHaveLength(1);
  expect(compiled[0].originalSource).toBe(config.matcher[0]);
});

test.each([
  "/",
  "/rapporter/20000000-0000-4000-8000-000000000001",
  "/rapporter/ny",
  "/auth/login",
  "/auth/sign-up",
  "/ikke-en-side",
])("proxyen kjører for %s", (path) => {
  expect(runs(path)).toBe(true);
});

test.each([
  "/_next/static/chunks/app.js",
  "/_next/image",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/bilde.svg",
  "/bilde.jpg",
  "/bilde.jpeg",
  "/bilde.gif",
  "/bilde.webp",
])("proxyen kjører ikke for %s", (path) => {
  expect(runs(path)).toBe(false);
});

test("proxy() gir svaret fra updateSession uendret", async () => {
  const response = NextResponse.next();
  updateSession.mockResolvedValue(response);
  const request = new NextRequest("http://localhost:3000/");
  await expect(proxy(request)).resolves.toBe(response);
  expect(updateSession).toHaveBeenCalledWith(request);
});
