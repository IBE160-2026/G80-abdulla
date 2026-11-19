// Bekreftknappen på detaljsiden (Story 3.3, FR-7, UX-DR14): hvilken av de fem
// tilstandene den er i, og teksten for hver. Tilstanden regnes bare ut her, så
// knappen, testene og beskrivelsen i EXPERIENCE.md bruker samme rekkefølge. Her
// ligger også avbildningen fra svaret til Server Action-en til det knappen viser
// (`confirmOutcome`), så den kan enhetstestes uten å rendre komponenten.

import { ERROR_MESSAGES } from "@/lib/errors";

export type ConfirmState = "visitor" | "hidden" | "own" | "confirmed" | "open";

export const CONFIRM_LABELS: Record<ConfirmState, string> = {
  visitor: "Jeg har også sett dette",
  open: "Jeg har også sett dette",
  hidden: "Skjult rapport",
  own: "Din rapport",
  confirmed: "Du har sett dette ✓",
};

/**
 * Tilstanden i denne rekkefølgen: en besøkende (aktiv knapp som sender til
 * innlogging), en skjult rapport (bare moderatoren ser den), brukerens egen
 * rapport, en rapport brukeren allerede har bekreftet, ellers åpen. De tre
 * midterste er deaktiverte. Verdiene kommer fra `hidden`, `authored_by_me` og
 * `confirmed_by_me` i visningen og fra innloggingen.
 */
export function confirmState(input: {
  isSignedIn: boolean;
  hidden: boolean;
  authoredByMe: boolean;
  confirmedByMe: boolean;
}): ConfirmState {
  if (!input.isSignedIn) return "visitor";
  if (input.hidden) return "hidden";
  if (input.authoredByMe) return "own";
  if (input.confirmedByMe) return "confirmed";
  return "open";
}

/** Bare «visitor» og «open» kan trykkes. De andre er deaktiverte. */
export function isConfirmDisabled(state: ConfirmState): boolean {
  return state !== "visitor" && state !== "open";
}

/** Tallene og tilstanden komponenten viser: «N har sett dette» og om brukeren har bekreftet. */
export type ConfirmView = { seen: number; confirmed: boolean };

/** Svaret fra `confirmReport`, slik komponenten får det. */
export type ConfirmResult =
  | { ok: true; data: { seen_count: number; confirmed_by_me: boolean } }
  | { ok: false; error: { code: string; message: string } };

/** Optimistisk visning ved trykk: telleren går opp med én og knappen er bekreftet. */
export function optimisticConfirm(base: ConfirmView): ConfirmView {
  return { seen: base.seen + 1, confirmed: true };
}

/**
 * Hva som vises når svaret kommer. `base` er det serveren sist har sagt (siste
 * props), ikke det som gjaldt ved trykket. Suksess gir serverens `seen_count`.
 * `already_confirmed` gir «Du har sett dette ✓» uten toast. Alle andre feil
 * setter visningen tilbake til `base` og gir meldingen fra `lib/errors.ts`.
 */
export function confirmOutcome(
  result: ConfirmResult,
  base: ConfirmView,
): { view: ConfirmView; toast: string | null } {
  if (result.ok) {
    return {
      view: { seen: result.data.seen_count, confirmed: result.data.confirmed_by_me },
      toast: null,
    };
  }
  if (result.error.code === "already_confirmed") {
    return { view: { seen: base.seen, confirmed: true }, toast: null };
  }
  return { view: base, toast: result.error.message };
}

/** Kallet kastet (nettverksfeil): tilbake til `base` og den generelle feilmeldingen. */
export function confirmThrown(base: ConfirmView): { view: ConfirmView; toast: string } {
  return { view: base, toast: ERROR_MESSAGES.unknown };
}
