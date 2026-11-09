import { ReportList } from "@/components/report-list";
import { LIST_LIMIT, listReports } from "@/lib/supabase/reports";

// Lista leser visningen med brukerens sesjon og skal aldri caches (AR-11).
export const dynamic = "force-dynamic";

export default async function Home() {
  const { reports, truncated } = await listReports();
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <h1 className="mb-1 text-title">Rapporter</h1>
      <ReportList
        reports={reports}
        truncated={truncated}
        limit={LIST_LIMIT}
        now={now}
      />
    </main>
  );
}
