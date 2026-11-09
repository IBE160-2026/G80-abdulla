import { z } from "zod";

const reportIdSchema = z.uuid();

/**
 * Validerer en rapport-id fra URL-en eller et skjema før den brukes mot
 * databasen (arkitekturen, «Formater og feil»). Gir id-en med små bokstaver,
 * eller `null` når den ikke er en uuid. Da skal kalleren gi `notFound()` uten
 * databasekall. Server Actions i Story 3.3 bruker den også.
 */
export function parseReportId(value: string): string | null {
  const result = reportIdSchema.safeParse(value);
  return result.success ? result.data.toLowerCase() : null;
}
