import type { SuggestStatus } from "@/features/registrering/ai";
import { AI_TIMEOUT_MS } from "@/features/registrering/ai/timeout";
import type { ReportCategory } from "@/shared/supabase/types";
import { isSuspect } from "./language";

// Poengsum og avgjørelse for SM-5 (Story 2.5, PRD §11). Ren logikk uten
// nettverk, så grenseverdiene kan testes.

/** Minst så mange riktige kategorier av 20 kreves av vinneren. */
export const MIN_HITS = 16;
/** Hvert svar må komme under så mange millisekunder (FR-4). */
export const MAX_MS = AI_TIMEOUT_MS;

export type CaseResult = {
  id: string;
  expected: ReportCategory;
  answer: ReportCategory | null;
  summary: string | null;
  status: SuggestStatus;
  code?: string;
  ms: number;
};

export type Summary = {
  total: number;
  hits: number;
  /** Svar som appen godtar (`status: "ok"`), uansett om kategorien er riktig. */
  valid: number;
  maxMs: number;
  meanMs: number;
  /** Svar som kom etter 5000 ms eller ikke kom (tidsavbrudd). */
  slow: number;
  /** Oppsummeringer med ord som peker mot nynorsk eller dansk. */
  suspectLanguage: number;
  /** Gyldige svar uten oppsummering: språket kan ikke sjekkes for dem. */
  noSummary: number;
  /** Kall leverandøren avviste med 401 eller 403: nøkkelen eller tillatelsen er feil, så kjøringen måler ikke modellen. */
  authRejected: number;
};

export function summarize(results: readonly CaseResult[]): Summary {
  const total = results.length;
  const sum = results.reduce((acc, r) => acc + r.ms, 0);
  return {
    total,
    hits: results.filter((r) => r.status === "ok" && r.answer === r.expected).length,
    valid: results.filter((r) => r.status === "ok").length,
    maxMs: results.reduce((max, r) => Math.max(max, r.ms), 0),
    meanMs: total === 0 ? 0 : Math.round(sum / total),
    slow: results.filter((r) => r.status === "timeout" || r.ms >= MAX_MS).length,
    suspectLanguage: results.filter((r) => r.summary !== null && isSuspect(r.summary)).length,
    noSummary: results.filter((r) => r.status === "ok" && r.summary === null).length,
    authRejected: results.filter((r) => r.status === "error" && (r.code === "http_401" || r.code === "http_403")).length,
  };
}

export type Decision = {
  hitsOk: boolean;
  validOk: boolean;
  speedOk: boolean;
  /** Treff, gyldighet og svartid er oppfylt. Språket må leses av et menneske. */
  measurablePass: boolean;
  verdict: string;
};

/**
 * Avgjørelsen mot kravene. «Bestått» kan aldri sies før oppsummeringene er
 * lest: er målingene i orden, gjenstår lesingen, og med mistenkte ord må de
 * sjekkes først.
 */
export function decide(summary: Summary): Decision {
  const hitsOk = summary.hits >= MIN_HITS;
  const validOk = summary.total > 0 && summary.valid === summary.total;
  const speedOk = summary.total > 0 && summary.slow === 0;
  const measurablePass = hitsOk && validOk && speedOk;

  let verdict: string;
  if (summary.authRejected > 0) {
    // 401 og 403 sier noe om nøkkelen eller tillatelsen, ikke om modellen: ikke la det se ut som at leverandøren strøk.
    verdict = `kjøringen er ugyldig, ikke målt: leverandøren avviste nøkkelen (http_401 eller http_403) i ${summary.authRejected} av ${summary.total} kall. Rett nøkkelen eller tillatelsen og kjør på nytt`;
  } else if (!measurablePass) {
    verdict = "ikke bestått";
  } else if (summary.suspectLanguage > 0) {
    verdict = `målingene er bestått, men ${summary.suspectLanguage} oppsummering(er) har mistenkte ord: les dem før valget`;
  } else if (summary.noSummary > 0) {
    verdict = `målingene er bestått, men ${summary.noSummary} svar mangler oppsummering, så språket kan ikke sjekkes for dem`;
  } else {
    verdict = "målingene er bestått: les oppsummeringene og bekreft at de er norsk bokmål";
  }
  return { hitsOk, validOk, speedOk, measurablePass, verdict };
}
