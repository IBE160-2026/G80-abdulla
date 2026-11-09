// Tester listReports (Story 1.4) og getReport (Story 1.5) uten Supabase:
// spørringene, grensen på 500 rader, at en manglende rad gir null og at en
// databasefeil bare logger feilkoden, aldri rapporttekst. Fra Story 1.7 leses
// image_path i tillegg, men den blir aldri med i resultatet: den gjøres om til
// has_image, og getReport signerer bildet bare når raden finnes og har bilde.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const calls: { method: string; args: unknown[] }[] = [];
let result: {
  data: unknown;
  error: { code: string; message: string } | null;
};
const signReportImage = vi.fn();

// En falsk klient som husker kjeden: from → select → order → order → limit
// for lista og from → select → eq → maybeSingle for én rapport.
vi.mock("./server", () => ({
  createClient: async () => {
    const chain = (method: string) => (...args: unknown[]): unknown => {
      calls.push({ method, args });
      return builder;
    };
    const end = (method: string) => (...args: unknown[]) => {
      calls.push({ method, args });
      return Promise.resolve(result);
    };
    const builder = {
      from: chain("from"),
      select: chain("select"),
      order: chain("order"),
      eq: chain("eq"),
      limit: end("limit"),
      maybeSingle: end("maybeSingle"),
    };
    return builder;
  },
}));

// Signeringen testes i images.test.ts.
vi.mock("./images", () => ({ signReportImage }));

const { LIST_LIMIT, getReport, listReports } = await import("./reports");
const { REPORT_COLUMNS } = await import("./types");

const SERVER_COLUMNS = `${REPORT_COLUMNS}, image_path`;

const ID = "20000000-0000-4000-8000-000000000002";
const IMAGE_PATH =
  "10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000002.jpg";
const SIGNED_URL =
  "http://127.0.0.1:54321/storage/v1/object/sign/report-images/x.jpg?token=t";

/** Raden slik serveren leser den: REPORT_COLUMNS og image_path. */
function row(id: string, image_path: string | null = null) {
  return {
    id,
    description: "Slukkede gatelys",
    location: "Gangveien",
    category: "lighting",
    summary: null,
    status: "new",
    hidden: false,
    created_at: "2026-10-21T17:40:00+00:00",
    status_changed_at: "2026-10-21T17:40:00+00:00",
    confirmation_count: 2,
    seen_count: 3,
    confirmed_by_me: false,
    authored_by_me: false,
    image_path,
  };
}

/** Rapporten komponentene får: uten image_path, med has_image. */
function report(id: string, has_image: boolean) {
  const { image_path, ...rest } = row(id);
  void image_path;
  return { ...rest, has_image };
}

const rows = (n: number) => Array.from({ length: n }, (_, i) => row(String(i)));

beforeEach(() => {
  calls.length = 0;
  signReportImage.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listReports", () => {
  test("leser visningen med REPORT_COLUMNS og image_path, nyeste først, og høyst 500 rader", async () => {
    result = { data: rows(8), error: null };
    await listReports();
    expect(calls).toEqual([
      { method: "from", args: ["reports_with_counts"] },
      { method: "select", args: [SERVER_COLUMNS] },
      { method: "order", args: ["created_at", { ascending: false }] },
      { method: "order", args: ["id", { ascending: false }] },
      { method: "limit", args: [500] },
    ]);
    expect(LIST_LIMIT).toBe(500);
  });

  test.each([
    [0, false],
    [8, false],
    [499, false],
    [500, true],
  ])("%i rader gir truncated = %s", async (count, truncated) => {
    result = { data: rows(count), error: null };
    const list = await listReports();
    expect(list.reports).toHaveLength(count);
    expect(list.truncated).toBe(truncated);
  });

  test("regner ut has_image, sender aldri image_path videre og signerer ingen bilder", async () => {
    result = { data: [row("a", IMAGE_PATH), row("b")], error: null };
    const { reports } = await listReports();
    expect(reports).toEqual([report("a", true), report("b", false)]);
    for (const r of reports) expect(r).not.toHaveProperty("image_path");
    expect(JSON.stringify(reports)).not.toContain(IMAGE_PATH);
    expect(signReportImage).not.toHaveBeenCalled();
  });

  test("tar bare med feltene i Report, også når raden har flere", async () => {
    result = {
      data: [{ ...row("a"), author_id: "10000000-0000-4000-8000-000000000002" }],
      error: null,
    };
    const { reports } = await listReports();
    expect(reports).toEqual([report("a", false)]);
  });

  test("en databasefeil logger bare feilkoden og kastes videre", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    result = {
      data: null,
      error: { code: "PGRST000", message: "Hemmelig rapporttekst i feilen" },
    };
    await expect(listReports()).rejects.toThrow("PGRST000");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("PGRST000");
    expect(JSON.stringify(log.mock.calls)).not.toContain("Hemmelig");
  });

  test("en nettverksfeil uten feilkode logger og kaster «ukjent»", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    // postgrest-js gir code "" når fetch feiler.
    result = {
      data: null,
      error: { code: "", message: "TypeError: fetch failed" },
    };
    await expect(listReports()).rejects.toThrow(
      "Kunne ikke hente rapportene (ukjent).",
    );
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("ukjent");
  });
});

describe("getReport", () => {
  test("leser én rad fra visningen med REPORT_COLUMNS og image_path, uten å filtrere på hidden", async () => {
    result = { data: row(ID), error: null };
    await expect(getReport(ID)).resolves.toEqual({
      report: report(ID, false),
      imageUrl: null,
    });
    expect(calls).toEqual([
      { method: "from", args: ["reports_with_counts"] },
      { method: "select", args: [SERVER_COLUMNS] },
      { method: "eq", args: ["id", ID] },
      { method: "maybeSingle", args: [] },
    ]);
  });

  test("en rapport uten bilde signerer ingenting", async () => {
    result = { data: row(ID), error: null };
    const found = await getReport(ID);
    expect(found?.report.has_image).toBe(false);
    expect(found?.imageUrl).toBeNull();
    expect(signReportImage).not.toHaveBeenCalled();
  });

  test("en rapport med bilde får én signert lenke etter at raden er lest, og ingen bildesti", async () => {
    result = { data: row(ID, IMAGE_PATH), error: null };
    signReportImage.mockImplementation(async () => {
      // Raden er allerede lest under RLS når lenken lages (AD-6).
      expect(calls.at(-1)?.method).toBe("maybeSingle");
      return SIGNED_URL;
    });
    const found = await getReport(ID);
    expect(found).toEqual({ report: report(ID, true), imageUrl: SIGNED_URL });
    expect(signReportImage).toHaveBeenCalledExactlyOnceWith(IMAGE_PATH);
    expect(found?.report).not.toHaveProperty("image_path");
    expect(JSON.stringify(found)).not.toContain(IMAGE_PATH);
  });

  test("når lenken ikke kan lages, gir den rapporten uten bilde", async () => {
    result = { data: row(ID, IMAGE_PATH), error: null };
    signReportImage.mockResolvedValue(null);
    await expect(getReport(ID)).resolves.toEqual({
      report: report(ID, true),
      imageUrl: null,
    });
  });

  test("gir null og signerer ingenting når raden mangler eller RLS skjuler den", async () => {
    result = { data: null, error: null };
    await expect(getReport(ID)).resolves.toBeNull();
    expect(signReportImage).not.toHaveBeenCalled();
  });

  test("en databasefeil logger bare feilkoden og kastes videre", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    result = {
      data: null,
      error: { code: "22P02", message: "Hemmelig rapporttekst i feilen" },
    };
    await expect(getReport(ID)).rejects.toThrow(
      "Kunne ikke hente rapporten (22P02).",
    );
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("22P02");
    expect(JSON.stringify(log.mock.calls)).not.toContain("Hemmelig");
    expect(signReportImage).not.toHaveBeenCalled();
  });

  test("en nettverksfeil uten feilkode logger og kaster «ukjent»", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    result = {
      data: null,
      error: { code: "", message: "TypeError: fetch failed" },
    };
    await expect(getReport(ID)).rejects.toThrow(
      "Kunne ikke hente rapporten (ukjent).",
    );
    expect(log).toHaveBeenCalledWith("ukjent");
  });
});
