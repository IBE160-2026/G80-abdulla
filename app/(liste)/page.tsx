import { NewReportFab } from "@/components/new-report-fab";
import { ListFilters } from "@/components/list-filters";
import { ReportList } from "@/components/report-list";
import { parseListParams, type SearchParams } from "@/lib/list-params";
import { getViewer } from "@/lib/supabase/auth";
import { LIST_LIMIT, listReports } from "@/lib/supabase/reports";

// Lista leser visningen med brukerens sesjon og skal aldri caches (AR-11).
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Filter og sortering kommer fra URL-en og tolkes bare av parseListParams.
  // «Mine rapporter» finnes bare for innloggede (Story 3.2).
  const isSignedIn = (await getViewer()).user !== null;
  const params = parseListParams(await searchParams, isSignedIn);
  const { reports, truncated } = await listReports(params);
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-24 pt-4 sm:pb-8">
      <h1 className="mb-1 text-title">Rapporter</h1>
      <ListFilters params={params} isSignedIn={isSignedIn} />
      <ReportList
        reports={reports}
        truncated={truncated}
        limit={LIST_LIMIT}
        now={now}
        params={params}
      />
      <NewReportFab />
    </main>
  );
}
