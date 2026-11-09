import Link from "next/link";
import { BackLink } from "@/components/back-link";

/**
 * Topplinja på alle sider: «LocalFix · Campus Molde» som lenke til lista. På
 * detaljsiden står «←» foran (BackLink). Menyen og innloggingen kommer i
 * Story 2.1.
 */
export function SiteHeader() {
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
      </div>
    </header>
  );
}
