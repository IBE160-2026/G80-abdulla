import type { ReportCategory, ReportStatus } from "@/lib/supabase/types";
import type { ListSort } from "@/lib/list-params";

// Norske visningsnavn for kodeverdiene i databasen (AD-10). Eneste sted de
// står. Nøklene er de genererte enumtypene, så en ny kode i databasen gir
// typefeil her til den har fått et navn.

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  waste: "Søppel",
  lighting: "Belysning",
  roads_sidewalks: "Vei og fortau",
  vandalism: "Skadeverk",
  other: "Annet",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  new: "Ny",
  in_progress: "Under behandling",
  resolved: "Løst",
};

// Sorteringen i lista (UX-DR8). Kodene står i `lib/list-params.ts` og er det
// som ligger i URL-en (`sort=newest`, `sort=confirmations`).
export const SORT_LABELS: Record<ListSort, string> = {
  newest: "Nyeste",
  confirmations: "Flest har sett",
};
