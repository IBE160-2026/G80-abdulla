// Tester listReports (Story 1.4) uten Supabase: spørringen, grensen på 500
// rader og at en databasefeil bare logger feilkoden, aldri rapporttekst.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const calls: { method: string; args: unknown[] }[] = [];
let result: { data: unknown[] | null; error: { code: string; message: string } | null };

// En falsk klient som husker kjeden from → select → order → order → limit.
vi.mock("./server", () => ({
  createClient: async () => {
    const builder = {
      from: (...args: unknown[]) => (calls.push({ method: "from", args }), builder),
      select: (...args: unknown[]) => (calls.push({ method: "select", args }), builder),
      order: (...args: unknown[]) => (calls.push({ method: "order", args }), builder),
      limit: (...args: unknown[]) => {
        calls.push({ method: "limit", args });
        return Promise.resolve(result);
      },
    };
    return builder;
  },
}));

const { LIST_LIMIT, listReports } = await import("./reports");
const { REPORT_COLUMNS } = await import("./types");

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

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
