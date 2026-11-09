import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportDetail } from "@/components/report-detail";
import { parseReportId } from "@/lib/report-id";
import { getReport } from "@/lib/supabase/reports";

// Detaljsiden leser visningen med brukerens sesjon og lager en signert lenke
// til bildet, så den skal aldri caches (AR-11, AD-13). Next sender da
// `Cache-Control: private, no-cache, no-store, …`, som e2e/les/detalj.spec.ts
// sjekker.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rapport · LocalFix",
};

/**
 * Detaljsiden (FR-5, FR-8). En ugyldig id gir 404 uten databasekall. En id
 * som ikke finnes, eller en rapport RLS skjuler, gir også 404, før noen
 * bildelenke lages. Appen filtrerer aldri på `hidden` selv. Siden har ingen
 * lastegrense, så Next rekker å svare 404 før noe strømmes (Design Notes i
 * spec-en for Story 1.5). Komponenten får bare den signerte lenken, aldri
 * bildestien (Story 1.7).
 */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseReportId((await params).id);
  if (!id) notFound();

  const result = await getReport(id);
  if (!result) notFound();

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <ReportDetail report={result.report} imageUrl={result.imageUrl} />
    </main>
  );
}
