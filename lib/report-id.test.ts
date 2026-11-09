// Tester parseReportId (Story 1.5): bare uuid-er slipper gjennom, så en
// ugyldig id gir 404 uten databasekall.
import { describe, expect, test } from "vitest";
import { parseReportId } from "./report-id";

const SEED_ID = "20000000-0000-4000-8000-000000000001";

describe("parseReportId", () => {
  test("godtar seed-id-ene", () => {
    expect(parseReportId(SEED_ID)).toBe(SEED_ID);
    expect(parseReportId("20000000-0000-4000-8000-000000000009")).toBe(
      "20000000-0000-4000-8000-000000000009",
    );
  });

  test("godtar store bokstaver og gir id-en med små", () => {
    expect(parseReportId("ABCDEF00-0000-4000-8000-00000000000A")).toBe(
      "abcdef00-0000-4000-8000-00000000000a",
    );
  });

  test.each([
    ["abc", "abc"],
    ["123", "123"],
    ["tom streng", ""],
    ["ett tegn for mye", `${SEED_ID}0`],
    ["ett tegn for lite", SEED_ID.slice(0, -1)],
    ["mellomrom rundt", ` ${SEED_ID} `],
    ["uten bindestreker", SEED_ID.replaceAll("-", "")],
    ["ikke-heksadesimalt tegn", "g0000000-0000-4000-8000-000000000001"],
  ])("avviser %s", (_name, value) => {
    expect(parseReportId(value)).toBeNull();
  });
});
