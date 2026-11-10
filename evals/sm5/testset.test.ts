// Formen på SM-5-testsettet (Story 2.5, AR-15): 20 oppføringer, fire per
// kategori, gyldige koder, unike id-er og trimmet tekst på 1–1000 tegn. Testen
// viser også at sjekken slår ut på hver feiltype.
import { describe, expect, test } from "vitest";
import { SM5_TESTSET, type SM5Case } from "./testset";
import { testsetProblems } from "./testset-check";

const base = [...SM5_TESTSET];

function withChange(index: number, change: Partial<SM5Case>): SM5Case[] {
  return base.map((c, i) => (i === index ? { ...c, ...change } : c));
}

describe("SM5_TESTSET", () => {
  test("er i orden", () => {
    expect(testsetProblems(SM5_TESTSET)).toEqual([]);
  });

  test("har blandet lengde, og minst to tvetydige tilfeller med begrunnelse", () => {
    const lengths = SM5_TESTSET.map((c) => [...c.description].length);
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeGreaterThan(40);
    expect(SM5_TESTSET.filter((c) => c.note && c.note.length > 0).length).toBeGreaterThanOrEqual(2);
  });
});

describe("testsetProblems", () => {
  test("19 oppføringer", () => {
    expect(testsetProblems(base.slice(1)).join("\n")).toMatch(/19 oppføringer/);
  });

  test("tre i en kategori (og fem i en annen)", () => {
    const problems = testsetProblems(withChange(0, { expected: "other" })).join("\n");
    expect(problems).toMatch(/waste: 3 oppføringer/);
    expect(problems).toMatch(/other: 5 oppføringer/);
  });

  test("ugyldig kode", () => {
    expect(testsetProblems(withChange(0, { expected: "Belysning" as never })).join("\n")).toMatch(/ugyldig kategorikode/);
  });

  test("tom tekst, bare mellomrom og ikke-trimmet tekst", () => {
    expect(testsetProblems(withChange(0, { description: "" })).join("\n")).toMatch(/tom tekst/);
    expect(testsetProblems(withChange(0, { description: "   " })).join("\n")).toMatch(/ikke trimmet/);
    expect(testsetProblems(withChange(0, { description: " Hull" })).join("\n")).toMatch(/ikke trimmet/);
  });

  test("grensen 1000 tegn, også med emoji", () => {
    expect(testsetProblems(withChange(0, { description: "a".repeat(1000) }))).toEqual([]);
    expect(testsetProblems(withChange(0, { description: "😀".repeat(1000) }))).toEqual([]);
    expect(testsetProblems(withChange(0, { description: "a".repeat(1001) })).join("\n")).toMatch(/over 1000 tegn/);
    expect(testsetProblems(withChange(0, { description: "😀".repeat(1001) })).join("\n")).toMatch(/over 1000 tegn/);
  });

  test("id brukt to ganger", () => {
    expect(testsetProblems(withChange(1, { id: base[0].id })).join("\n")).toMatch(/id brukt flere ganger/);
  });
});
