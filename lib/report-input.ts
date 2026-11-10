import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";
import { charCount, DESCRIPTION_MAX, LOCATION_MAX, SUMMARY_MAX } from "./limits";
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
  summaryTooLong: `Oppsummeringen kan ha høyst ${SUMMARY_MAX} tegn.`,
} as const;

/**
 * Oppsummeringen er valgfri (Story 2.3): tekst som ikke er en streng, eller som
 * er tom etter trimming, utelates og lagres som NULL. Mer enn `SUMMARY_MAX`
 * tegn (kodepunkter) er en feil, som `char_length` i CHECK-uttrykket.
 */
const summarySchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z
    .string()
    .refine((s) => charCount(s) <= SUMMARY_MAX, {
      error: REPORT_MESSAGES.summaryTooLong,
    })
    .optional(),
);

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
  summary: summarySchema,
});

/**
 * En gyldig rapport slik den settes inn: trimmet tekst og en kategorikode.
 * `summary` er med bare når den har innhold.
 */
export type ReportInput = {
  description: string;
  category: ReportCategory;
  location: string;
  summary?: string;
};

export type ReportFieldErrors = Partial<Record<ReportField | "summary", string>>;

export type ReportInputResult =
  | { ok: true; data: ReportInput }
  | { ok: false; errors: ReportFieldErrors };

/**
 * Trimmer og validerer en ny rapport. Felt utenom de tre og den valgfrie
 * oppsummeringen (for eksempel `author_id` eller `status`) fjernes og sendes
 * aldri videre. Ved feil gir
 * den første feilmeldingen for hvert felt.
 */
export function parseReportInput(raw: unknown): ReportInputResult {
  const input = raw !== null && typeof raw === "object" ? raw : {};
  const result = reportInputSchema.safeParse(input);
  if (result.success) {
    const { summary, ...required } = result.data;
    return { ok: true, data: summary === undefined ? required : { ...required, summary } };
  }

  const errors: ReportFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      ([...REPORT_FIELDS, "summary"] as string[]).includes(field) &&
      !errors[field as ReportField | "summary"]
    ) {
      errors[field as ReportField | "summary"] = issue.message;
    }
  }
  return { ok: false, errors };
}
