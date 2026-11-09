import { signReportImage } from "./images";
import { createClient } from "./server";
import { REPORT_COLUMNS, type Report, type ReportRow } from "./types";

/** Lista henter høyst så mange rader (AR-12). */
export const LIST_LIMIT = 500;

/**
 * Kolonnene serveren leser: REPORT_COLUMNS og image_path. image_path leses
 * bare her og gjøres om til `has_image` i toReport, så den aldri sendes til
 * nettleseren (AD-5). Strengen er en literal, så supabase-js kan utlede
 * radtypen.
 */
const SERVER_COLUMNS = `${REPORT_COLUMNS}, image_path` as const;

type ServerRow = Omit<ReportRow, "author_id">;

/**
 * Gjør en rad om til en Report. Feltene skrives ut ett og ett, så image_path
 * (eller en ny kolonne) aldri blir med ved et uhell.
 */
function toReport(row: ServerRow): Report {
  return {
    id: row.id,
    description: row.description,
    location: row.location,
    category: row.category,
    summary: row.summary,
    status: row.status,
    hidden: row.hidden,
    created_at: row.created_at,
    status_changed_at: row.status_changed_at,
    confirmation_count: row.confirmation_count,
    seen_count: row.seen_count,
    confirmed_by_me: row.confirmed_by_me,
    authored_by_me: row.authored_by_me,
    has_image: row.image_path !== null,
  };
}

/**
 * Logger bare feilkoden, aldri rapporttekst, og kaster feilen videre til
 * feilsiden (`app/error.tsx`).
 */
function fail(error: { code: string }, what: string): never {
  // postgrest-js setter code til "" når selve kallet feiler (nettverk).
  const code = error.code || "ukjent";
  console.error(code);
  throw new Error(`Kunne ikke hente ${what} (${code}).`);
}

/**
 * Rapportlista, nyeste først (`created_at DESC, id DESC`), lest med brukerens
 * sesjon. RLS bestemmer hvilke rapporter som er synlige, så her filtreres det
 * aldri på `hidden` (AR-11). `truncated` er sann når lista har nådd
 * grensen, også når det finnes nøyaktig LIST_LIMIT rapporter.
 */
export async function listReports(): Promise<{
  reports: Report[];
  truncated: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports_with_counts")
    .select(SERVER_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) fail(error, "rapportene");

  return {
    reports: data.map(toReport),
    truncated: data.length === LIST_LIMIT,
  };
}

/**
 * Én rapport til detaljsiden, lest med brukerens sesjon, og en signert lenke
 * til bildet når rapporten har bilde. Gir `null` når raden ikke finnes eller
 * RLS skjuler den, så siden kan gi `notFound()`. Lenken lages først etter at
 * rapporten er lest, så en skjult rapport aldri får lenke (AD-6). `imageUrl`
 * er `null` når rapporten ikke har bilde, eller når lenken ikke kunne lages.
 * Id-en må være validert med `parseReportId` først.
 */
export async function getReport(
  id: string,
): Promise<{ report: Report; imageUrl: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports_with_counts")
    .select(SERVER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) fail(error, "rapporten");
  if (!data) return null;

  const imageUrl =
    data.image_path === null ? null : await signReportImage(data.image_path);
  return { report: toReport(data), imageUrl };
}
