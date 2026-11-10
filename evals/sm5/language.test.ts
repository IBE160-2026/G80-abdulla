// Språkhintet for SM-5 (Story 2.5): treffer typiske nynorsk- og dansk-ord som
// hele ord, uavhengig av store og små bokstaver, og ikke ord som er riktige i
// norsk bokmål.
import { describe, expect, test } from "vitest";
import { isSuspect, languageHint } from "./language";

describe("languageHint", () => {
  test("nynorsk: ikkje og frå", () => {
    expect(languageHint("Lyset fungerer ikkje frå i går").nynorsk).toEqual(["ikkje", "frå"]);
  });

  test("dansk: jeg og fortovet", () => {
    expect(languageHint("Jeg så et hul i fortovet").dansk).toEqual(["jeg", "fortovet", "hul"]);
  });

  test("bokmål gir ingen treff, også «ikke», «også», «være» og «hull»", () => {
    const text = "Det er ikke bra at gatelyset også skal være ødelagt. Det er et hull i veien.";
    expect(languageHint(text)).toEqual({ nynorsk: [], dansk: [] });
    expect(isSuspect(text)).toBe(false);
  });

  test("bare hele ord: «eg» i «negativ» og «af» i «kaffe» gir ingen treff", () => {
    expect(isSuspect("Negativ kaffe")).toBe(false);
    expect(isSuspect("Eg vil ha kaffe")).toBe(true);
  });

  test("flere nynorsk- og dansk-ord, og NFC-normalisering av å", () => {
    expect(languageHint("Ho såg at me skal sjå nokre ting").nynorsk).toEqual(["ho", "me", "sjå", "nokre"]);
    expect(languageHint("Det bliver nogle huller").dansk).toEqual(["bliver", "nogle"]);
    // «frå» skrevet med å som a + ring (NFD) skal likevel treffe.
    expect(languageHint("Det kom frä vegen".replace("frä", "frå")).nynorsk).toEqual(["frå"]);
  });

  test("tom tekst", () => {
    expect(isSuspect("")).toBe(false);
  });
});
