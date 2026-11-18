// Hjelperne for SM-5-kjøringen (Story 2.5): raden i resultatet, valget mellom
// mock og leverandør, pausen, og stoppen når `--mode` ikke ga en leverandør.
import { describe, expect, test } from "vitest";
import type { SuggestOutcome } from "@/lib/ai";
import type { ServerEnv } from "@/lib/env";
import { formatReport } from "./report";
import { assertModeMatchesProvider, pauseMs, PROVIDER_PAUSE_MS, runInfoFrom, toCaseResult } from "./run-helpers";
import { SM5_TESTSET } from "./testset";

const testCase = SM5_TESTSET[0];

describe("toCaseResult", () => {
  test("legger riktig felt på riktig plass", () => {
    const outcome: SuggestOutcome = {
      suggestion: { category: "lighting", summary: "Et lys" },
      status: "ok",
      ms: 123,
    };
    expect(toCaseResult(testCase, outcome)).toEqual({
      id: testCase.id,
      expected: testCase.expected,
      answer: "lighting",
      summary: "Et lys",
      status: "ok",
      code: undefined,
      ms: 123,
    });
  });

  test("uten forslag blir svar og oppsummering null, og statusen og koden følger med", () => {
    const outcome: SuggestOutcome = { suggestion: null, status: "error", code: "http_429", ms: 40 };
    expect(toCaseResult(testCase, outcome)).toMatchObject({
      answer: null,
      summary: null,
      status: "error",
      code: "http_429",
      ms: 40,
    });
  });

  test("et forslag uten oppsummering gir svar og summary null", () => {
    const outcome: SuggestOutcome = { suggestion: { category: "waste", summary: null }, status: "ok", ms: 5 };
    expect(toCaseResult(testCase, outcome)).toMatchObject({ answer: "waste", summary: null });
  });
});

describe("runInfoFrom", () => {
  test("mock gir mock, uten pause", () => {
    const info = runInfoFrom({ AI_PROVIDER: "mock" } as ServerEnv);
    expect(info).toEqual({ provider: "mock" });
    expect(pauseMs(info)).toBe(0);
  });

  test("openai gir leverandør, adresse og modell, med pause, og nøkkelen kommer aldri med i utskriften", () => {
    const env = {
      AI_PROVIDER: "openai",
      AI_BASE_URL: "https://api.groq.com/openai/v1",
      AI_MODEL: "modell-y",
      AI_API_KEY: "sk-topphemmelig-123",
    } as ServerEnv;
    const info = runInfoFrom(env);
    expect(info).toEqual({ provider: "openai", baseUrl: "https://api.groq.com/openai/v1", model: "modell-y" });
    expect(pauseMs(info)).toBe(PROVIDER_PAUSE_MS);
    expect(JSON.stringify(info)).not.toContain("sk-topphemmelig");

    const rows = SM5_TESTSET.map((c) =>
      toCaseResult(c, { suggestion: { category: c.expected, summary: "Ok" }, status: "ok", ms: 100 }),
    );
    const text = formatReport(info, rows).join("\n");
    expect(text).not.toContain("sk-topphemmelig");
    expect(text).toContain("api.groq.com");
  });
});

describe("assertModeMatchesProvider", () => {
  test("standardmodusen med mock er i orden", () => {
    expect(() => assertModeMatchesProvider("test", { provider: "mock" })).not.toThrow();
  });

  test("en egen modus med leverandør er i orden", () => {
    const info = { provider: "openai" as const, baseUrl: "https://x.test/v1", model: "m" };
    expect(() => assertModeMatchesProvider("groq", info)).not.toThrow();
  });

  test("en egen modus som gir mock stopper med et tydelig navn på fila", () => {
    expect(() => assertModeMatchesProvider("groq", { provider: "mock" })).toThrow(/\.env\.groq/);
  });
});
