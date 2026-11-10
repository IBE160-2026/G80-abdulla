import type { Metadata } from "next";
import { ReportForm } from "@/components/report-form";
import { requireUser } from "@/lib/supabase/auth";

// Siden krever innlogging og leser brukerens sesjon, så den skal aldri
// caches (AR-11).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ny rapport · LocalFix",
};

/**
 * Skjemaet for en ny rapport (FR-3, Story 2.2). En besøkende sendes til
 * innlogging og er tilbake her etterpå (`requireUser`).
 */
export default async function NewReportPage() {
  await requireUser("/rapporter/ny");

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <h1 className="mb-4 text-title">Ny rapport</h1>
      <ReportForm />
    </main>
  );
}
