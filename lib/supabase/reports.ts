import { createClient } from "./server";
import { REPORT_COLUMNS, type Report } from "./types";

/** Lista henter høyst så mange rader (AR-12). */
export const LIST_LIMIT = 500;

/**
 * Rapportlista, nyeste først (`created_at DESC, id DESC`), lest med brukerens
 * sesjon. RLS bestemmer hvilke rapporter som er synlige, så her filtreres det
 * aldri på `hidden` (AR-11). `truncated` er sann når lista har nådd
 * grensen, også når det finnes nøyaktig LIST_LIMIT rapporter.
 *
 * Ved feil logges bare feilkoden, aldri rapporttekst, og feilen kastes videre
 * til Next sin feilside.
 */
export async function listReports(): Promise<{
  reports: Report[];
  truncated: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports_with_counts")
    .select(REPORT_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    // postgrest-js setter code til "" når selve kallet feiler (nettverk).
    const code = error.code || "ukjent";
    console.error(code);
    throw new Error(`Kunne ikke hente rapportene (${code}).`);
  }

  return { reports: data, truncated: data.length === LIST_LIMIT };
}
