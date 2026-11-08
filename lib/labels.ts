import type { ReportCategory, ReportStatus } from "@/lib/supabase/types";

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
