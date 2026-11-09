// Tester listReports (Story 1.4) og getReport (Story 1.5) uten Supabase:
// spørringene, grensen på 500 rader, at en manglende rad gir null og at en
// databasefeil bare logger feilkoden, aldri rapporttekst.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const calls: { method: string; args: unknown[] }[] = [];
let result: {
  data: unknown;
  error: { code: string; message: string } | null;
};

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

const { LIST_LIMIT, getReport, listReports } = await import("./reports");
const { REPORT_COLUMNS } = await import("./types");

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

const ID = "20000000-0000-4000-8000-000000000002";

beforeEach(() => {
  calls.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listReports", () => {
  test("leser visningen med REPORT_COLUMNS, nyeste først, og høyst 500 rader", async () => {
    result = { data: rows(8), error: null };
    await listReports();
    expect(calls).toEqual([
      { method: "from", args: ["reports_with_counts"] },
      { method: "select", args: [REPORT_COLUMNS] },
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
  test("leser én rad fra visningen med REPORT_COLUMNS, uten å filtrere på hidden", async () => {
    const row = { id: ID, description: "Slukkede gatelys" };
    result = { data: row, error: null };
    await expect(getReport(ID)).resolves.toEqual(row);
    expect(calls).toEqual([
      { method: "from", args: ["reports_with_counts"] },
      { method: "select", args: [REPORT_COLUMNS] },
      { method: "eq", args: ["id", ID] },
      { method: "maybeSingle", args: [] },
    ]);
  });

  test("gir null når raden mangler eller RLS skjuler den", async () => {
    result = { data: null, error: null };
    await expect(getReport(ID)).resolves.toBeNull();
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
