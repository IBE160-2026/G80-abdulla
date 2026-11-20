// Tester mock-adapteren (Story 2.3): nøkkelord, rekkefølgen ved flere treff,
// ordstammer, «sti» bare som eget ord, `other` uten treff, testordet og
// første setning som oppsummering. Ingen nettverkskall.
import { afterEach, describe, expect, test, vi } from "vitest";
import { mockSuggest } from "./mock";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mockSuggest", () => {
  test.each([
    ["Gatelyset ved gangveien er ødelagt", "lighting"],
    ["Gatelys", "lighting"],
    ["Det er mørkt, og lyset virker ikke", "lighting"],
    ["Dårlig belysning ved inngangen", "lighting"],
    ["Søppel på bakken", "waste"],
    ["Full søppelkasse", "waste"],
    ["Boss over alt", "waste"],
    ["Stort hull i veien", "roads_sidewalks"],
    ["Hullet er farlig", "roads_sidewalks"],
    ["Fortauet er isete", "roads_sidewalks"],
    ["Ødelagt asfalt", "roads_sidewalks"],
    ["Veien er smal", "roads_sidewalks"],
    ["Stien til skogen er dårlig", "other"],
    ["Hærverk på bygget", "vandalism"],
    ["Skadeverk på bussholdeplassen", "vandalism"],
    ["Knust rute i døra", "vandalism"],
    ["Tagging på veggen", "vandalism"],
    ["Noe helt annet", "other"],
    ["", "other"],
  ])("«%s» gir %s", (text, category) => {
    expect(mockSuggest(text)?.category).toBe(category);
  });

  test("«sti» teller bare som eget ord", () => {
    expect(mockSuggest("Sti ved elva")?.category).toBe("roads_sidewalks");
    expect(mockSuggest("Grusen på sti.")?.category).toBe("roads_sidewalks");
    expect(mockSuggest("Det er en sti")?.category).toBe("roads_sidewalks");
    expect(mockSuggest("Stikkontakten er løs")?.category).toBe("other");
    expect(mockSuggest("Det er mistenkelig stille")?.category).toBe("other");
    expect(mockSuggest("Postkassen")?.category).toBe("other");
  });

  test("store og små bokstaver spiller ingen rolle", () => {
    expect(mockSuggest("GATELYS")?.category).toBe("lighting");
    expect(mockSuggest("SØPPEL")?.category).toBe("waste");
    expect(mockSuggest("HÆRVERK")?.category).toBe("vandalism");
    expect(mockSuggest("Hull")?.category).toBe("roads_sidewalks");
    expect(mockSuggest("STI")?.category).toBe("roads_sidewalks");
  });

  test("ved flere treff gjelder lighting, waste, vandalism, roads_sidewalks", () => {
    expect(mockSuggest("Gatelyset ved gangveien er ødelagt")?.category).toBe("lighting");
    expect(mockSuggest("Søppel i hullet")?.category).toBe("waste");
    expect(mockSuggest("Hærverk på veien")?.category).toBe("vandalism");
    expect(mockSuggest("Knust lys, søppel og hull")?.category).toBe("lighting");
    expect(mockSuggest("Boss og tagging")?.category).toBe("waste");
    expect(mockSuggest("Tagging på fortauet")?.category).toBe("vandalism");
  });

  test("testordet gir null, uansett store og små bokstaver og hvor det står", () => {
    expect(mockSuggest("ingenforslag")).toBeNull();
    expect(mockSuggest("INGENFORSLAG her")).toBeNull();
    expect(mockSuggest("Gatelys ingenforslag")).toBeNull();
  });

  test("oppsummeringen er første setning, trimmet", () => {
    expect(mockSuggest("Gatelyset er ødelagt. Det er mørkt om kvelden.")?.summary).toBe(
      "Gatelyset er ødelagt",
    );
    expect(mockSuggest("  Første linje\nAndre linje")?.summary).toBe("Første linje");
    expect(mockSuggest("Første linje\r\nAndre linje")?.summary).toBe("Første linje");
    expect(mockSuggest("\n  Etter blanke linjer. Mer")?.summary).toBe("Etter blanke linjer");
    expect(mockSuggest("Uten punktum")?.summary).toBe("Uten punktum");
    expect(mockSuggest("3.5 meter hull i veien. Mer tekst")?.summary).toBe("3.5 meter hull i veien");
  });

  test("oppsummeringen er høyst 120 tegn, også med emoji", () => {
    expect(mockSuggest("a".repeat(300))?.summary).toBe("a".repeat(120));
    expect(mockSuggest("😀".repeat(300))?.summary).toBe("😀".repeat(120));
    expect(mockSuggest("a".repeat(119) + " b c d")?.summary).toBe("a".repeat(119));
  });

  test("tom beskrivelse gir other uten oppsummering", () => {
    expect(mockSuggest("")).toEqual({ category: "other", summary: null });
    expect(mockSuggest(".")).toEqual({ category: "other", summary: null });
  });

  test("gjør ingen nettverkskall", () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);
    mockSuggest("Gatelyset er ødelagt");
    mockSuggest("ingenforslag");
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
