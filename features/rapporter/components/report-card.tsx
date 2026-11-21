import { Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/shared/report/status-badge";
import { Card } from "@/shared/ui/card";
import { formatRelativeTime } from "@/shared/lib/format";
import { CATEGORY_LABELS } from "@/shared/report/labels";
import { cn } from "@/shared/lib/utils";
import type { Report } from "@/shared/supabase/types";
import { HiddenBadge } from "./hidden-badge";

/**
 * Rapportkortet i lista (UX-DR4). Hele kortet er én lenke til detaljsiden.
 * Øverst kategori og statusmerke, så oppsummeringen eller beskrivelsen (maks
 * to linjer) og nederst «N har sett dette · 2 dager siden». Har rapporten
 * bilde, står bildeikonet «Har bilde» sist i metadatalinja (UX-DR5); selve
 * bildet vises bare på detaljsiden. Teksten vises alltid som ren tekst, og
 * lange ord brytes. En skjult rapport (bare moderatoren får den fra RLS) har
 * grå bakgrunn og merkelappen «Skjult» foran statusmerket (Story 4.2).
 */
export function ReportCard({ report, now }: { report: Report; now: Date }) {
  return (
    <Link
      href={`/rapporter/${report.id}`}
      className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card
        className={cn(
          "rounded-lg px-3.5 py-3 shadow-none",
          report.hidden && "bg-status-hidden",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-meta text-muted-foreground">
            {CATEGORY_LABELS[report.category]}
          </span>
          <span className="flex items-center gap-1.5">
            {report.hidden && <HiddenBadge />}
            <StatusBadge status={report.status} />
          </span>
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
