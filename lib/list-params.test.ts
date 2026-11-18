// Tester `lib/list-params.ts` (Story 3.1): tolkningen av URL-en, lenkene og
// brikkene. Hver rad i I/O-matrisen i spec-en er dekket.
import { describe, expect, test } from "vitest";
import {
  buildListHref,
  clearFilters,
  hasActiveFilter,
  parseListParams,
  toggleFilter,
  withSort,
  type ListParams,
} from "./list-params";

describe("parseListParams", () => {
  test("ingen parametre gir standardvisningen: nyeste, ingen filter", () => {
    expect(parseListParams({})).toStrictEqual({ sort: "newest" });
  });

  test("kategori, status og sortering med kodeverdiene", () => {
    expect(
      parseListParams({ category: "lighting", status: "in_progress", sort: "confirmations" }),
    ).toStrictEqual({ category: "lighting", status: "in_progress", sort: "confirmations" });
  });

  test("alle fem kategoriene og alle tre statusene godtas", () => {
    for (const category of ["waste", "lighting", "roads_sidewalks", "vandalism", "other"]) {
      expect(parseListParams({ category }).category).toBe(category);
    }
    for (const status of ["new", "in_progress", "resolved"]) {
      expect(parseListParams({ status }).status).toBe(status);
    }
  });

  test("feil store og små bokstaver og norske navn ignoreres", () => {
    expect(parseListParams({ category: "Lighting" })).toStrictEqual({ sort: "newest" });
    expect(parseListParams({ category: "Belysning" })).toStrictEqual({ sort: "newest" });
    expect(parseListParams({ status: "NEW" })).toStrictEqual({ sort: "newest" });
    expect(parseListParams({ sort: "Confirmations" })).toStrictEqual({ sort: "newest" });
  });

  test("en gjentatt nøkkel er ukjent, også når begge verdiene er gyldige", () => {
    expect(parseListParams({ category: ["waste", "lighting"] })).toStrictEqual({ sort: "newest" });
    expect(parseListParams({ status: ["new", "new"], sort: ["confirmations"] })).toStrictEqual({
      sort: "newest",
    });
  });

  test("en tom verdi og en ukjent sortering gir lista uten den verdien", () => {
    expect(parseListParams({ category: "", status: "" })).toStrictEqual({ sort: "newest" });
    expect(parseListParams({ sort: "" })).toStrictEqual({ sort: "newest" });
    expect(parseListParams({ sort: "oldest" })).toStrictEqual({ sort: "newest" });
  });

  test("en ukjent verdi fjerner bare seg selv, ikke de andre parametrene", () => {
    expect(
      parseListParams({ category: "ukjent", status: "resolved", sort: "confirmations" }),
    ).toStrictEqual({ status: "resolved", sort: "confirmations" });
  });

  test("ukjente nøkler, undefined og mine ignoreres", () => {
    expect(parseListParams({ mine: "true", page: "2", category: undefined })).toStrictEqual({
      sort: "newest",
    });
  });
});

describe("buildListHref", () => {
  test("uten parametre er lenken /", () => {
    expect(buildListHref({})).toBe("/");
    expect(buildListHref({ sort: "newest" })).toBe("/");
  });

  test("category, status og sort står i den rekkefølgen, og sort=newest utelates", () => {
    expect(buildListHref({ sort: "confirmations", status: "new", category: "lighting" })).toBe(
      "/?category=lighting&status=new&sort=confirmations",
    );
    expect(buildListHref({ category: "waste", sort: "newest" })).toBe("/?category=waste");
    expect(buildListHref({ status: "resolved" })).toBe("/?status=resolved");
    expect(buildListHref({ sort: "confirmations" })).toBe("/?sort=confirmations");
  });

  test("det en lenke bygger, tolkes tilbake til det samme", () => {
    const cases: ListParams[] = [
      { sort: "newest" },
      { category: "roads_sidewalks", sort: "newest" },
      { status: "in_progress", sort: "confirmations" },
      { category: "other", status: "resolved", sort: "confirmations" },
    ];
    for (const params of cases) {
      const query = Object.fromEntries(new URLSearchParams(buildListHref(params).split("?")[1] ?? ""));
      expect(parseListParams(query)).toStrictEqual(params);
    }
  });
});

describe("hasActiveFilter", () => {
  test("sann bare når en kategori eller en status er valgt", () => {
    expect(hasActiveFilter({ sort: "newest" })).toBe(false);
    expect(hasActiveFilter({ sort: "confirmations" })).toBe(false);
    expect(hasActiveFilter({ category: "waste", sort: "newest" })).toBe(true);
    expect(hasActiveFilter({ status: "new", sort: "newest" })).toBe(true);
  });
});

describe("brikkene", () => {
  const base: ListParams = { sort: "confirmations" };

  test("et trykk setter filteret, og sorteringen beholdes", () => {
    expect(toggleFilter(base, "category", "lighting")).toStrictEqual({
      category: "lighting",
      sort: "confirmations",
    });
    expect(toggleFilter(base, "status", "new")).toStrictEqual({ status: "new", sort: "confirmations" });
  });

  test("en kategori og en status kan være aktive samtidig", () => {
    const next = toggleFilter(toggleFilter(base, "category", "lighting"), "status", "new");
    expect(next).toStrictEqual({ category: "lighting", status: "new", sort: "confirmations" });
  });

  test("en annen verdi i samme gruppe bytter ut den forrige", () => {
    const lighting = toggleFilter(base, "category", "lighting");
    expect(toggleFilter(lighting, "category", "waste")).toStrictEqual({
      category: "waste",
      sort: "confirmations",
    });
    const status = toggleFilter(toggleFilter(lighting, "status", "new"), "status", "resolved");
    expect(status).toStrictEqual({ category: "lighting", status: "resolved", sort: "confirmations" });
  });

  test("et nytt trykk på den aktive brikken slår den av", () => {
    const lighting = toggleFilter(base, "category", "lighting");
    expect(toggleFilter(lighting, "category", "lighting")).toStrictEqual({ sort: "confirmations" });
    const both = { category: "lighting", status: "new", sort: "newest" } as const;
    expect(toggleFilter(both, "status", "new")).toStrictEqual({ category: "lighting", sort: "newest" });
  });

  test("toggleFilter endrer ikke parameteret det får", () => {
    const input: ListParams = { category: "lighting", sort: "newest" };
    toggleFilter(input, "category", "lighting");
    expect(input).toStrictEqual({ category: "lighting", sort: "newest" });
  });

  test("«Alle» og «Nullstill filter» fjerner kategori og status og beholder sorteringen", () => {
    expect(clearFilters({ category: "waste", status: "new", sort: "confirmations" })).toStrictEqual({
      sort: "confirmations",
    });
    expect(buildListHref(clearFilters({ category: "waste", status: "new", sort: "newest" }))).toBe("/");
    expect(buildListHref(clearFilters({ category: "waste", sort: "confirmations" }))).toBe(
      "/?sort=confirmations",
    );
  });

  test("ny sortering beholder filtrene", () => {
    expect(withSort({ category: "waste", status: "new", sort: "newest" }, "confirmations")).toStrictEqual({
      category: "waste",
      status: "new",
      sort: "confirmations",
    });
    expect(withSort({ category: "waste", sort: "confirmations" }, "newest")).toStrictEqual({
      category: "waste",
      sort: "newest",
    });
  });
});
