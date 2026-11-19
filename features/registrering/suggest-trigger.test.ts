// Tester når skjemaet henter et KI-forslag (Story 2.3): charsChanged måler den
// differerende midten på trimmet tekst, og terskelen er nøyaktig 10 tegn.
import { describe, expect, test } from "vitest";
import { charsChanged, SUGGEST_MIN_CHARS } from "./suggest-trigger";

describe("charsChanged", () => {
  test("terskelen er 10 tegn", () => {
    expect(SUGGEST_MIN_CHARS).toBe(10);
  });

  test("første forslag regnes mot tom tekst", () => {
    expect(charsChanged("", "a".repeat(10))).toBe(10);
    expect(charsChanged("", "a".repeat(9))).toBe(9);
    expect(charsChanged("", "")).toBe(0);
  });

  test("nøyaktig 10 tegn gir kall, 9 gir ikke", () => {
    const base = "Gatelyset er ødelagt";
    expect(charsChanged(base, `${base} ${"x".repeat(9)}`)).toBe(10);
    expect(charsChanged(base, `${base}${"x".repeat(10)}`)).toBeGreaterThanOrEqual(SUGGEST_MIN_CHARS);
    expect(charsChanged(base, `${base}${"x".repeat(9)}`)).toBeLessThan(SUGGEST_MIN_CHARS);
    expect(charsChanged(base, `${base}${"x".repeat(9)}`)).toBe(9);
  });

  test("lik tekst er 0 endringer", () => {
    expect(charsChanged("Hull i veien", "Hull i veien")).toBe(0);
  });

  test("trimming: mellomrom først og sist teller ikke", () => {
    expect(charsChanged("Hull i veien", "   Hull i veien \n")).toBe(0);
    expect(charsChanged("   ", "")).toBe(0);
    expect(charsChanged("", "          ")).toBe(0);
  });

  test("et tillegg midt i teksten teller med lengden av tillegget", () => {
    expect(charsChanged("Hull i veien", "Hull i den store veien")).toBe(10);
  });

  test("fjernet tekst teller med lengden av det som ble borte", () => {
    expect(charsChanged("a".repeat(30), "a".repeat(20))).toBe(10);
    expect(charsChanged("Hull i den store veien", "Hull i veien")).toBe(10);
    expect(charsChanged("abc", "")).toBe(3);
  });

  test("å skrive om en setning teller som endring", () => {
    const before = "Gatelyset ved gangveien er ødelagt";
    const after = "Søppelkassen ved gangveien er full";
    expect(charsChanged(before, after)).toBeGreaterThanOrEqual(SUGGEST_MIN_CHARS);
  });

  test("erstattet tekst teller med den lengste av de to delene", () => {
    // «lys» byttet med «søppel»: 3 og 6 tegn er forskjellige.
    expect(charsChanged("Ødelagt lys ved inngangen", "Ødelagt søppel ved inngangen")).toBe(6);
    expect(charsChanged("Ødelagt søppel ved inngangen", "Ødelagt lys ved inngangen")).toBe(6);
    // Samme lengde, bare tegn byttet på samme sted.
    expect(charsChanged("aaaaaaaaaa", "bbbbbbbbbb")).toBe(10);
    expect(charsChanged("xaaaaaaaaay", "xbbbbbbbbby")).toBe(9);
  });

  test("felles begynnelse og slutt overlapper ikke", () => {
    expect(charsChanged("aaa", "aaaaaa")).toBe(3);
    expect(charsChanged("aaaaaa", "aaa")).toBe(3);
    expect(charsChanged("abab", "ab")).toBe(2);
  });

  test("tegn telles som kodepunkter, ikke UTF-16-enheter", () => {
    expect(charsChanged("", "😀".repeat(10))).toBe(10);
    expect(charsChanged("", "😀".repeat(9))).toBe(9);
    expect(charsChanged("Hull", `Hull${"😀".repeat(10)}`)).toBe(10);
    expect(charsChanged("æøå", "æøåæøåæøåæ")).toBe(7);
  });
});
