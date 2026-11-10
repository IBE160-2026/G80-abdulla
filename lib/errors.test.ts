// Tester feilvokabularet (AD-1, Story 2.2): hele det lukkede settet med norske
// meldinger og oversettingen av SQLSTATE. Tekst fra databasen leses aldri.
import { describe, expect, test } from "vitest";
import { actionError, ERROR_MESSAGES, toActionError } from "./errors";

describe("ERROR_MESSAGES", () => {
  test("er det lukkede vokabularet fra arkitekturen", () => {
    expect(Object.keys(ERROR_MESSAGES).sort()).toEqual(
      [
        "unauthenticated",
        "forbidden",
        "invalid_status_step",
        "invalid_column_change",
        "already_confirmed",
        "own_report",
        "report_not_found",
        "stale_state",
        "validation_failed",
        "upload_failed",
        "invalid_image",
        "ai_unavailable",
        "unknown",
      ].sort(),
    );
  });

  test("alle meldingene er norske setninger uten utropstegn", () => {
    for (const message of Object.values(ERROR_MESSAGES)) {
      expect(message).toMatch(/\.$/);
      expect(message).not.toContain("!");
    }
  });
});

describe("toActionError", () => {
  test("23514 (CHECK) gir validation_failed", () => {
    expect(toActionError({ code: "23514" })).toEqual({
      code: "validation_failed",
      message: ERROR_MESSAGES.validation_failed,
    });
  });

  test("42501 (RLS eller grant) gir forbidden", () => {
    expect(toActionError({ code: "42501" })).toEqual({
      code: "forbidden",
      message: ERROR_MESSAGES.forbidden,
    });
  });

  test.each([{ code: "23505" }, { code: "" }, { code: null }, {}, null, undefined])(
    "ellers unknown: %j",
    (error) => {
      expect(toActionError(error)).toEqual({ code: "unknown", message: ERROR_MESSAGES.unknown });
    },
  );

  test("tekst fra databasen leses aldri", () => {
    const result = toActionError({
      code: "42501",
      message: 'new row violates row-level security policy for table "reports"',
    } as { code: string });
    expect(JSON.stringify(result)).not.toMatch(/row-level|reports/);
  });
});

describe("actionError", () => {
  test("gir feilsvaret med den faste meldingen", () => {
    expect(actionError("validation_failed")).toEqual({
      ok: false,
      error: { code: "validation_failed", message: ERROR_MESSAGES.validation_failed },
    });
  });
});
