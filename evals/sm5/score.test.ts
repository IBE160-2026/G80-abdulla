// Poengsum og avgjørelse for SM-5 (Story 2.5): grenseverdiene 15/16 riktige og
// 4999/5000 ms, ugyldige svar, tidsavbrudd og språkhint.
import { describe, expect, test } from "vitest";
import { AI_TIMEOUT_MS } from "@/lib/ai/timeout";
import { decide, MAX_MS, MIN_HITS, summarize, type CaseResult } from "./score";

function result(over: Partial<CaseResult> = {}): CaseResult {
  return {
    id: "x",
    expected: "waste",
    answer: "waste",
    summary: "Søppel ved inngangen",
    status: "ok",
    ms: 800,
    ...over,
  };
}

/** 20 svar der de `hits` første er riktige og resten bom (gyldige svar). */
function run(hits: number, over: Partial<CaseResult> = {}): CaseResult[] {
  return Array.from({ length: 20 }, (_, i) =>
    result({ id: `r${i}`, answer: i < hits ? "waste" : "other", ...over }),
  );
}

describe("grensene", () => {
  test("tidsgrensen er den samme som appens", () => {
    expect(MAX_MS).toBe(AI_TIMEOUT_MS);
    expect(MIN_HITS).toBe(16);
  });
});

describe("summarize", () => {
  test("teller riktige, gyldige, tider og språk", () => {
    const summary = summarize([
      result({ ms: 100 }),
      result({ answer: "other", ms: 300 }),
      result({ summary: "Lyset fungerer ikkje", ms: 200 }),
      result({ answer: null, summary: null, status: "invalid", code: "ugyldig_svar", ms: 400 }),
    ]);
    expect(summary).toEqual({
      total: 4,
      hits: 2,
      valid: 3,
      maxMs: 400,
      meanMs: 250,
      slow: 0,
      suspectLanguage: 1,
      noSummary: 0,
    });
  });

  test("tom kjøring gir nuller", () => {
    expect(summarize([])).toMatchObject({ total: 0, hits: 0, valid: 0, maxMs: 0, meanMs: 0 });
  });

  test("et ugyldig svar teller aldri som riktig, selv med riktig fasit", () => {
    expect(summarize([result({ status: "error", answer: "waste" })]).hits).toBe(0);
  });
});

describe("decide: riktige kategorier", () => {
  test("15 gir ikke bestått, 16 og 20 gir målbart bestått", () => {
    expect(decide(summarize(run(15))).measurablePass).toBe(false);
    expect(decide(summarize(run(15))).verdict).toBe("ikke bestått");
    expect(decide(summarize(run(16))).measurablePass).toBe(true);
    expect(decide(summarize(run(20))).measurablePass).toBe(true);
  });
});

describe("decide: svartid", () => {
  test("4999 ms er bestått, 5000 ms er ikke", () => {
    expect(decide(summarize(run(20, { ms: 4999 }))).speedOk).toBe(true);
    expect(decide(summarize(run(20, { ms: 5000 }))).speedOk).toBe(false);
  });

  test("ett tidsavbrudd gir ikke bestått", () => {
    const results = run(20);
    results[3] = result({ answer: null, summary: null, status: "timeout", code: "timeout", ms: 5000 });
    const decision = decide(summarize(results));
    expect(decision.speedOk).toBe(false);
    expect(decision.validOk).toBe(false);
    expect(decision.measurablePass).toBe(false);
  });
});

describe("decide: gyldige svar", () => {
  test("ett ugyldig svar gir ikke bestått, selv med 19 riktige", () => {
    const results = run(20);
    results[0] = result({ answer: null, summary: null, status: "invalid", code: "ugyldig_svar" });
    const decision = decide(summarize(results));
    expect(summarize(results).hits).toBe(19);
    expect(decision.validOk).toBe(false);
    expect(decision.measurablePass).toBe(false);
  });

  test("tom kjøring består aldri", () => {
    expect(decide(summarize([])).measurablePass).toBe(false);
  });
});

describe("decide: språk", () => {
  test("bestått målbart kan ikke kalles bestått uten at oppsummeringene er lest", () => {
    const clean = decide(summarize(run(20)));
    expect(clean.verdict).toMatch(/les oppsummeringene/);
    expect(clean.verdict).not.toBe("bestått");

    const results = run(20);
    results[5] = result({ summary: "Jeg ser et hul" });
    const flagged = decide(summarize(results));
    expect(flagged.measurablePass).toBe(true);
    expect(flagged.verdict).toMatch(/1 oppsummering\(er\) har mistenkte ord/);
  });
});

describe("svar uten oppsummering", () => {
  test("telles, og målbart bestått sier at språket ikke kan sjekkes for dem", () => {
    const results = run(20);
    results[2] = result({ summary: null });
    expect(summarize(results).noSummary).toBe(1);
    const decision = decide(summarize(results));
    expect(decision.measurablePass).toBe(true);
    expect(decision.verdict).toMatch(/1 svar mangler oppsummering/);
  });

  test("ugyldige svar teller ikke som uten oppsummering", () => {
    expect(summarize([result({ answer: null, summary: null, status: "invalid", code: "ugyldig_svar" })]).noSummary).toBe(0);
  });
});
