import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";
import { charCount, DESCRIPTION_MAX, LOCATION_MAX } from "./limits";
import type { ReportCategory } from "./supabase/types";

// Den ene definisjonen av valideringen av en ny rapport (Story 2.2). Skjemaet
// og Server Action `createReport` bruker begge `parseReportInput`, så de gir
// de samme norske feilmeldingene. Databasen er den egentlige kontrollen
// (AD-1): CHECK-reglene i datamodellen har de samme grensene.

/** Kategoriene i visningsrekkefølgen (rekkefølgen i enumen). */
export const REPORT_CATEGORIES: readonly ReportCategory[] =
  Constants.public.Enums.report_category;

/** Feltene i skjemaet, i rekkefølgen de står. Den første feilen får fokus. */
export const REPORT_FIELDS = ["description", "category", "location"] as const;
export type ReportField = (typeof REPORT_FIELDS)[number];

export const REPORT_MESSAGES = {
  descriptionRequired: "Skriv inn en beskrivelse.",
  descriptionTooLong: `Beskrivelsen kan ha høyst ${DESCRIPTION_MAX} tegn.`,
  locationRequired: "Skriv inn et sted.",
  locationTooLong: `Stedet kan ha høyst ${LOCATION_MAX} tegn.`,
  categoryRequired: "Velg en kategori.",
} as const;

/**
 * Grensene gjelder trimmet tekst og telles med `charCount` (kodepunkter), som
 * `char_length` i CHECK-uttrykkene. Bare mellomrom er tom tekst.
 */
const reportInputSchema = z.object({
  description: z
    .string({ error: REPORT_MESSAGES.descriptionRequired })
    .trim()
    .min(1, { error: REPORT_MESSAGES.descriptionRequired })
    .refine((s) => charCount(s) <= DESCRIPTION_MAX, {
      error: REPORT_MESSAGES.descriptionTooLong,
    }),
  category: z.enum(REPORT_CATEGORIES as [ReportCategory, ...ReportCategory[]], {
    error: REPORT_MESSAGES.categoryRequired,
  }),
  location: z
    .string({ error: REPORT_MESSAGES.locationRequired })
    .trim()
    .min(1, { error: REPORT_MESSAGES.locationRequired })
    .refine((s) => charCount(s) <= LOCATION_MAX, {
      error: REPORT_MESSAGES.locationTooLong,
    }),
});

/** En gyldig rapport slik den settes inn: trimmet tekst og en kategorikode. */
export type ReportInput = {
  description: string;
  category: ReportCategory;
  location: string;
};

export type ReportFieldErrors = Partial<Record<ReportField, string>>;

export type ReportInputResult =
  | { ok: true; data: ReportInput }
  | { ok: false; errors: ReportFieldErrors };

/**
 * Trimmer og validerer en ny rapport. Felt utenom de tre (for eksempel
 * `author_id` eller `status`) fjernes og sendes aldri videre. Ved feil gir
 * den første feilmeldingen for hvert felt.
 */
export function parseReportInput(raw: unknown): ReportInputResult {
  const input = raw !== null && typeof raw === "object" ? raw : {};
  const result = reportInputSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const errors: ReportFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      (REPORT_FIELDS as readonly string[]).includes(field) &&
      !errors[field as ReportField]
    ) {
      errors[field as ReportField] = issue.message;
    }
  }
  return { ok: false, errors };
}
