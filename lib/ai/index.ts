import { serverEnv } from "@/lib/env";
import { mockSuggest } from "./mock";
import { AiError, openaiSuggest } from "./openai";
import { clipInput, parseSuggestion, type Suggestion } from "./validate";

// Eneste inngang til KI-forslag (Story 2.3, AD-8, AR-9). Appen (via Server
// Action `suggestReport`) og senere SM-5-skriptet kaller `suggest`. Adapteren
// velges av AI_PROVIDER. Ugyldig svar, feil og tidsavbrudd gir `null`, så KI-en
// aldri stopper en innsending. Rapporttekst, forslag og nøkkel logges aldri,
// bare handlingen og en feilkode.

export type { Suggestion } from "./validate";

/** Hele kallet, fra start til svar, har så lang tid på seg. */
export const AI_TIMEOUT_MS = 5000;

/**
 * Foreslår kategori og oppsummering for en beskrivelse, eller `null` når det
 * ikke finnes et brukbart forslag. Høyst 2000 tegn av beskrivelsen sendes videre.
 */
export async function suggest(description: string): Promise<Suggestion | null> {
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
      return null;
    }
    return parseSuggestion(result);
  } catch (error) {
    console.error("suggest", error instanceof AiError ? error.code : "feil");
    return null;
  } finally {
    clearTimeout(timer);
  }
}
