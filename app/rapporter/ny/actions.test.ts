// Tester createReport (Story 2.2) uten Supabase: at innlogging sjekkes først,
// trimming, grenser, kategori og tom tekst før databasen, at bare de tre
// feltene og en valgfri oppsummering sendes, at både error og antall rader
// sjekkes, feilkodene, revalidatePath og at ingen rapporttekst eller e-post
// logges. Tester også suggestReport (Story 2.3): innloggingen, låsen per bruker,
// 2000 tegn og at ingen tekst eller forslag logges. lib/ai er stubbet.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { REDIRECT } = vi.hoisted(() => ({ REDIRECT: new Error("NEXT_REDIRECT") }));

const order: string[] = [];
let inserted: unknown[] = [];
let result: {
  data: { id: string }[] | null;
  error: { code: string; message: string } | null;
};
let throwOnCreate = false;
let signedIn = true;
let viewerUser: { id: string; email: string } | null = { id: "u1", email: "bruker1@localfix.test" };

const requireUser = vi.fn(async (returnTo: string) => {
  order.push(`requireUser ${returnTo}`);
  if (!signedIn) throw REDIRECT;
  return { id: "u1", email: "bruker1@localfix.test" };
});
const getViewer = vi.fn(async () => ({ user: viewerUser, isModerator: false }));
vi.mock("@/lib/supabase/auth", () => ({ requireUser, getViewer }));

const suggest = vi.fn<(text: string) => Promise<unknown>>();
vi.mock("@/lib/ai", () => ({ suggest }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (throwOnCreate) throw new Error("nettverk: hemmelig tekst");
    return {
      from: (table: string) => {
        order.push(`from ${table}`);
        return {
          insert: (row: unknown) => {
            inserted.push(row);
            return { select: async () => result };
          },
        };
      },
    };
  },
}));

const revalidatePath = vi.fn((path: string) => {
  order.push(`revalidatePath ${path}`);
});
vi.mock("next/cache", () => ({ revalidatePath }));

const { createReport, suggestReport } = await import("./actions");

const ID = "20000000-0000-4000-8000-0000000000aa";
const valid = { description: "Hull i veien", location: "Gangveien", category: "roads_sidewalks" };

let errorLog: ReturnType<typeof vi.spyOn>;
let warnLog: ReturnType<typeof vi.spyOn>;
let infoLog: ReturnType<typeof vi.spyOn>;
let plainLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  order.length = 0;
  inserted = [];
  result = { data: [{ id: ID }], error: null };
  throwOnCreate = false;
  signedIn = true;
  viewerUser = { id: "u1", email: "bruker1@localfix.test" };
  getViewer.mockClear();
  suggest.mockReset();
  suggest.mockResolvedValue({ category: "lighting", summary: "Gatelyset er ødelagt" });
  requireUser.mockClear();
  revalidatePath.mockClear();
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  warnLog = vi.spyOn(console, "warn").mockImplementation(() => {});
  infoLog = vi.spyOn(console, "info").mockImplementation(() => {});
  plainLog = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function loggedText(): string {
  return [errorLog, warnLog, infoLog, plainLog]
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map(String).join(" "))
    .join("\n");
}

describe("createReport", () => {
  test("kaller requireUser med /rapporter/ny først, og en besøkende når aldri databasen", async () => {
    signedIn = false;
    await expect(createReport(valid)).rejects.toBe(REDIRECT);
    expect(order).toEqual(["requireUser /rapporter/ny"]);
    expect(inserted).toEqual([]);
  });

  test("setter inn trimmet tekst og kategorien, og gir id-en", async () => {
    const answer = await createReport({
      description: "  Hull i veien  ",
      location: " Gangveien\n",
      category: "roads_sidewalks",
    });
    expect(answer).toEqual({ ok: true, data: { id: ID } });
    expect(inserted).toEqual([valid]);
  });

  test("bare description, location, category og summary sendes til databasen", async () => {
    await createReport({
      ...valid,
      author_id: "10000000-0000-4000-8000-000000000003",
      status: "resolved",
      hidden: true,
      created_at: "2020-01-01",
      status_changed_at: "2020-01-01",
      summary: "x",
      image_path: "y",
    });
    expect(inserted).toEqual([{ ...valid, summary: "x" }]);
    expect(Object.keys(inserted[0] as object).sort()).toEqual([
      "category",
      "description",
      "location",
      "summary",
    ]);
  });

  test("uten oppsummering sendes ingen summary-nøkkel, så den lagres som NULL", async () => {
    await createReport(valid);
    await createReport({ ...valid, summary: "   " });
    await createReport({ ...valid, summary: "" });
    await createReport({ ...valid, summary: undefined });
    expect(inserted).toEqual([valid, valid, valid, valid]);
    for (const row of inserted) expect("summary" in (row as object)).toBe(false);
  });

  test("oppsummeringen trimmes, og nøyaktig 300 tegn godtas", async () => {
    await createReport({ ...valid, summary: "  Hull i veien \n" });
    await createReport({ ...valid, summary: "😀".repeat(300) });
    expect(inserted).toEqual([
      { ...valid, summary: "Hull i veien" },
      { ...valid, summary: "😀".repeat(300) },
    ]);
  });

  test("301 tegn i oppsummeringen gir validation_failed uten databasekall", async () => {
    for (const summary of ["a".repeat(301), "😀".repeat(301)]) {
      expect(await createReport({ ...valid, summary })).toEqual({
        ok: false,
        error: { code: "validation_failed", message: "Sjekk feltene og prøv igjen." },
      });
    }
    expect(inserted).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("databasens 23514 for oppsummeringen gir validation_failed", async () => {
    result = { data: null, error: { code: "23514", message: "check constraint reports_summary_check" } };
    const answer = await createReport({ ...valid, summary: "x" });
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error.code).toBe("validation_failed");
  });

  test("kaller revalidatePath for lista og detaljsiden etter innsettingen", async () => {
    await createReport(valid);
    expect(order).toEqual([
      "requireUser /rapporter/ny",
      "from reports",
      "revalidatePath /",
      `revalidatePath /rapporter/${ID}`,
    ]);
  });

  test("nøyaktig grensen godtas, også med emoji og æøå", async () => {
    const answer = await createReport({
      description: "😀".repeat(1000),
      location: "æøå".repeat(66) + "ab",
      category: "other",
    });
    expect(answer.ok).toBe(true);
    expect(inserted).toHaveLength(1);
  });

  test.each([
    ["1001 tegn beskrivelse", { ...valid, description: "a".repeat(1001) }],
    ["1001 emoji i beskrivelsen", { ...valid, description: "😀".repeat(1001) }],
    ["201 tegn lokasjon", { ...valid, location: "a".repeat(201) }],
    ["bare mellomrom i beskrivelsen", { ...valid, description: "   " }],
    ["bare mellomrom i lokasjonen", { ...valid, location: "   " }],
    ["tom beskrivelse", { ...valid, description: "" }],
    ["ugyldig kategori", { ...valid, category: "Søppel" }],
    ["kategori med feil store bokstaver", { ...valid, category: "WASTE" }],
    ["manglende kategori", { description: "Hull", location: "Vei" }],
    ["ingen objekt", null],
  ])("%s gir validation_failed uten databasekall", async (_name, input) => {
    const answer = await createReport(input);
    expect(answer).toEqual({
      ok: false,
      error: { code: "validation_failed", message: "Sjekk feltene og prøv igjen." },
    });
    expect(inserted).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test.each([
    ["23514", "validation_failed"],
    ["42501", "forbidden"],
    ["23505", "unknown"],
    ["", "unknown"],
    ["XX000", "unknown"],
  ])("databasefeil %j gir koden %s, uten databasetekst og uten revalidering", async (code, expected) => {
    result = {
      data: null,
      error: { code, message: 'new row violates row-level security policy for table "reports"' },
    };
    const answer = await createReport(valid);
    expect(answer.ok).toBe(false);
    if (!answer.ok) {
      expect(answer.error.code).toBe(expected);
      expect(answer.error.message).not.toMatch(/row-level|reports/);
    }
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith("createReport", code || "ukjent");
  });

  test.each([
    ["null", null],
    ["tom liste", []],
    ["to rader", [{ id: ID }, { id: ID }]],
  ])("ingen feil, men %s tilbake gir unknown", async (_name, data) => {
    result = { data: data as { id: string }[] | null, error: null };
    const answer = await createReport(valid);
    expect(answer).toEqual({
      ok: false,
      error: { code: "unknown", message: "Noe gikk galt. Prøv igjen." },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("en feil som kastes gir unknown, uten at teksten logges", async () => {
    throwOnCreate = true;
    const answer = await createReport(valid);
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error.code).toBe("unknown");
    expect(loggedText()).not.toContain("hemmelig");
    expect(errorLog).toHaveBeenCalledWith("createReport", "ukjent");
  });

  test("ingen rapporttekst eller e-post logges, hverken ved suksess eller feil", async () => {
    const secret = {
      description: "Hemmelig beskrivelse 12345",
      location: "Hemmelig sted 67890",
      category: "other",
      summary: "Hemmelig oppsummering 24680",
    };
    await createReport(secret);
    result = { data: null, error: { code: "42501", message: "Hemmelig beskrivelse 12345" } };
    await createReport(secret);
    await createReport({ ...secret, category: "ugyldig" });
    throwOnCreate = true;
    await createReport(secret);

    const text = loggedText();
    expect(text).not.toMatch(/Hemmelig|12345|67890|24680|localfix\.test/);
  });
});

describe("suggestReport", () => {
  test("gir forslaget til en innlogget bruker", async () => {
    const answer = await suggestReport("Gatelyset ved gangveien er ødelagt");
    expect(answer).toEqual({
      ok: true,
      data: { category: "lighting", summary: "Gatelyset er ødelagt" },
    });
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledWith("Gatelyset ved gangveien er ødelagt");
  });

  test("en besøkende får unauthenticated, og adapteren kalles ikke", async () => {
    viewerUser = null;
    expect(await suggestReport("Gatelyset er ødelagt")).toEqual({
      ok: false,
      error: { code: "unauthenticated", message: "Du må logge inn først." },
    });
    expect(suggest).not.toHaveBeenCalled();
  });

  test("ingen forslag fra KI-en gir data: null, ikke en feil", async () => {
    suggest.mockResolvedValue(null);
    expect(await suggestReport("ingenforslag")).toEqual({ ok: true, data: null });
  });

  test("en feil fra KI-en gir data: null, og låsen frigjøres", async () => {
    suggest.mockRejectedValueOnce(new Error("Hemmelig beskrivelse 12345"));
    expect(await suggestReport("Hull i veien")).toEqual({ ok: true, data: null });
    expect(errorLog).toHaveBeenCalledWith("suggestReport", "ukjent");
    expect(loggedText()).not.toMatch(/Hemmelig|12345/);

    // Neste kall fra samme bruker kommer gjennom.
    expect(await suggestReport("Hull i veien")).toEqual({
      ok: true,
      data: { category: "lighting", summary: "Gatelyset er ødelagt" },
    });
  });

  test.each([
    ["tom tekst", ""],
    ["bare mellomrom", "   \n"],
    ["ikke en streng", 42],
    ["null", null],
    ["undefined", undefined],
    ["et objekt", { text: "x" }],
  ])("%s gir data: null uten at adapteren kalles", async (_name, input) => {
    expect(await suggestReport(input)).toEqual({ ok: true, data: null });
    expect(suggest).not.toHaveBeenCalled();
  });

  test("høyst 2000 tegn sendes videre", async () => {
    await suggestReport("a".repeat(2500));
    await suggestReport("😀".repeat(2500));
    expect(suggest.mock.calls[0][0]).toHaveLength(2000);
    expect([...suggest.mock.calls[1][0]]).toHaveLength(2000);
  });

  test("et samtidig kall fra samme bruker gir data: null, og det første påvirkes ikke", async () => {
    let finish: (value: unknown) => void = () => {};
    suggest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    const first = suggestReport("Første tekst");
    await vi.waitFor(() => expect(suggest).toHaveBeenCalledTimes(1));

    expect(await suggestReport("Andre tekst")).toEqual({ ok: true, data: null });
    expect(suggest).toHaveBeenCalledTimes(1);

    finish({ category: "waste", summary: "Boss" });
    expect(await first).toEqual({ ok: true, data: { category: "waste", summary: "Boss" } });

    // Låsen er frigjort.
    expect((await suggestReport("Tredje tekst")).ok).toBe(true);
    expect(suggest).toHaveBeenCalledTimes(2);
  });

  test("låsen er per bruker: en annen bruker kommer gjennom mens den første venter", async () => {
    let finish: (value: unknown) => void = () => {};
    suggest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = suggestReport("Første tekst");
    await vi.waitFor(() => expect(suggest).toHaveBeenCalledTimes(1));

    viewerUser = { id: "u2", email: "bruker2@localfix.test" };
    expect(await suggestReport("Annen bruker")).toEqual({
      ok: true,
      data: { category: "lighting", summary: "Gatelyset er ødelagt" },
    });
    expect(suggest).toHaveBeenCalledTimes(2);

    finish(null);
    expect(await first).toEqual({ ok: true, data: null });
  });

  test("ingen rapporttekst, forslag eller e-post logges", async () => {
    suggest.mockResolvedValueOnce({ category: "other", summary: "Hemmelig oppsummering 24680" });
    await suggestReport("Hemmelig beskrivelse 12345");
    suggest.mockRejectedValueOnce(new Error("Hemmelig beskrivelse 12345"));
    await suggestReport("Hemmelig beskrivelse 12345");
    viewerUser = null;
    await suggestReport("Hemmelig beskrivelse 12345");

    expect(loggedText()).not.toMatch(/Hemmelig|12345|24680|localfix\.test/);
  });
});
