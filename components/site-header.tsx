import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { NewReportLink } from "@/components/new-report-link";
import { UserMenu, type MenuViewer } from "@/components/user-menu";

/**
 * Topplinja på alle sider: «LocalFix · Campus Molde» som lenke til lista og
 * menyen til høyre (Story 2.1). Fra 640 px står «Registrer problem» foran
 * menyen (Story 2.2, NewReportLink). På detaljsiden står «←» foran (BackLink).
 * Layouten gir `viewer`: e-postadressen og om brukeren er moderator, eller
 * `null` for en besøkende. Menyen leser stien med `useSearchParams()`, så den
 * står i `<Suspense>`. Plassholderen har samme størrelse som menyknappen.
 */
export function SiteHeader({ viewer }: { viewer: MenuViewer | null }) {
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
        <div className="ml-auto flex items-center gap-2">
          <NewReportLink />
          <Suspense fallback={<span aria-hidden="true" className="-mr-2 size-11 shrink-0" />}>
            <UserMenu viewer={viewer} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
