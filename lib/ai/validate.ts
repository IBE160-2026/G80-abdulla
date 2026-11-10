import { Constants } from "@/lib/supabase/database.types";
import { charCount, SUMMARY_MAX } from "@/lib/limits";
import type { ReportCategory } from "@/lib/supabase/types";

// Valideringen av svaret fra KI-en (Story 2.3, AD-8). Alle adaptere går
// gjennom `parseSuggestion`, så appen aldri får en kategori utenom de fem
// kodeverdiene eller en oppsummering med HTML eller over `SUMMARY_MAX` tegn.

/** Et gyldig forslag: en kategorikode og en oppsummering i ren tekst, eller `null`. */
export type Suggestion = { category: ReportCategory; summary: string | null };

/** Høyst så mange tegn (kodepunkter) av beskrivelsen sendes til KI-en. */
export const AI_INPUT_MAX = 2000;

/** Kutter teksten til `AI_INPUT_MAX` tegn, talt som kodepunkter. */
export function clipInput(text: string): string {
  const chars = [...text];
  return chars.length <= AI_INPUT_MAX ? text : chars.slice(0, AI_INPUT_MAX).join("");
}

const CATEGORY_CODES: readonly string[] = Constants.public.Enums.report_category;

const FENCE = /^```[a-zA-Z0-9]*\s*\r?\n?([\s\S]*?)\r?\n?\s*```$/;

/** Fjerner en omsluttende kodeblokk (```json … ```), hvis teksten har en. */
function unfence(text: string): string {
  const trimmed = text.trim();
  const match = FENCE.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

/**
 * Oppsummeringen som ren tekst: HTML-tagger fjernes, mellomrom trimmes, og
 * teksten kortes til `SUMMARY_MAX` tegn (kodepunkter). Tom blir `null`. Bare
 * tagger som starter med en bokstav, `/` eller `!` fjernes, også en tagg som
 * ikke er lukket (til slutten av teksten). «skilt < 30 og > 50» er vanlig tekst.
 */
function cleanSummary(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/<\/?[a-zA-Z!][^>]*(?:>|$)/g, "").trim();
  if (text === "") return null;
  return charCount(text) <= SUMMARY_MAX ? text : [...text].slice(0, SUMMARY_MAX).join("");
}

/**
 * Gjør svaret fra KI-en om til et `Suggestion`, eller `null` når det er
 * ugyldig. `raw` er teksten fra modellen (JSON, eventuelt i en kodeblokk) eller
 * et allerede tolket objekt. Kategorien må være nøyaktig en kodeverdi: feil
 * store og små bokstaver, mellomrom og norske navn som «Belysning» gir `null`.
 * En gyldig kategori uten brukbar oppsummering gir `summary: null`.
 */
export function parseSuggestion(raw: unknown): Suggestion | null {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(unfence(raw));
    } catch {
      return null;
    }
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;

  const { category, summary } = value as Record<string, unknown>;
  if (typeof category !== "string" || !CATEGORY_CODES.includes(category)) return null;

  return { category: category as ReportCategory, summary: cleanSummary(summary) };
}
