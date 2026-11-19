// Tester `lib/confirm-state.ts` (Story 3.3): de fem tilstandene, rekkefølgen
// og teksten på knappen, og hva som vises når svaret fra Server Action-en kommer
// (suksess, `already_confirmed`, andre feil og kast).
import { describe, expect, test } from "vitest";
import { ERROR_MESSAGES } from "./errors";
import {
  CONFIRM_LABELS,
  confirmOutcome,
  confirmState,
  confirmThrown,
  isConfirmDisabled,
  optimisticConfirm,
  type ConfirmResult,
} from "./confirm-state";

const OPEN = { isSignedIn: true, hidden: false, authoredByMe: false, confirmedByMe: false };

describe("confirmState", () => {
  test("en innlogget bruker på en annens rapport er åpen", () => {
    expect(confirmState(OPEN)).toBe("open");
  });

  test("en besøkende er «visitor», uansett resten", () => {
    expect(confirmState({ ...OPEN, isSignedIn: false })).toBe("visitor");
    expect(
      confirmState({ isSignedIn: false, hidden: true, authoredByMe: true, confirmedByMe: true }),
    ).toBe("visitor");
  });

  test("en skjult rapport (bare moderatoren ser den) er «hidden»", () => {
    expect(confirmState({ ...OPEN, hidden: true })).toBe("hidden");
  });

  test("egen rapport er «own», og allerede bekreftet er «confirmed»", () => {
    expect(confirmState({ ...OPEN, authoredByMe: true })).toBe("own");
    expect(confirmState({ ...OPEN, confirmedByMe: true })).toBe("confirmed");
  });

  test("rekkefølgen er skjult, så egen, så bekreftet", () => {
    const all = { ...OPEN, hidden: true, authoredByMe: true, confirmedByMe: true };
    expect(confirmState(all)).toBe("hidden");
    expect(confirmState({ ...all, hidden: false })).toBe("own");
    expect(confirmState({ ...all, hidden: false, authoredByMe: false })).toBe("confirmed");
  });
});

describe("teksten og deaktiveringen", () => {
  test("teksten for hver tilstand", () => {
    expect(CONFIRM_LABELS).toEqual({
      visitor: "Jeg har også sett dette",
      open: "Jeg har også sett dette",
      hidden: "Skjult rapport",
      own: "Din rapport",
      confirmed: "Du har sett dette ✓",
    });
  });

  test("bare «visitor» og «open» kan trykkes", () => {
    expect(isConfirmDisabled("visitor")).toBe(false);
    expect(isConfirmDisabled("open")).toBe(false);
    expect(isConfirmDisabled("hidden")).toBe(true);
    expect(isConfirmDisabled("own")).toBe(true);
    expect(isConfirmDisabled("confirmed")).toBe(true);
  });

  test("ingen tekst har utropstegn", () => {
    for (const label of Object.values(CONFIRM_LABELS)) expect(label).not.toContain("!");
  });
});

describe("confirmOutcome", () => {
  const base = { seen: 3, confirmed: false };
  const failure = (code: keyof typeof ERROR_MESSAGES): ConfirmResult => ({
    ok: false,
    error: { code, message: ERROR_MESSAGES[code] },
  });

  test("trykket gir telleren +1 og en bekreftet knapp med en gang", () => {
    expect(optimisticConfirm(base)).toEqual({ seen: 4, confirmed: true });
    expect(base).toEqual({ seen: 3, confirmed: false });
  });

  test("suksess viser serverens tall, ikke det optimistiske, og ingen toast", () => {
    const result: ConfirmResult = { ok: true, data: { seen_count: 7, confirmed_by_me: true } };
    expect(confirmOutcome(result, base)).toEqual({ view: { seen: 7, confirmed: true }, toast: null });
  });

  test("already_confirmed gir «Du har sett dette ✓» uten toast, og beholder serverens tall", () => {
    expect(confirmOutcome(failure("already_confirmed"), { seen: 5, confirmed: false })).toEqual({
      view: { seen: 5, confirmed: true },
      toast: null,
    });
  });

  test.each(["own_report", "forbidden", "report_not_found", "validation_failed", "unknown"] as const)(
    "%s setter telleren og knappen tilbake og gir meldingen fra lib/errors.ts",
    (code) => {
      expect(confirmOutcome(failure(code), base)).toEqual({
        view: base,
        toast: ERROR_MESSAGES[code],
      });
    },
  );

  test("en feil tilbake bruker det serveren sist sa (base), ikke det som gjaldt ved trykket", () => {
    const fresh = { seen: 9, confirmed: true };
    expect(confirmOutcome(failure("unknown"), fresh).view).toEqual(fresh);
    expect(confirmOutcome(failure("already_confirmed"), fresh).view).toEqual(fresh);
  });

  test("et kast gir den generelle feilmeldingen og tilbake til base", () => {
    expect(confirmThrown(base)).toEqual({ view: base, toast: "Noe gikk galt. Prøv igjen." });
  });

  test("ingen melding har utropstegn", () => {
    for (const code of ["own_report", "forbidden", "report_not_found", "validation_failed", "unknown"] as const) {
      expect(ERROR_MESSAGES[code]).not.toContain("!");
    }
  });
});
