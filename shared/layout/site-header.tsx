import Link from "next/link";
import type { ReactNode } from "react";
import { BackLink } from "@/shared/layout/back-link";

/**
 * Topplinja på alle sider: «LocalFix · Campus Molde» som lenke til lista og
 * menyen til høyre (Story 2.1). På detaljsiden står «←» foran (BackLink).
 * Innholdet til høyre (`actions`) kommer fra layouten i `app/`: «Registrer
 * problem» fra 640 px (Story 2.2) og menyen (Story 2.1). Headeren kjenner ingen
 * slice, så `shared/` ikke importerer fra `features/`.
 */
export function SiteHeader({ actions }: { actions: ReactNode }) {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-[640px] items-center px-4">
        <BackLink />
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-md text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
        >
          LocalFix
          <span className="ml-1 font-normal opacity-90">· Campus Molde</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
