"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * «Registrer problem» i topplinja fra 640 px (UX-DR9, Story 2.2), med lyst
 * omriss på `bg-primary` og trykkflate på 44 px. Under 640 px er den skjult,
 * og den flytende «+»-knappen på lista tar over. Lenka skjules på `/auth/*`
 * og `/rapporter/ny`, der den enten er til ingen nytte eller peker på siden
 * brukeren allerede står på.
 */
export function NewReportLink() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth/") || pathname === "/rapporter/ny") return null;

  return (
    <Link
      href="/rapporter/ny"
      className="hidden min-h-11 items-center rounded-md border border-primary-foreground/70 px-4 text-base font-semibold hover:bg-primary-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground sm:inline-flex"
    >
      Registrer problem
    </Link>
  );
}
