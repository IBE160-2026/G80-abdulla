// Utskriften for SM-5 (Story 2.5): mock-advarselen først og sist, verten og
// modellen men aldri nøkkel, sti eller beskrivelser, og én linje per kall med
// oppsummeringen og eventuelt språkmerking.
import { describe, expect, test } from "vitest";
import { formatReport, hostOf, MOCK_WARNING } from "./report";
import type { CaseResult } from "./score";
import { SM5_TESTSET } from "./testset";

function results(over: Partial<CaseResult> = {}): CaseResult[] {
  return SM5_TESTSET.map((c, i) => ({
    id: c.id,
    expected: c.expected,
    answer: c.expected,
    summary: `Oppsummering ${i}`,
    status: "ok" as const,
    ms: 500 + i,
    ...over,
  }));
}

describe("formatReport", () => {
  test("mock: advarselen står først og sist", () => {
    const lines = formatReport({ provider: "mock" }, results());
    expect(lines[0]).toBe(MOCK_WARNING);
    expect(lines[lines.length - 1]).toBe(MOCK_WARNING);
    expect(MOCK_WARNING).toBe("Mock-modus: resultatet sier ikke noe om kvalitet.");
  });

  test("leverandør: ingen mock-advarsel, verten og modellen vises, stien aldri", () => {
    const text = formatReport(
      {
        provider: "openai",
        baseUrl: "https://api.cloudflare.com/client/v4/accounts/konto-id-123/ai/v1",
        model: "modell-x",
      },
      results(),
    ).join("\n");
    expect(text).not.toContain(MOCK_WARNING);
    expect(text).toContain("api.cloudflare.com");
    expect(text).toContain("modell-x");
    expect(text).not.toContain("konto-id-123");
  });

  test("én linje per kall med fasit, svar, status, tid og oppsummering, men ikke beskrivelsen", () => {
    const text = formatReport({ provider: "mock" }, results()).join("\n");
    for (const c of SM5_TESTSET) {
      expect(text).toContain(c.id);
      expect(text).not.toContain(c.description);
    }
    expect(text).toContain("oppsummering: Oppsummering 0");
    expect(text).toContain("Riktige kategorier: 20 av 20");
    expect(text).toContain("Avgjørelse:         ingen: mock");
    expect(text).not.toContain("målingene er bestått");
  });

  test("leverandør: avgjørelsen kommer fra målingene", () => {
    const info = { provider: "openai" as const, baseUrl: "https://x.test/v1", model: "m" };
    const text = formatReport(info, results()).join("\n");
    expect(text).toContain("Avgjørelse:         målingene er bestått");
  });

  test("ugyldig svar viser status og kort kode, og ingen tekst", () => {
    const text = formatReport(
      { provider: "mock" },
      results({ answer: null, summary: null, status: "invalid", code: "ugyldig_svar" }),
    ).join("\n");
    expect(text).toContain("invalid:ugyldig_svar");
    expect(text).toContain("Gyldige svar:       0 av 20");
    expect(text).toContain("IKKE OK");
    expect(text).not.toContain("oppsummering:");
  });

  test("oppsummering med nynorsk merkes mistenkt", () => {
    const text = formatReport({ provider: "mock" }, results({ summary: "Lyset virkar ikkje" })).join("\n");
    expect(text).toContain("[mistenkt språk: ikkje]");
  });

  test("grensen: 15 riktige gir IKKE OK på treff, 16 gir ok", () => {
    const fifteen = results().map((r, i) => (i < 5 ? { ...r, answer: "other" as const } : r));
    const sixteen = results().map((r, i) => (i < 4 ? { ...r, answer: "other" as const } : r));
    expect(formatReport({ provider: "mock" }, fifteen).join("\n")).toMatch(/15 av 20 \(krav: minst 16\)\s+IKKE OK/);
    expect(formatReport({ provider: "mock" }, sixteen).join("\n")).toMatch(/16 av 20 \(krav: minst 16\)\s+ok/);
  });
});

describe("formatReport: linjer og sammendrag", () => {
  function mixed(): CaseResult[] {
    const all = results();
    all[0] = { ...all[0], answer: "other" }; // feil kategori, gyldig svar
    all[1] = { ...all[1], ms: 5000 }; // for sakte
    all[2] = { ...all[2], summary: "Lyset virker ikkje" }; // mistenkt språk
    all[3] = { ...all[3], summary: null }; // uten oppsummering
    return all;
  }

  test("riktig og feil, med fasit og svar", () => {
    const lines = formatReport({ provider: "mock" }, mixed());
    expect(lines.find((l) => l.startsWith("sm5-01"))).toMatch(/fasit=waste\s+svar=other\s+feil/);
    expect(lines.find((l) => l.startsWith("sm5-02"))).toMatch(/fasit=waste\s+svar=waste\s+riktig/);
  });

  test("svartidslinjen viser IKKE OK når ett svar er for sakte, og de andre linjene er uberørt", () => {
    const text = formatReport({ provider: "mock" }, mixed()).join("\n");
    expect(text).toMatch(/Svartid:\s+størst 5000 ms.*1 på 5000 ms eller mer \(krav: ingen\)\s+IKKE OK/);
    expect(text).toMatch(/Riktige kategorier: 19 av 20 \(krav: minst 16\)\s+ok/);
    expect(text).toMatch(/Gyldige svar:\s+20 av 20 \(krav: alle\)\s+ok/);
  });

  test("språklinjen viser antall mistenkte og antall uten oppsummering", () => {
    const text = formatReport({ provider: "mock" }, mixed()).join("\n");
    expect(text).toMatch(
      /Språk:\s+1 oppsummering\(er\) med mistenkte ord \(nynorsk eller dansk\), 1 uten oppsummering/,
    );
  });

  test("styretegn og linjeskift i en oppsummering bryter ikke oppsettet", () => {
    const all = results();
    all[0] = { ...all[0], summary: "Første linje\nandre linje\u001b[31m rødt" };
    const text = formatReport({ provider: "mock" }, all).join("\n");
    expect(text).toContain("oppsummering: Første linje andre linje [31m rødt");
    expect(text).not.toContain("\u001b");
    expect(text).not.toContain("Første linje\nandre");
  });
});

describe("hostOf", () => {
  test("gir verten, eller «ukjent»", () => {
    expect(hostOf("https://api.groq.com/openai/v1")).toBe("api.groq.com");
    expect(hostOf("ikke en adresse")).toBe("ukjent");
  });
});
