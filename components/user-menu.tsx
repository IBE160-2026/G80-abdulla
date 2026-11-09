"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

/** Det menyen trenger om den innloggede brukeren. Aldri hele brukerobjektet. */
export type MenuViewer = { email: string; isModerator: boolean };

const ITEM = "min-h-11 cursor-pointer px-3 text-base";

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
 * lik for besøkende og innloggede. En besøkende får «Logg inn». En innlogget
 * bruker ser sin egen e-postadresse og «Logg ut», og moderatoren i tillegg
 * merkelappen «Moderator».
 *
 * Topplinja ligger i layouten, som ikke kjenner stien, så `next` bygges her
 * med `usePathname()` og `useSearchParams()`. Komponenten må derfor stå i
 * `<Suspense>`. Nettleserklienten brukes bare til `signOut`.
 */
export function UserMenu({ viewer }: { viewer: MenuViewer | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  async function logOut() {
    // scope "local" logger bare ut denne nettleseren. Lista vises etterpå
    // som for en besøkende.
    await createClient().auth.signOut({ scope: "local" });
    router.replace("/");
    router.refresh();
  }

  // modal={false}: en modal meny gir resten av siden aria-hidden, mens lenkene
  // der fortsatt kan få fokus (axe: aria-hidden-focus). Fokus går likevel inn
  // i menyen, og Escape lukker den og gir fokus tilbake til knappen.
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Meny"
        className="-mr-2 ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
      >
        <Menu aria-hidden="true" className="size-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-max min-w-48 max-w-[calc(100vw-32px)]"
      >
        {viewer ? (
          <>
            <DropdownMenuLabel className="flex flex-col items-start gap-1.5 px-3 py-2 text-base font-normal">
              <span className="break-all">{viewer.email}</span>
              {viewer.isModerator && <Badge variant="secondary">Moderator</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={ITEM} onSelect={logOut}>
              Logg ut
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild className={ITEM}>
            <Link href={loginHref(pathname, searchParams.toString(), searchParams.get("next"))}>
              Logg inn
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
