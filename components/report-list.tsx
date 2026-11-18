import Link from "next/link";
import { ReportCard } from "@/components/report-card";
import { Button } from "@/components/ui/button";
import { formatReportCount } from "@/lib/format";
import { buildListHref, clearFilters, hasActiveFilter, type ListParams } from "@/lib/list-params";
import type { Report } from "@/lib/supabase/types";

/**
 * Rapportlista (UX-DR6, UX-DR16): antallet, teksten om avkortet liste og
 * kortene i en `ul`. En tom liste gir tomtilstanden uten antall: «Ingen
 * rapporter matcher filteret.» med «Nullstill filter» når et filter er aktivt
 * (Story 3.1), ellers beskjeden om at det ikke finnes rapporter ennå.
 */
export function ReportList({
  reports,
  truncated,
  limit,
  now,
  params,
}: {
  reports: Report[];
  truncated: boolean;
  limit: number;
  now: Date;
  params: ListParams;
}) {
  if (reports.length === 0 && hasActiveFilter(params)) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p role="status" className="text-muted-foreground">
          Ingen rapporter matcher filteret.
        </p>
        <Button asChild variant="outline" className="h-11 px-6 text-base">
          <Link href={buildListHref(clearFilters(params))}>Nullstill filter</Link>
        </Button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">
          Ingen rapporter ennå. Har du sett noe som bør fikses?
        </p>
        <Button asChild className="h-11 px-6 text-base">
          <Link href="/rapporter/ny">Registrer problem</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <p aria-live="polite" className="mb-2.5 text-meta text-muted-foreground">
        {formatReportCount(reports.length)}
      </p>
      {truncated && (
        <p className="mb-2.5 text-meta text-muted-foreground">
          Lista viser bare de {limit} første rapportene.
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {reports.map((report) => (
          <li key={report.id}>
            <ReportCard report={report} now={now} />
          </li>
        ))}
      </ul>
    </>
  );
}
