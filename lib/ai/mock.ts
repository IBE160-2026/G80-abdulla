import type { ReportCategory } from "@/lib/supabase/types";
import type { Suggestion } from "./validate";

// Mock-adapteren (Story 2.3): svarer etter nøkkelord og gjør ingen
// nettverkskall, så appen virker uten nøkkel og ingen tekst forlater maskinen.

/** Testordet som gir «ingen forslag». */
export const MOCK_NO_SUGGESTION_WORD = "ingenforslag";

/**
 * Nøkkelord per kategori i prioritetsrekkefølgen: første kategori med treff
 * vinner. `stems` treffer også bøyde former, `words` bare som eget ord.
 */
const RULES: ReadonlyArray<{
  category: ReportCategory;
  stems: string[];
  words?: string[];
}> = [
  { category: "lighting", stems: ["gatelys", "lys", "belysning"] },
  { category: "waste", stems: ["søppel", "boss"] },
  { category: "vandalism", stems: ["hærverk", "skadeverk", "knust", "tagging"] },
  { category: "roads_sidewalks", stems: ["hull", "vei", "fortau", "asfalt"], words: ["sti"] },
];

const SUMMARY_CHARS = 120;

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, "u").test(text);
}

/**
 * Første setning: opp til første punktum (som er fulgt av mellomrom eller
 * slutten av teksten, så «3.5 meter» ikke kuttes), linjeskift eller 120 tegn,
 * trimmet.
 */
function firstSentence(description: string): string | null {
  const first = description.trim().split(/\.(?=\s|$)|[\r\n]/, 1)[0];
  const text = [...first].slice(0, SUMMARY_CHARS).join("").trim();
  return text === "" ? null : text;
}

/**
 * Kategori etter nøkkelord, uten hensyn til store og små bokstaver. Ordstammene
 * treffer også bøyde former («gatelyset», «hullet»), og «sti» bare som eget ord.
 * Uten treff er kategorien `other`. Testordet gir `null`.
 */
export function mockSuggest(description: string): Suggestion | null {
  const text = description.toLowerCase();
  if (text.includes(MOCK_NO_SUGGESTION_WORD)) return null;

  const rule = RULES.find(
    ({ stems, words = [] }) =>
      stems.some((stem) => text.includes(stem)) || words.some((word) => hasWord(text, word)),
  );
  return { category: rule?.category ?? "other", summary: firstSentence(description) };
}
