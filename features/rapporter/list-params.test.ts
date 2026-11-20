// Tester `features/rapporter/list-params.ts` (Story 3.1 og 3.2): tolkningen av URL-en,
// lenkene og brikkene. Hver rad i I/O-matrisene i spec-ene er dekket.
import { describe, expect, test } from "vitest";
import {
  buildListHref,
  clearFilters,
  hasActiveFilter,
  parseListParams,
  resetFilters,
  toggleFilter,
  toggleMine,
  withSort,
  type ListParams,
} from "./list-params";

const parse = (searchParams: Parameters<typeof parseListParams>[0]) =>
  parseListParams(searchParams, false);
const parseSignedIn = (searchParams: Parameters<typeof parseListParams>[0]) =>
  parseListParams(searchParams, true);
const DEFAULT: ListParams = { mine: false, sort: "newest" };

describe("parseListParams", () => {
  test("ingen parametre gir standardvisningen: nyeste, ingen filter", () => {
    expect(parse({})).toStrictEqual(DEFAULT);
    expect(parseSignedIn({})).toStrictEqual(DEFAULT);
  });

  test("kategori, status og sortering med kodeverdiene", () => {
    expect(
      parse({ category: "lighting", status: "in_progress", sort: "confirmations" }),
    ).toStrictEqual({ category: "lighting", status: "in_progress", mine: false, sort: "confirmations" });
  });

  test("alle fem kategoriene og alle tre statusene godtas", () => {
    for (const category of ["waste", "lighting", "roads_sidewalks", "vandalism", "other"]) {
      expect(parse({ category }).category).toBe(category);
    }
    for (const status of ["new", "in_progress", "resolved"]) {
      expect(parse({ status }).status).toBe(status);
    }
  });

  test("feil store og små bokstaver og norske navn ignoreres", () => {
    expect(parse({ category: "Lighting" })).toStrictEqual(DEFAULT);
    expect(parse({ category: "Belysning" })).toStrictEqual(DEFAULT);
    expect(parse({ status: "NEW" })).toStrictEqual(DEFAULT);
    expect(parse({ sort: "Confirmations" })).toStrictEqual(DEFAULT);
  });

  test("en gjentatt nøkkel er ukjent, også når begge verdiene er gyldige", () => {
    expect(parse({ category: ["waste", "lighting"] })).toStrictEqual(DEFAULT);
    expect(parse({ status: ["new", "new"], sort: ["confirmations"] })).toStrictEqual(DEFAULT);
  });

  test("en tom verdi og en ukjent sortering gir lista uten den verdien", () => {
    expect(parse({ category: "", status: "" })).toStrictEqual(DEFAULT);
    expect(parse({ sort: "" })).toStrictEqual(DEFAULT);
    expect(parse({ sort: "oldest" })).toStrictEqual(DEFAULT);
  });

  test("en ukjent verdi fjerner bare seg selv, ikke de andre parametrene", () => {
    expect(parse({ category: "ukjent", status: "resolved", sort: "confirmations" })).toStrictEqual({
      status: "resolved",
      mine: false,
      sort: "confirmations",
    });
  });

  test("ukjente nøkler og undefined ignoreres", () => {
    expect(parse({ page: "2", category: undefined })).toStrictEqual(DEFAULT);
  });
});

describe("parseListParams: mine (Story 3.2)", () => {
  test("mine=true er sann for en innlogget bruker", () => {
    expect(parseSignedIn({ mine: "true" })).toStrictEqual({ mine: true, sort: "newest" });
  });

  test("en besøkende med mine=true får lista som uten filteret", () => {
    expect(parse({ mine: "true" })).toStrictEqual(DEFAULT);
    expect(parse({ mine: "true", category: "waste" })).toStrictEqual({
      category: "waste",
      mine: false,
      sort: "newest",
    });
  });

  test("bare nøyaktig mine=true gjelder: feil verdi, tom verdi og gjentatt nøkkel gir false", () => {
    for (const mine of ["True", "TRUE", "1", "yes", "false", "", "mine"]) {
      expect(parseSignedIn({ mine }).mine, mine).toBe(false);
    }
    expect(parseSignedIn({ mine: ["true", "true"] }).mine).toBe(false);
    expect(parseSignedIn({ mine: ["true"] }).mine).toBe(false);
    expect(parseSignedIn({ mine: undefined }).mine).toBe(false);
  });

  test("mine kan kombineres med kategori, status og sortering", () => {
    expect(
      parseSignedIn({ mine: "true", category: "waste", status: "resolved", sort: "confirmations" }),
    ).toStrictEqual({ category: "waste", status: "resolved", mine: true, sort: "confirmations" });
  });
});

describe("buildListHref", () => {
  test("uten parametre er lenken /", () => {
    expect(buildListHref({})).toBe("/");
    expect(buildListHref({ sort: "newest" })).toBe("/");
    expect(buildListHref({ mine: false, sort: "newest" })).toBe("/");
  });

  test("category, status, mine og sort står i den rekkefølgen, og sort=newest utelates", () => {
    expect(buildListHref({ sort: "confirmations", status: "new", category: "lighting" })).toBe(
      "/?category=lighting&status=new&sort=confirmations",
    );
    expect(buildListHref({ category: "waste", sort: "newest" })).toBe("/?category=waste");
    expect(buildListHref({ status: "resolved" })).toBe("/?status=resolved");
    expect(buildListHref({ sort: "confirmations" })).toBe("/?sort=confirmations");
    expect(buildListHref({ mine: true })).toBe("/?mine=true");
    expect(buildListHref({ mine: true, sort: "newest" })).toBe("/?mine=true");
    expect(
      buildListHref({ sort: "confirmations", mine: true, status: "new", category: "waste" }),
    ).toBe("/?category=waste&status=new&mine=true&sort=confirmations");
  });

  test("det en lenke bygger, tolkes tilbake til det samme", () => {
    const cases: ListParams[] = [
      { mine: false, sort: "newest" },
      { category: "roads_sidewalks", mine: false, sort: "newest" },
      { status: "in_progress", mine: false, sort: "confirmations" },
      { category: "other", status: "resolved", mine: false, sort: "confirmations" },
      { mine: true, sort: "newest" },
      { category: "waste", mine: true, sort: "confirmations" },
      { category: "other", status: "resolved", mine: true, sort: "confirmations" },
    ];
    for (const params of cases) {
      const query = Object.fromEntries(new URLSearchParams(buildListHref(params).split("?")[1] ?? ""));
      expect(parseSignedIn(query)).toStrictEqual(params);
    }
  });
});

describe("hasActiveFilter", () => {
  test("sann bare når en kategori eller en status er valgt", () => {
    expect(hasActiveFilter(DEFAULT)).toBe(false);
    expect(hasActiveFilter({ mine: false, sort: "confirmations" })).toBe(false);
    expect(hasActiveFilter({ category: "waste", mine: false, sort: "newest" })).toBe(true);
    expect(hasActiveFilter({ status: "new", mine: false, sort: "newest" })).toBe(true);
  });

  test("«Mine rapporter» alene er ikke et kategori- eller statusfilter", () => {
    expect(hasActiveFilter({ mine: true, sort: "newest" })).toBe(false);
    expect(hasActiveFilter({ category: "waste", mine: true, sort: "newest" })).toBe(true);
  });
});

describe("brikkene", () => {
  const base: ListParams = { mine: false, sort: "confirmations" };

  test("et trykk setter filteret, og sorteringen beholdes", () => {
    expect(toggleFilter(base, "category", "lighting")).toStrictEqual({
      category: "lighting",
      mine: false,
      sort: "confirmations",
    });
    expect(toggleFilter(base, "status", "new")).toStrictEqual({
      status: "new",
      mine: false,
      sort: "confirmations",
    });
  });

  test("en kategori og en status kan være aktive samtidig", () => {
    const next = toggleFilter(toggleFilter(base, "category", "lighting"), "status", "new");
    expect(next).toStrictEqual({
      category: "lighting",
      status: "new",
      mine: false,
      sort: "confirmations",
    });
  });

  test("en annen verdi i samme gruppe bytter ut den forrige", () => {
    const lighting = toggleFilter(base, "category", "lighting");
    expect(toggleFilter(lighting, "category", "waste")).toStrictEqual({
      category: "waste",
      mine: false,
      sort: "confirmations",
    });
    const status = toggleFilter(toggleFilter(lighting, "status", "new"), "status", "resolved");
    expect(status).toStrictEqual({
      category: "lighting",
      status: "resolved",
      mine: false,
      sort: "confirmations",
    });
  });

  test("et nytt trykk på den aktive brikken slår den av", () => {
    const lighting = toggleFilter(base, "category", "lighting");
    expect(toggleFilter(lighting, "category", "lighting")).toStrictEqual(base);
    const both = { category: "lighting", status: "new", mine: false, sort: "newest" } as const;
    expect(toggleFilter(both, "status", "new")).toStrictEqual({
      category: "lighting",
      mine: false,
      sort: "newest",
    });
  });

  test("toggleFilter endrer ikke parameteret det får", () => {
    const input: ListParams = { category: "lighting", mine: false, sort: "newest" };
    toggleFilter(input, "category", "lighting");
    expect(input).toStrictEqual({ category: "lighting", mine: false, sort: "newest" });
  });

  test("«Alle» fjerner kategori og status og beholder sorteringen", () => {
    expect(
      clearFilters({ category: "waste", status: "new", mine: false, sort: "confirmations" }),
    ).toStrictEqual({ mine: false, sort: "confirmations" });
    expect(
      buildListHref(clearFilters({ category: "waste", status: "new", mine: false, sort: "newest" })),
    ).toBe("/");
    expect(
      buildListHref(clearFilters({ category: "waste", mine: false, sort: "confirmations" })),
    ).toBe("/?sort=confirmations");
  });

  test("ny sortering beholder filtrene", () => {
    expect(
      withSort({ category: "waste", status: "new", mine: true, sort: "newest" }, "confirmations"),
    ).toStrictEqual({ category: "waste", status: "new", mine: true, sort: "confirmations" });
    expect(withSort({ category: "waste", mine: false, sort: "confirmations" }, "newest")).toStrictEqual({
      category: "waste",
      mine: false,
      sort: "newest",
    });
  });
});

describe("«Mine rapporter» og «Nullstill filter» (Story 3.2)", () => {
  test("et trykk på «Mine rapporter» slår den på og av, og beholder kategori, status og sortering", () => {
    const filtered: ListParams = { category: "waste", status: "new", mine: false, sort: "confirmations" };
    const on = toggleMine(filtered);
    expect(on).toStrictEqual({ category: "waste", status: "new", mine: true, sort: "confirmations" });
    expect(toggleMine(on)).toStrictEqual(filtered);
    expect(buildListHref(on)).toBe("/?category=waste&status=new&mine=true&sort=confirmations");
  });

  test("toggleMine endrer ikke parameteret det får", () => {
    const input: ListParams = { mine: false, sort: "newest" };
    toggleMine(input);
    expect(input).toStrictEqual({ mine: false, sort: "newest" });
  });

  test("«Alle» endrer ikke «Mine rapporter»", () => {
    const params: ListParams = { category: "waste", mine: true, sort: "newest" };
    expect(clearFilters(params)).toStrictEqual({ mine: true, sort: "newest" });
    expect(buildListHref(clearFilters(params))).toBe("/?mine=true");
  });

  test("kategori, status og sortering endrer ikke «Mine rapporter»", () => {
    const mine: ListParams = { mine: true, sort: "newest" };
    expect(toggleFilter(mine, "category", "waste").mine).toBe(true);
    expect(toggleFilter(mine, "status", "new").mine).toBe(true);
    expect(withSort(mine, "confirmations").mine).toBe(true);
  });

  test("«Nullstill filter» fjerner kategori, status og «Mine rapporter» og beholder sorteringen", () => {
    expect(
      resetFilters({ category: "vandalism", status: "resolved", mine: true, sort: "confirmations" }),
    ).toStrictEqual({ mine: false, sort: "confirmations" });
    expect(
      buildListHref(
        resetFilters({ category: "vandalism", status: "resolved", mine: true, sort: "confirmations" }),
      ),
    ).toBe("/?sort=confirmations");
    expect(buildListHref(resetFilters({ category: "waste", mine: true, sort: "newest" }))).toBe("/");
  });
});
