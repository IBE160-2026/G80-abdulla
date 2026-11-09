// Tester relativ tid og flertall (Story 1.4). Alle grensene i beslutningen
// om relativ tid, med entall og flertall, og et tidspunkt fram i tid.
import { describe, expect, test } from "vitest";
import { formatRelativeTime, formatReportCount } from "./format";

const NOW = new Date("2026-11-09T12:00:00Z");
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Tidspunktet `ms` millisekunder før NOW, som ISO-streng. */
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

describe("formatRelativeTime", () => {
  test.each([
    // Fram i tid og under ett minutt
    ["30 s fram i tid", -30 * SECOND, "nå"],
    ["ett døgn fram i tid", -DAY, "nå"],
    ["akkurat nå", 0, "nå"],
    ["59 s", 59 * SECOND, "nå"],
    ["59,999 s", MINUTE - 1, "nå"],
    // Minutter
    ["60 s", MINUTE, "1 minutt siden"],
    ["61 s", 61 * SECOND, "1 minutt siden"],
    ["2 min", 2 * MINUTE, "2 minutter siden"],
    ["59 min 59 s", HOUR - SECOND, "59 minutter siden"],
    // Timer
    ["60 min", HOUR, "1 time siden"],
    ["2 t", 2 * HOUR, "2 timer siden"],
    ["23 t 59 min", DAY - MINUTE, "23 timer siden"],
    // Dager
    ["24 t", DAY, "1 dag siden"],
    ["2 døgn", 2 * DAY, "2 dager siden"],
    ["6 døgn 23 t", 6 * DAY + 23 * HOUR, "6 dager siden"],
    // Uker
    ["7 døgn", 7 * DAY, "1 uke siden"],
    ["13 døgn", 13 * DAY, "1 uke siden"],
    ["14 døgn", 14 * DAY, "2 uker siden"],
    ["29 døgn", 29 * DAY, "4 uker siden"],
    // Måneder (30 døgn)
    ["30 døgn", 30 * DAY, "1 måned siden"],
    ["60 døgn", 60 * DAY, "2 måneder siden"],
    ["364 døgn", 364 * DAY, "12 måneder siden"],
    // År (365 døgn)
    ["365 døgn", 365 * DAY, "1 år siden"],
    ["729 døgn", 729 * DAY, "1 år siden"],
    ["730 døgn", 730 * DAY, "2 år siden"],
  ])("%s (%i ms)", (_name, elapsed, expected) => {
    expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected);
  });

  test("leser ISO-strenger med tidssone slik Supabase sender dem", () => {
    expect(formatRelativeTime("2026-11-09T11:58:00+00:00", NOW)).toBe(
      "2 minutter siden",
    );
  });

  test("et ugyldig tidspunkt gir «nå», ikke NaN", () => {
    expect(formatRelativeTime("ikke en dato", NOW)).toBe("nå");
  });
});

describe("formatReportCount", () => {
  test.each([
    [0, "0 rapporter"],
    [1, "1 rapport"],
    [2, "2 rapporter"],
    [500, "500 rapporter"],
  ])("%i gir «%s»", (count, expected) => {
    expect(formatReportCount(count)).toBe(expected);
  });
});
