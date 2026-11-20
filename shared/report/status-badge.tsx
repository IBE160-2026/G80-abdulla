import { Badge } from "@/shared/ui/badge";
import { STATUS_LABELS } from "@/shared/report/labels";
import type { ReportStatus } from "@/shared/supabase/types";
import { cn } from "@/shared/lib/utils";

const STATUS_CLASSES: Record<ReportStatus, string> = {
  new: "bg-status-new text-status-new-foreground",
  in_progress: "bg-status-progress text-status-progress-foreground",
  resolved: "bg-status-done text-status-done-foreground",
};

/**
 * Statusmerket. Teksten står alltid i merket, så fargen er aldri eneste
 * bærer av status (UX-DR5).
 */
export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border-transparent px-2.5 py-0.5 text-badge",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
