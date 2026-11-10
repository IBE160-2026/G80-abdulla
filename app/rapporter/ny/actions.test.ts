// Tester createReport (Story 2.2) uten Supabase: at innlogging sjekkes først,
// trimming, grenser, kategori og tom tekst før databasen, at bare de tre
// feltene og en valgfri oppsummering sendes, at både error og antall rader
// sjekkes, feilkodene, revalidatePath og at ingen rapporttekst eller e-post
// logges. Tester også suggestReport (Story 2.3): innloggingen, låsen per bruker,
// 2000 tegn og at ingen tekst eller forslag logges. lib/ai er stubbet.
// Tester også bildet (Story 2.4): stien i brukerens mappe, rekkefølgen
// (behandling, opplasting, INSERT), at en ugyldig fil ikke gir noe Storage-kall,
// at feilet INSERT etter opplasting ikke sletter fila, og at ingen sti eller
// filinnhold logges. Behandlingen er den ekte `prepareImage` med `sharp`.
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { REDIRECT } = vi.hoisted(() => ({ REDIRECT: new Error("NEXT_REDIRECT") }));

const order: string[] = [];
let inserted: unknown[] = [];
let result: {
  data: { id: string }[] | null;
  error: { code: string; message: string } | null;
};
let throwOnCreate = false;
type Upload = {
  path: string;
  bytes: Buffer;
  options: { contentType?: string; upsert?: boolean };
  bucket: string;
};
let uploads: Upload[] = [];
let uploadError: { message: string; statusCode?: string } | null = null;
let removeCalls = 0;
let signedIn = true;
let viewerUser: { id: string; email: string } | null = { id: "u1", email: "bruker1@localfix.test" };

const requireUser = vi.fn(async (returnTo: string) => {
  order.push(`requireUser ${returnTo}`);
  if (!signedIn) throw REDIRECT;
  return { id: "u1", email: "bruker1@localfix.test" };
});
const getViewer = vi.fn(async () => ({ user: viewerUser, isModerator: false }));
vi.mock("@/lib/supabase/auth", () => ({ requireUser, getViewer }));

// Bildebehandlingen er den ekte `prepareImage`, med mindre en test slår på
// sharpUnavailable, som etterligner at sharp ikke lar seg laste på serveren.
const imageProcess = vi.hoisted(() => ({ sharpUnavailable: false }));
vi.mock("@/lib/image-process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/image-process")>();
  return {
    ...actual,
    prepareImage: (file: Blob) =>
      imageProcess.sharpUnavailable
        ? Promise.resolve({ ok: false as const, reason: "unavailable" as const })
        : actual.prepareImage(file),
  };
});

const suggest = vi.fn<(text: string) => Promise<unknown>>();
vi.mock("@/lib/ai", () => ({ suggest }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (throwOnCreate) throw new Error("nettverk: hemmelig tekst");
    return {
      storage: {
        from: (bucket: string) => ({
          upload: async (path: string, bytes: Buffer, options: Upload["options"]) => {
            order.push("upload");
            uploads.push({ path, bytes, options, bucket });
            return uploadError ? { data: null, error: uploadError } : { data: { path }, error: null };
          },
          remove: async () => {
            removeCalls += 1;
            return { data: [], error: null };
          },
        }),
      },
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
  uploads = [];
  uploadError = null;
  removeCalls = 0;
  imageProcess.sharpUnavailable = false;
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

describe("createReport med bilde", () => {
  const jpeg = () =>
    sharp({ create: { width: 40, height: 20, channels: 3, background: "#cc0000" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "59/1 30/1 0/1" } })
      .toBuffer();
  const file = async (name = "bilde.png", type = "image/png") =>
    new File([new Uint8Array(await jpeg())], name, { type });
  const UUID = /^u1\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
  const invalid = {
    ok: false,
    error: { code: "invalid_image", message: expect.stringContaining("Bildet kan ikke brukes") },
  };

  test("laster opp i brukerens mappe med ny uuid, endelse fra innholdet og uten upsert", async () => {
    const answer = await createReport({ ...valid, image: await file() });
    expect(answer).toEqual({ ok: true, data: { id: ID } });
    expect(uploads).toHaveLength(1);
    const [upload] = uploads;
    // Filnavnet bilde.png og typen image/png er ikke med i stien: innholdet er JPEG.
    expect(upload.path).toMatch(UUID);
    expect(upload.bucket).toBe("report-images");
    expect(upload.options).toEqual({ contentType: "image/jpeg", upsert: false });
  });

  test("stien lagres i image_path, og opplastingen kommer før INSERT", async () => {
    await createReport({ ...valid, image: await file() });
    expect(order).toEqual([
      "requireUser /rapporter/ny",
      "upload",
      "from reports",
      "revalidatePath /",
      `revalidatePath /rapporter/${ID}`,
    ]);
    expect(inserted).toEqual([{ ...valid, image_path: uploads[0].path }]);
  });

  test("fila som lastes opp er renset: ingen EXIF, og bildet står riktig vei", async () => {
    await createReport({ ...valid, image: await file() });
    const metadata = await sharp(uploads[0].bytes).metadata();
    expect(metadata.exif).toBeUndefined();
    expect([metadata.width, metadata.height]).toEqual([20, 40]);
  });

  test("hver innsending får en ny uuid", async () => {
    await createReport({ ...valid, image: await file() });
    await createReport({ ...valid, image: await file() });
    expect(uploads[0].path).not.toBe(uploads[1].path);
  });

  test("uten bilde gir ingen Storage-kall og ingen image_path", async () => {
    await createReport(valid);
    await createReport({ ...valid, image: undefined });
    await createReport({ ...valid, image: null });
    expect(uploads).toEqual([]);
    expect(inserted).toEqual([valid, valid, valid]);
  });

  test("image_path fra klienten ignoreres, også sammen med et bilde", async () => {
    await createReport({ ...valid, image_path: "u2/fremmed.jpg", image: await file() });
    expect(inserted).toEqual([{ ...valid, image_path: uploads[0].path }]);
    expect(uploads[0].path).not.toContain("fremmed");
  });

  test.each([
    ["tom fil", () => new File([], "tom.jpg", { type: "image/jpeg" })],
    ["tekst omdøpt til .jpg", () => new File(["ikke et bilde"], "a.jpg", { type: "image/jpeg" })],
    ["en streng", () => "u1/fremmed.jpg"],
    ["et objekt", () => ({ size: 10 })],
    [
      "5 MiB + 1 byte",
      () => new File([new Uint8Array(5 * 1024 * 1024 + 1)], "stor.jpg", { type: "image/jpeg" }),
    ],
  ])("%s gir invalid_image uten Storage-kall og uten INSERT", async (_name, make) => {
    expect(await createReport({ ...valid, image: make() })).toEqual(invalid);
    expect(uploads).toEqual([]);
    expect(inserted).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("tekstfeil går foran bildet: ingen behandling og ingen opplasting", async () => {
    const answer = await createReport({ ...valid, description: "", image: await file() });
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error.code).toBe("validation_failed");
    expect(uploads).toEqual([]);
  });

  test("feiler opplastingen, gir det upload_failed uten INSERT", async () => {
    uploadError = {
      message: "u1/hemmelig.jpg: The object exceeded the maximum allowed size",
      statusCode: "413",
    };
    const answer = await createReport({ ...valid, image: await file() });
    expect(answer).toEqual({
      ok: false,
      error: { code: "upload_failed", message: "Kunne ikke laste opp bildet. Prøv igjen." },
    });
    expect(inserted).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith("createReport", "opplasting_413");
    expect(loggedText()).not.toMatch(/hemmelig|exceeded|u1\//);
  });

  test("feiler INSERT etter opplastingen, går feilen tilbake og fila slettes ikke", async () => {
    result = { data: null, error: { code: "42501", message: "row-level security" } };
    const answer = await createReport({ ...valid, image: await file() });
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error.code).toBe("forbidden");
    expect(uploads).toHaveLength(1);
    expect(removeCalls).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("når sharp ikke kan lastes, gir bildet upload_failed og en rapport uten bilde virker", async () => {
    imageProcess.sharpUnavailable = true;
    const withImage = await createReport({ ...valid, image: await file() });
    expect(withImage).toEqual({
      ok: false,
      error: { code: "upload_failed", message: "Kunne ikke laste opp bildet. Prøv igjen." },
    });
    expect(uploads).toEqual([]);
    expect(inserted).toEqual([]);
    expect(errorLog).toHaveBeenCalledWith("createReport", "bilde_unavailable");

    // Uten bilde er serveren upåvirket.
    expect(await createReport(valid)).toEqual({ ok: true, data: { id: ID } });
    expect(inserted).toEqual([valid]);
  });

  test("ingen sti, filnavn eller bildeinnhold logges", async () => {
    await createReport({ ...valid, image: await file("hemmelig-navn.png") });
    await createReport({ ...valid, image: new File(["hemmelig innhold"], "hemmelig-navn.jpg") });
    uploadError = { message: "hemmelig sti", statusCode: "500" };
    await createReport({ ...valid, image: await file("hemmelig-navn.png") });
    expect(loggedText()).not.toMatch(/hemmelig|u1\/|\.jpg|\.png/);
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
