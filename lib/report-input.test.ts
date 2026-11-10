// Tester valideringen av en ny rapport (Story 2.2): trimming, grensene med
// charCount (kodepunkter, også emoji og æøå), bare mellomrom som tom tekst,
// kategori mot enumen og de norske feilmeldingene. Skjemaet og Server Action
// bruker den samme parseReportInput.
import { describe, expect, test } from "vitest";
import { DESCRIPTION_MAX, LOCATION_MAX, SUMMARY_MAX } from "./limits";
import {
  parseReportInput,
  REPORT_CATEGORIES,
  REPORT_FIELDS,
  REPORT_MESSAGES,
} from "./report-input";

const valid = { description: "Hull i veien", location: "Gangveien", category: "roads_sidewalks" };

describe("parseReportInput", () => {
  test("gyldig input gir trimmet tekst og kategorikoden", () => {
    expect(
      parseReportInput({ description: "  Hull i veien \n", location: "\tGangveien  ", category: "other" }),
    ).toEqual({
      ok: true,
      data: { description: "Hull i veien", location: "Gangveien", category: "other" },
    });
  });

  test("felt utenom de tre og oppsummeringen fjernes", () => {
    const result = parseReportInput({
      ...valid,
      author_id: "10000000-0000-4000-8000-000000000003",
      status: "resolved",
      hidden: true,
      image_path: "y",
    });
    expect(result).toEqual({ ok: true, data: valid });
    if (result.ok) expect(Object.keys(result.data).sort()).toEqual(["category", "description", "location"]);
  });

  describe("summary (Story 2.3)", () => {
    test("en oppsummering trimmes og tas med", () => {
      expect(parseReportInput({ ...valid, summary: "  Hull i veien \n" })).toEqual({
        ok: true,
        data: { ...valid, summary: "Hull i veien" },
      });
    });

    test.each([
      ["mangler", undefined],
      ["null", null],
      ["tom", ""],
      ["bare mellomrom", "  \n\t "],
      ["ikke en streng", 5],
      ["et objekt", { text: "x" }],
    ])("oppsummering som %s utelates", (_name, summary) => {
      const result = parseReportInput({ ...valid, summary });
      expect(result).toEqual({ ok: true, data: valid });
      if (result.ok) expect("summary" in result.data).toBe(false);
    });

    test("nøyaktig 300 tegn godtas, 301 avvises med meldingen under feltet", () => {
      expect(SUMMARY_MAX).toBe(300);
      expect(parseReportInput({ ...valid, summary: "a".repeat(300) }).ok).toBe(true);
      expect(parseReportInput({ ...valid, summary: "a".repeat(301) })).toEqual({
        ok: false,
        errors: { summary: "Oppsummeringen kan ha høyst 300 tegn." },
      });
    });

    test("grensen telles i kodepunkter og gjelder trimmet tekst", () => {
      expect(parseReportInput({ ...valid, summary: "😀".repeat(300) }).ok).toBe(true);
      expect(parseReportInput({ ...valid, summary: "😀".repeat(301) }).ok).toBe(false);
      expect(parseReportInput({ ...valid, summary: `  ${"æ".repeat(300)}  ` }).ok).toBe(true);
      expect(parseReportInput({ ...valid, summary: "æ".repeat(301) }).ok).toBe(false);
    });

    test("feilen i oppsummeringen kommer sammen med feil i de andre feltene", () => {
      expect(parseReportInput({ description: "", category: "x", location: "Vei", summary: "a".repeat(301) })).toEqual({
        ok: false,
        errors: {
          description: REPORT_MESSAGES.descriptionRequired,
          category: REPORT_MESSAGES.categoryRequired,
          summary: REPORT_MESSAGES.summaryTooLong,
        },
      });
    });
  });

  test("kategoriene er de fem kodene fra databasen, i visningsrekkefølge", () => {
    expect([...REPORT_CATEGORIES]).toEqual([
      "waste",
      "lighting",
      "roads_sidewalks",
      "vandalism",
      "other",
    ]);
    for (const category of REPORT_CATEGORIES) {
      expect(parseReportInput({ ...valid, category }).ok).toBe(true);
    }
  });

  test.each(["Waste", "WASTE", "Søppel", "ukjent", "", " waste", "__proto__", 1, null])(
    "ugyldig kategori %j gir «Velg en kategori.»",
    (category) => {
      expect(parseReportInput({ ...valid, category })).toEqual({
        ok: false,
        errors: { category: REPORT_MESSAGES.categoryRequired },
      });
    },
  );

  test.each(["", "   ", "\n\t "])("tom beskrivelse %j gir «Skriv inn en beskrivelse.»", (description) => {
    expect(parseReportInput({ ...valid, description })).toEqual({
      ok: false,
      errors: { description: "Skriv inn en beskrivelse." },
    });
  });

  test.each(["", "   "])("tom lokasjon %j gir «Skriv inn et sted.»", (location) => {
    expect(parseReportInput({ ...valid, location })).toEqual({
      ok: false,
      errors: { location: "Skriv inn et sted." },
    });
  });

  test("felt som mangler eller har feil type, gir de samme meldingene", () => {
    expect(parseReportInput({})).toEqual({
      ok: false,
      errors: {
        description: "Skriv inn en beskrivelse.",
        category: "Velg en kategori.",
        location: "Skriv inn et sted.",
      },
    });
    expect(parseReportInput({ ...valid, description: 5, location: null }).ok).toBe(false);
    for (const raw of [undefined, null, "tekst", 42, []]) {
      const result = parseReportInput(raw);
      expect(result.ok, String(raw)).toBe(false);
    }
  });

  test("grensene: nøyaktig 1000 og 200 godtas, ett tegn mer avvises", () => {
    expect(
      parseReportInput({ ...valid, description: "a".repeat(DESCRIPTION_MAX), location: "a".repeat(LOCATION_MAX) }).ok,
    ).toBe(true);
    expect(parseReportInput({ ...valid, description: "a".repeat(DESCRIPTION_MAX + 1) })).toEqual({
      ok: false,
      errors: { description: "Beskrivelsen kan ha høyst 1000 tegn." },
    });
    expect(parseReportInput({ ...valid, location: "a".repeat(LOCATION_MAX + 1) })).toEqual({
      ok: false,
      errors: { location: "Stedet kan ha høyst 200 tegn." },
    });
  });

  test("grensene telles i kodepunkter: emoji og æøå", () => {
    expect(parseReportInput({ ...valid, description: "😀".repeat(1000), location: "æøå".repeat(66) + "ab" }).ok).toBe(true);
    expect(parseReportInput({ ...valid, description: "😀".repeat(1001) }).ok).toBe(false);
    expect(parseReportInput({ ...valid, location: "😀".repeat(200) }).ok).toBe(true);
    expect(parseReportInput({ ...valid, location: "😀".repeat(201) }).ok).toBe(false);
    expect(parseReportInput({ ...valid, location: "å".repeat(201) }).ok).toBe(false);
  });

  test("grensene gjelder trimmet tekst", () => {
    const result = parseReportInput({
      ...valid,
      description: `  ${"a".repeat(DESCRIPTION_MAX)}  `,
      location: ` ${"a".repeat(LOCATION_MAX)} `,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.description).toHaveLength(DESCRIPTION_MAX);
      expect(result.data.location).toHaveLength(LOCATION_MAX);
    }
  });

  test("alle tre feltene kan feile samtidig, og feltene har fast rekkefølge", () => {
    expect([...REPORT_FIELDS]).toEqual(["description", "category", "location"]);
    expect(
      parseReportInput({ description: "a".repeat(1001), category: "x", location: "b".repeat(201) }),
    ).toEqual({
      ok: false,
      errors: {
        description: REPORT_MESSAGES.descriptionTooLong,
        category: REPORT_MESSAGES.categoryRequired,
        location: REPORT_MESSAGES.locationTooLong,
      },
    });
  });

  test("meldingene er de norske tekstene i spec-en", () => {
    expect(REPORT_MESSAGES).toEqual({
      descriptionRequired: "Skriv inn en beskrivelse.",
      descriptionTooLong: "Beskrivelsen kan ha høyst 1000 tegn.",
      locationRequired: "Skriv inn et sted.",
      locationTooLong: "Stedet kan ha høyst 200 tegn.",
      categoryRequired: "Velg en kategori.",
      summaryTooLong: "Oppsummeringen kan ha høyst 300 tegn.",
    });
  });
});
