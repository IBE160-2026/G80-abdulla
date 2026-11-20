import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmSection } from "@/features/bekreftelser/components/confirm-section";
import { StatusPanel } from "@/features/moderering/components/status-panel";
import { ReportDetail } from "@/features/rapporter/components/report-detail";
import { parseReportId } from "@/shared/report/report-id";
import { getViewer } from "@/shared/supabase/auth";
import { getReport } from "@/features/rapporter/queries";

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
 * bildestien (Story 1.7). `getViewer()` gir om brukeren er innlogget (Story
 * 3.3), så bekreftknappen vet om en besøkende skal til innlogging, og om
 * brukeren er moderator (Story 4.1). Den leses etter rapporten, så en 404
 * aldri gir et kall til Auth. Siden setter sammen slicene: `ReportDetail`
 * (rapporter) får `ConfirmSection` (bekreftelser) og, bare for moderatoren,
 * `StatusPanel` (moderering) som `children`. Panelet er bare grensesnittet:
 * databasen avgjør hvem som kan endre status.
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
  const viewer = await getViewer();
  const isSignedIn = viewer.user !== null;

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <ReportDetail report={result.report} imageUrl={result.imageUrl}>
        <ConfirmSection
          reportId={result.report.id}
          seenCount={result.report.seen_count}
          confirmedByMe={result.report.confirmed_by_me}
          authoredByMe={result.report.authored_by_me}
          hidden={result.report.hidden}
          isSignedIn={isSignedIn}
        />
        {viewer.isModerator && (
          <StatusPanel reportId={result.report.id} status={result.report.status} />
        )}
      </ReportDetail>
    </main>
  );
}
