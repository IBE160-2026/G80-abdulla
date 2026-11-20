import { Plus } from "lucide-react";
import Link from "next/link";

/**
 * Den flytende «+»-knappen på lista (UX-DR9, Story 2.2): 56 px, nede til
 * høyre, bare under 640 px. Fra 640 px har topplinja «Registrer problem»
 * (NewReportLink). Den eneste egne skyggen i appen. Lista har ekstra `pb`
 * under siste kort, så knappen ikke dekker det.
 */
export function NewReportFab() {
  return (
    <Link
      href="/rapporter/ny"
      aria-label="Registrer problem"
      className="fixed bottom-4 right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
    >
      <Plus aria-hidden="true" className="size-6" />
    </Link>
  );
}
