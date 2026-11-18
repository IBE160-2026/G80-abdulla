import type { SuggestOutcome } from "@/lib/ai";
import type { ServerEnv } from "@/lib/env";
import type { RunInfo } from "./report";
import type { CaseResult } from "./score";
import type { SM5Case } from "./testset";

// Små hjelpere for `run.eval.ts` (Story 2.5), flyttet ut så de kan testes uten
// å sende noe til en leverandør.

/** Pause mellom kallene mot en leverandør, så gratisgrenser (for eksempel ett kall i sekundet) ikke gir 429. Måles ikke i svartiden. */
export const PROVIDER_PAUSE_MS = 2000;

/** Gjør svaret fra `suggestWithOutcome` om til en rad i resultatet. */
export function toCaseResult(testCase: SM5Case, outcome: SuggestOutcome): CaseResult {
  return {
    id: testCase.id,
    expected: testCase.expected,
    answer: outcome.suggestion?.category ?? null,
    summary: outcome.suggestion?.summary ?? null,
    status: outcome.status,
    code: outcome.code,
    ms: outcome.ms,
  };
}

/** Hva utskriften skal si om kjøringen. Nøkkelen tas aldri med. */
export function runInfoFrom(env: ServerEnv): RunInfo {
  return env.AI_PROVIDER === "openai"
    ? { provider: "openai", baseUrl: env.AI_BASE_URL, model: env.AI_MODEL }
    : { provider: "mock" };
}

/** Pausen før neste kall: ingen mot mock. */
export function pauseMs(info: RunInfo): number {
  return info.provider === "mock" ? 0 : PROVIDER_PAUSE_MS;
}

/**
 * Kjøres med `--mode <leverandør>`, men fila ga mock (for eksempel fordi
 * `AI_PROVIDER=openai` mangler i `.env.<leverandør>`)? Da måler kjøringen noe
 * annet enn det som ble bedt om, så den stopper. Standardmodusen `test` er
 * kjøringen uten `--mode`.
 */
export function assertModeMatchesProvider(mode: string, info: RunInfo): void {
  if (mode !== "test" && info.provider === "mock") {
    throw new Error(
      `Modus «${mode}», men AI_PROVIDER er mock. Sjekk at .env.${mode} har AI_PROVIDER=openai, AI_BASE_URL, AI_MODEL og AI_API_KEY.`,
    );
  }
}
