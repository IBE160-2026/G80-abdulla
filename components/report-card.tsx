import { Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { Report } from "@/lib/supabase/types";

/**
 * Rapportkortet i lista (UX-DR4). Hele kortet er én lenke til detaljsiden.
 * Øverst kategori og statusmerke, så oppsummeringen eller beskrivelsen (maks
 * to linjer) og nederst «N har sett dette · 2 dager siden». Har rapporten
 * bilde, står bildeikonet «Har bilde» sist i metadatalinja (UX-DR5); selve
 * bildet vises bare på detaljsiden. Teksten vises alltid som ren tekst, og
 * lange ord brytes.
 */
export function ReportCard({ report, now }: { report: Report; now: Date }) {
  return (
    <Link
      href={`/rapporter/${report.id}`}
      className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card className="rounded-lg px-3.5 py-3 shadow-none">
        <div className="flex items-center justify-between gap-2">
          <span className="text-meta text-muted-foreground">
            {CATEGORY_LABELS[report.category]}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <p className="my-1 line-clamp-2 text-card-title [overflow-wrap:anywhere]">
          {report.summary ?? report.description}
        </p>
        <p className="text-meta text-muted-foreground">
          {report.seen_count} har sett dette ·{" "}
          {formatRelativeTime(report.created_at, now)}
          {report.has_image && (
            // Med aria-label setter lucide ikke aria-hidden, så skjermlesere
            // leser «Har bilde».
            <ImageIcon
              role="img"
              aria-label="Har bilde"
              size={16}
              className="ml-1.5 inline-block align-[-3px]"
            />
          )}
        </p>
      </Card>
    </Link>
  );
}
