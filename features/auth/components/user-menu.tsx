"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { createClient } from "@/shared/supabase/client";

/** Det menyen trenger om den innloggede brukeren. Aldri hele brukerobjektet. */
export type MenuViewer = { email: string; isModerator: boolean };

const ITEM =
  "flex min-h-11 w-full cursor-pointer items-center rounded-sm px-3 text-left text-base hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

/**
 * `next` for «Logg inn»: siden brukeren står på, med spørringen. På
 * `/auth/*` beholdes `next` fra adressen, så brukeren ikke sendes tilbake til
 * innloggingen.
 */
function loginHref(pathname: string, search: string, nextParam: string | null) {
  const next = pathname.startsWith("/auth/")
    ? nextParam
    : `${pathname}${search ? `?${search}` : ""}`;
  return next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login";
}

/**
 * Menyen i topplinja (UX-DR4, Story 2.1): knappen ☰ med `aria-label="Meny"`,
 * lik for besøkende og innloggede. Den viser og skjuler et panel under
 * topplinja. En besøkende får «Logg inn». En innlogget bruker ser sin egen
 * e-postadresse og «Logg ut», og moderatoren i tillegg merkelappen
 * «Moderator».
 *
 * Panelet er et åpne-/lukkepanel (knapp med `aria-expanded`), ikke en
 * `role="menu"` (beslutningen 2026-11-26). Siden bak får verken `aria-hidden`
 * eller fokusfelle, så lenkene der er ikke skjult for skjermleseren mens de
 * kan få fokus (axe: aria-hidden-focus). Fokus blir på knappen når panelet
 * åpnes, og panelet står rett etter knappen, så Tab går inn i det. Escape,
 * klikk utenfor, Tab ut av panelet, valg av «Logg inn» eller «Logg ut» og
 * bytte av side lukker det. Escape og et valg gir fokus tilbake til knappen.
 *
 * Topplinja ligger i layouten, som ikke kjenner stien, så `next` bygges her
 * med `usePathname()` og `useSearchParams()`. Komponenten må derfor stå i
 * `<Suspense>`. Nettleserklienten brukes bare til `signOut`.
 */
export function UserMenu({ viewer }: { viewer: MenuViewer | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Topplinja står igjen når siden byttes (tilbake og fram i nettleseren), så
  // et åpent panel lukkes når adressen endres. State settes under rendering
  // (React-mønsteret for å nullstille state ved ny verdi), ikke i en effekt.
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const [shownFor, setShownFor] = useState(locationKey);
  if (shownFor !== locationKey) {
    setShownFor(locationKey);
    setOpen(false);
  }

  // Klikk utenfor og Escape lukker panelet. Escape lyttes det etter på hele
  // dokumentet, for et klikk på tekst i panelet flytter fokus til body, og da
  // havner Escape utenfor komponenten. Lyttes det bare etter mens det er åpent.
  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePress(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function closeAndFocusButton() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  async function logOut() {
    closeAndFocusButton();
    // scope "local" logger bare ut denne nettleseren. Lista vises etterpå
    // som for en besøkende.
    await createClient().auth.signOut({ scope: "local" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div
      ref={containerRef}
      className="relative -mr-2 shrink-0"
      onBlur={(event) => {
        // Tab ut av panelet lukker det. Uten relatedTarget (klikk på noe som
        // ikke kan få fokus) er det klikket utenfor som lukker.
        const next = event.relatedTarget as Node | null;
        if (next && !containerRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Meny"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
      >
        <Menu aria-hidden="true" className="size-6" />
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Konto"
          className="absolute right-0 top-full z-50 mt-1 w-max min-w-48 max-w-[calc(100vw-32px)] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {viewer ? (
            <>
              <div className="flex flex-col items-start gap-1.5 px-3 py-2 text-base">
                <span className="break-all">{viewer.email}</span>
                {viewer.isModerator && <Badge variant="secondary">Moderator</Badge>}
              </div>
              <hr className="-mx-1 my-1 border-border" />
              <button type="button" className={ITEM} onClick={logOut}>
                Logg ut
              </button>
            </>
          ) : (
            <Link
              href={loginHref(pathname, searchParams.toString(), searchParams.get("next"))}
              className={ITEM}
              onClick={closeAndFocusButton}
            >
              Logg inn
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
