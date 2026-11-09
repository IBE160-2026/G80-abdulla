import { ReportCard } from "@/components/report-card";
import { formatReportCount } from "@/lib/format";
import type { Report } from "@/lib/supabase/types";

/**
 * Rapportlista (UX-DR6, UX-DR16): antallet, teksten om avkortet liste og
 * kortene i en `ul`. En tom liste gir tomtilstanden uten antall.
 */
export function ReportList({
  reports,
  truncated,
  limit,
  now,
}: {
  reports: Report[];
  truncated: boolean;
  limit: number;
  now: Date;
}) {
  if (reports.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Ingen rapporter ennå. Har du sett noe som bør fikses?
      </p>
    );
  }

  return (
    <>
      <p className="mb-2.5 text-meta text-muted-foreground">
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
