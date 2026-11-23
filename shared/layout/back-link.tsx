"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";

/** Dybden til historikkoppføringen i appen, lagret i `history.state`. */
function entryDepth(): number | undefined {
  const depth: unknown = window.history.state?.localfixDepth;
  return typeof depth === "number" ? depth : undefined;
}

/**
 * Stien til siden før denne oppføringen, lagret i `history.state`
 * (`localfixFrom`). `undefined` når den mangler eller ikke er kjent.
 */
function entryFrom(): string | undefined {
  const from: unknown = window.history.state?.localfixFrom;
  return typeof from === "string" ? from : undefined;
}

/**
 * «←» i topplinja på detaljsiden og 404-siden under /rapporter/ (beslutningen
 * om topplinja i Story 1.5, rettet i Epic 3 retro 15). Er siden før lista, går
 * lenken ett steg tilbake i historikken, som nettleserens tilbakeknapp, så
 * rulleposisjonen og filtrene i URL-en blir bevart. I alle andre tilfeller
 * går den til lista: en delt lenke, et bokmerke, en ny fane, innloggingen og
 * skjemaet etter innsending. Uten JavaScript er den en vanlig lenke til `/`.
 *
 * Hver historikkoppføring får sin egen dybde, `localfixDepth` i
 * `history.state`: 0 for den første siden i appen og forrige dybde + 1 for
 * hver ny side, og stien til forrige side, `localfixFrom`. Begge følger
 * oppføringen, så de er riktige også etter nettleserens tilbake- og
 * fram-knapp. Mangler dybden, for eksempel fordi `router.replace` har skrevet
 * over `history.state`, settes begge på nytt ut fra siden brukeren kom fra, og
 * da er det siden som ble erstattet (skjemaet eller innloggingen), ikke lista.
 * Komponenten står alltid i topplinja, så forrige sti overlever
 * klientnavigasjon.
 */
export function BackLink() {
  const pathname = usePathname();
  const router = useRouter();
  const lastDepth = useRef<number | null>(null);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    let depth = entryDepth();
    if (depth === undefined) {
      depth = lastDepth.current === null ? 0 : lastDepth.current + 1;
      // Beholder Next sine felt (__NA og treet) i oppføringen.
      window.history.replaceState(
        {
          ...window.history.state,
          localfixDepth: depth,
          localfixFrom: lastPath.current ?? undefined,
        },
        "",
      );
    }
    lastDepth.current = depth;
    lastPath.current = pathname;
  }, [pathname]);

  if (!pathname.startsWith("/rapporter/")) return null;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Ctrl-, Cmd-, Shift- og Alt-klikk og midtklikk åpner lista som vanlig.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    if ((entryDepth() ?? 0) > 0 && entryFrom() === "/") {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label="Tilbake til lista"
      className="-ml-3 inline-flex min-h-12 min-w-11 items-center justify-center rounded-md text-xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
    >
      <span aria-hidden="true">←</span>
    </Link>
  );
}
