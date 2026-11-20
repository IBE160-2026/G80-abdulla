// Feilvokabularet til Server Actions (AD-1, Story 2.2). Lukket sett med koder,
// med faste norske meldinger. Tekst fra databasen eller Supabase vises eller
// logges aldri: en ukjent feil gir `unknown`.

export const ERROR_MESSAGES = {
  unauthenticated: "Du må logge inn først.",
  forbidden: "Du har ikke lov til å gjøre dette.",
  invalid_status_step: "Statusen kan ikke endres til dette valget.",
  invalid_column_change: "Endringen er ikke tillatt.",
  already_confirmed: "Du har allerede bekreftet denne rapporten.",
  own_report: "Du kan ikke bekrefte din egen rapport.",
  report_not_found: "Fant ikke rapporten.",
  stale_state: "Rapporten er endret. Last siden på nytt og prøv igjen.",
  validation_failed: "Sjekk feltene og prøv igjen.",
  upload_failed: "Kunne ikke laste opp bildet. Prøv igjen.",
  invalid_image:
    "Bildet kan ikke brukes. Velg et JPEG-, PNG- eller WebP-bilde på høyst 5 MB.",
  ai_unavailable: "Fikk ikke et forslag. Velg kategori selv.",
  unknown: "Noe gikk galt. Prøv igjen.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export type ActionError = { code: ErrorCode; message: string };

/** Svaret fra en Server Action. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

/** Feilsvaret for en kode, med den faste norske meldingen. */
export function actionError(code: ErrorCode): { ok: false; error: ActionError } {
  return { ok: false, error: { code, message: ERROR_MESSAGES[code] } };
}

/**
 * Oversetter en feil fra Supabase (PostgREST) til en `ActionError`, bare ut fra
 * SQLSTATE i `code`: `23514` (CHECK) er `validation_failed`, `42501` (RLS eller
 * manglende grant) er `forbidden`, alt annet er `unknown`. `message` leses
 * aldri, så databasetekst når verken brukeren eller loggen.
 */
export function toActionError(
  error: { code?: string | null } | null | undefined,
): ActionError {
  const code: ErrorCode =
    error?.code === "23514"
      ? "validation_failed"
      : error?.code === "42501"
        ? "forbidden"
        : "unknown";
  return { code, message: ERROR_MESSAGES[code] };
}
