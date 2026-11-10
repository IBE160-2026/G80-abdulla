import { languageHint } from "./language";
import { decide, MAX_MS, MIN_HITS, summarize, type CaseResult } from "./score";

// Utskriften fra SM-5-kjøringen (Story 2.5). Viser aldri nøkkelen og ikke
// beskrivelsene som ble sendt, bare fasit, svar, status, tid og oppsummeringen
// (som må leses for å sjekke språket). Av adressen vises bare verten, siden
// stien kan ha en konto-id.

export const MOCK_WARNING = "Mock-modus: resultatet sier ikke noe om kvalitet.";

export type RunInfo =
  | { provider: "mock" }
  | { provider: "openai"; baseUrl: string; model: string };

/** Verten i en adresse, eller «ukjent» hvis den ikke lar seg lese. */
export function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return "ukjent";
  }
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function line(result: CaseResult): string {
  const correct = result.status === "ok" && result.answer === result.expected;
  const parts = [
    pad(result.id, 7),
    `fasit=${pad(result.expected, 15)}`,
    `svar=${pad(result.answer ?? "-", 15)}`,
    pad(correct ? "riktig" : "feil", 7),
    pad(result.code ? `${result.status}:${result.code}` : result.status, 16),
    `${String(result.ms).padStart(5)} ms`,
  ];
  let text = parts.join("  ");
  if (result.summary !== null) {
    const hint = languageHint(result.summary);
    const words = [...hint.nynorsk, ...hint.dansk];
    const flag = words.length > 0 ? ` [mistenkt språk: ${words.join(", ")}]` : "";
    // Styretegn (linjeskift, ESC) fra en modell skal ikke bryte oppsettet.
    const safe = result.summary.replace(/[\u0000-\u001f\u007f]+/g, " ");
    text += `\n         oppsummering: ${safe}${flag}`;
  }
  return text;
}

/** Hele utskriften for en kjøring, som tekstlinjer. */
export function formatReport(info: RunInfo, results: readonly CaseResult[]): string[] {
  const summary = summarize(results);
  const decision = decide(summary);
  const lines: string[] = [];

  if (info.provider === "mock") lines.push(MOCK_WARNING, "");
  lines.push(
    info.provider === "mock"
      ? "SM-5: leverandør mock (ingen nettverkskall)"
      : `SM-5: leverandør ${hostOf(info.baseUrl)}, modell ${info.model}`,
    `Bare testsettets ${summary.total} tekster sendes. Svaret må komme under ${MAX_MS} ms.`,
    "",
    ...results.map(line),
    "",
    `Riktige kategorier: ${summary.hits} av ${summary.total} (krav: minst ${MIN_HITS})  ${decision.hitsOk ? "ok" : "IKKE OK"}`,
    `Gyldige svar:       ${summary.valid} av ${summary.total} (krav: alle)  ${decision.validOk ? "ok" : "IKKE OK"}`,
    `Svartid:            størst ${summary.maxMs} ms, middels ${summary.meanMs} ms, ${summary.slow} på ${MAX_MS} ms eller mer (krav: ingen)  ${decision.speedOk ? "ok" : "IKKE OK"}`,
    `Språk:              ${summary.suspectLanguage} oppsummering(er) med mistenkte ord (nynorsk eller dansk), ${summary.noSummary} uten oppsummering. Les alle oppsummeringene.`,
    `Avgjørelse:         ${info.provider === "mock" ? "ingen: mock sier ikke noe om hvilken leverandør som skal velges" : decision.verdict}`,
  );
  if (info.provider === "mock") lines.push("", MOCK_WARNING);
  return lines;
}
