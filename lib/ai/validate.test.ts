// Tester valideringen av svaret fra KI-en (Story 2.3, AD-8): kodeblokk og JSON,
// kategorien mot Constants (eksakt), oppsummeringen som ren tekst og kortet,
// og kuttingen av beskrivelsen til 2000 tegn.
import { describe, expect, test } from "vitest";
import { SUMMARY_MAX } from "../limits";
import { AI_INPUT_MAX, clipInput, parseSuggestion } from "./validate";

const json = (value: unknown) => JSON.stringify(value);

describe("parseSuggestion", () => {
  test("gyldig JSON gir kategorien og oppsummeringen", () => {
    expect(parseSuggestion(json({ category: "lighting", summary: "Gatelyset er ødelagt." }))).toEqual({
      category: "lighting",
      summary: "Gatelyset er ødelagt.",
    });
  });

  test.each(["waste", "lighting", "roads_sidewalks", "vandalism", "other"])("%s er en gyldig kategori", (category) => {
    expect(parseSuggestion(json({ category, summary: "x" }))?.category).toBe(category);
  });

  test("et allerede tolket objekt godtas også", () => {
    expect(parseSuggestion({ category: "waste", summary: "Full søppelkasse" })).toEqual({
      category: "waste",
      summary: "Full søppelkasse",
    });
  });

  test.each([
    ["json", "```json\n{\"category\":\"waste\",\"summary\":\"Boss\"}\n```"],
    ["uten språk", "```\n{\"category\":\"waste\",\"summary\":\"Boss\"}\n```"],
    ["på én linje", "```json {\"category\":\"waste\",\"summary\":\"Boss\"} ```"],
    ["med mellomrom rundt", "  \n```json\r\n{\"category\":\"waste\",\"summary\":\"Boss\"}\r\n```\n "],
  ])("JSON i en kodeblokk (%s) tåles", (_name, raw) => {
    expect(parseSuggestion(raw)).toEqual({ category: "waste", summary: "Boss" });
  });

  test.each([
    ["norsk navn", "Belysning"],
    ["feil store bokstaver", "LIGHTING"],
    ["stor forbokstav", "Lighting"],
    ["mellomrom etter", "lighting "],
    ["mellomrom før", " lighting"],
    ["ukjent", "gatelys"],
    ["tom", ""],
    ["__proto__", "__proto__"],
  ])("ugyldig kategori (%s) gir null", (_name, category) => {
    expect(parseSuggestion(json({ category, summary: "Noe" }))).toBeNull();
  });

  test.each([
    ["tall", 1],
    ["null", null],
    ["liste", ["lighting"]],
    ["objekt", { code: "lighting" }],
  ])("kategori som er %s, gir null", (_name, category) => {
    expect(parseSuggestion(json({ category, summary: "Noe" }))).toBeNull();
  });

  test.each([
    ["ugyldig JSON", "{category: lighting"],
    ["tom tekst", ""],
    ["vanlig tekst", "Jeg foreslår belysning."],
    ["JSON-streng", json("lighting")],
    ["JSON-tall", "42"],
    ["JSON-liste", json([{ category: "lighting" }])],
    ["null", "null"],
    ["manglende kategori", json({ summary: "Noe" })],
    ["ikke en streng", 42],
    ["undefined", undefined],
    ["null-verdi", null],
  ])("%s gir null", (_name, raw) => {
    expect(parseSuggestion(raw)).toBeNull();
  });

  test("gyldig kategori uten oppsummering gir kategorien og summary null", () => {
    expect(parseSuggestion(json({ category: "other" }))).toEqual({ category: "other", summary: null });
    expect(parseSuggestion(json({ category: "other", summary: null }))).toEqual({
      category: "other",
      summary: null,
    });
    expect(parseSuggestion(json({ category: "other", summary: 5 }))).toEqual({
      category: "other",
      summary: null,
    });
  });

  test("tom oppsummering og bare mellomrom gir null", () => {
    for (const summary of ["", "   ", "\n\t "]) {
      expect(parseSuggestion(json({ category: "other", summary }))).toEqual({
        category: "other",
        summary: null,
      });
    }
  });

  test("oppsummeringen trimmes og HTML-tagger fjernes", () => {
    expect(
      parseSuggestion(json({ category: "other", summary: "  <b>Hull</b> i <a href=\"x\">veien</a>  " })),
    ).toEqual({ category: "other", summary: "Hull i veien" });
    expect(
      parseSuggestion(json({ category: "other", summary: "<script>alert(1)</script>Hull" }))?.summary,
    ).toBe("alert(1)Hull");
    // Bare tagger blir tom tekst.
    expect(parseSuggestion(json({ category: "other", summary: "<br/><img src=x>" }))?.summary).toBeNull();
  });

  test("bare tagger fjernes: tekst mellom < og > beholdes, og en tagg uten slutt fjernes", () => {
    const summary = (value: string) => parseSuggestion(json({ category: "other", summary: value }))?.summary;
    expect(summary("skilt < 30 og > 50")).toBe("skilt < 30 og > 50");
    expect(summary("<b>Hull</b> i veien")).toBe("Hull i veien");
    expect(summary("Hull <img src=x onerror=1")).toBe("Hull");
    expect(summary("<img src=x onerror=1")).toBeNull();
  });

  test("oppsummeringen kortes til 300 tegn, også med emoji", () => {
    const long = parseSuggestion(json({ category: "other", summary: "a".repeat(400) }));
    expect(long?.summary).toHaveLength(SUMMARY_MAX);

    const emoji = parseSuggestion(json({ category: "other", summary: "😀".repeat(400) }));
    expect([...(emoji?.summary ?? "")]).toHaveLength(SUMMARY_MAX);
    // Ingen halv surrogat i slutten.
    expect(emoji?.summary).toBe("😀".repeat(SUMMARY_MAX));
  });

  test("nøyaktig 300 tegn beholdes", () => {
    expect(parseSuggestion(json({ category: "other", summary: "a".repeat(300) }))?.summary).toHaveLength(300);
  });
});

describe("clipInput", () => {
  test("høyst 2000 tegn sendes, talt som kodepunkter", () => {
    expect(AI_INPUT_MAX).toBe(2000);
    expect(clipInput("a".repeat(2500))).toHaveLength(2000);
    expect([...clipInput("😀".repeat(2500))]).toHaveLength(2000);
  });

  test("kortere tekst er uendret", () => {
    expect(clipInput("a".repeat(2000))).toBe("a".repeat(2000));
    expect(clipInput("Hull i veien")).toBe("Hull i veien");
    expect(clipInput("")).toBe("");
  });
});
