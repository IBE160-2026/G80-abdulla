import { serverEnv } from "@/lib/env";
import { mockSuggest } from "./mock";
import { AiError, openaiSuggest } from "./openai";
import { AI_TIMEOUT_MS } from "./timeout";
import { clipInput, parseSuggestion, type Suggestion } from "./validate";

// Eneste inngang til KI-forslag (Story 2.3, AD-8, AR-9). Appen (via Server
// Action `suggestReport`) kaller `suggest`, og SM-5-skriptet (`evals/sm5/`) kaller
// `suggestWithOutcome`, som i tillegg sier hvorfor og hvor lenge. Adapteren
// velges av AI_PROVIDER. Ugyldig svar, feil og tidsavbrudd gir `null`, så KI-en
// aldri stopper en innsending. Rapporttekst, forslag og nøkkel logges aldri,
// bare handlingen og en feilkode.

export type { Suggestion } from "./validate";

export { AI_TIMEOUT_MS };

/** Hvordan et kall endte. `none` er et gyldig «ingen forslag» (mock-testordet). */
export type SuggestStatus = "ok" | "none" | "timeout" | "invalid" | "error";

/** Svaret fra `suggestWithOutcome`: forslaget, hvordan det gikk, og svartiden. */
export type SuggestOutcome = {
  suggestion: Suggestion | null;
  status: SuggestStatus;
  /** Kort feilkode (ingen tekst fra svaret eller rapporten), bare ved timeout, invalid og error. */
  code?: string;
  /** Tid fra kallet startet til svaret kom (eller tidsavbruddet), i millisekunder. */
  ms: number;
};

/**
 * Som `suggest`, men sier også hvorfor det ikke ble noe forslag, og hvor lang
 * tid kallet tok. SM-5-skriptet (`evals/sm5/`) bruker den. Samme adapter,
 * validering, tidsavbrudd og logging som `suggest`.
 */
export async function suggestWithOutcome(description: string): Promise<SuggestOutcome> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve("timeout");
    }, AI_TIMEOUT_MS);
  });

  try {
    const text = clipInput(String(description));
    const env = serverEnv();
    const call =
      env.AI_PROVIDER === "openai"
        ? openaiSuggest(
            text,
            { baseUrl: env.AI_BASE_URL, model: env.AI_MODEL, apiKey: env.AI_API_KEY },
            controller.signal,
          )
        : Promise.resolve(mockSuggest(text));
    // Etter et tidsavbrudd skal et sent svar eller en sen feil ikke bli uhåndtert.
    call.catch(() => {});

    const result = await Promise.race([call, timeout]);
    if (result === "timeout") {
      console.error("suggest", "timeout");
      return { suggestion: null, status: "timeout", code: "timeout", ms: elapsed() };
    }
    const suggestion = parseSuggestion(result);
    return suggestion
      ? { suggestion, status: "ok", ms: elapsed() }
      : { suggestion: null, status: "none", ms: elapsed() };
  } catch (error) {
    const code = error instanceof AiError ? error.code : "feil";
    console.error("suggest", code);
    return {
      suggestion: null,
      status: code === "ugyldig_svar" ? "invalid" : "error",
      code,
      ms: elapsed(),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Foreslår kategori og oppsummering for en beskrivelse, eller `null` når det
 * ikke finnes et brukbart forslag. Høyst 2000 tegn av beskrivelsen sendes videre.
 */
export async function suggest(description: string): Promise<Suggestion | null> {
  return (await suggestWithOutcome(description)).suggestion;
}
