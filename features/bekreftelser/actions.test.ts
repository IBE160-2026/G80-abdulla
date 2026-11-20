// Tester confirmReport (Story 3.3) uten Supabase: at innlogging sjekkes først,
// uuid-valideringen, leseren som gir riktig feilkode (ingen rad, skjult, egen
// rapport, allerede bekreftet), at bare `report_id` sendes, at både error og
// antall rader sjekkes, `42501` og `23505` fra databasen, at svaret leses fra
// visningen etterpå, revalidatePath og at ingen tekst fra databasen, rapport
// eller e-post logges.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { REDIRECT } = vi.hoisted(() => ({ REDIRECT: new Error("NEXT_REDIRECT") }));

type Row = { id: string; hidden: boolean; authored_by_me: boolean; confirmed_by_me: boolean };
type DbError = { code: string; message: string };

const order: string[] = [];
let inserted: unknown[] = [];
let signedIn = true;
let throwOnCreate = false;
let throwOnInsert = false;
let readResult: { data: Row | null; error: DbError | null };
let insertResult: { data: { report_id: string }[] | null; error: DbError | null };
let countResult: {
  data: { seen_count: number; confirmed_by_me: boolean } | null;
  error: DbError | null;
};

const requireUser = vi.fn(async (returnTo: string) => {
  order.push(`requireUser ${returnTo}`);
  if (!signedIn) throw REDIRECT;
  return { id: "u1", email: "bruker2@localfix.test" };
});
vi.mock("@/shared/supabase/auth", () => ({ requireUser }));

vi.mock("@/shared/supabase/server", () => ({
  createClient: async () => {
    if (throwOnCreate) throw new Error("nettverk: hemmelig tekst");
    return {
      from: (table: string) => {
        order.push(`from ${table}`);
        return {
          select: (columns: string) => {
            order.push(`select ${columns}`);
            return {
              eq: (column: string, value: string) => {
                order.push(`eq ${column} ${value}`);
                return {
                  maybeSingle: async () => {
                    const isRead = columns.includes("hidden");
                    order.push(isRead ? "les raden" : "les tallene");
                    return isRead ? readResult : countResult;
                  },
                };
              },
            };
          },
          insert: (row: unknown) => {
            if (throwOnInsert) throw new Error("nettverk: hemmelig tekst");
            inserted.push(row);
            order.push("insert");
            return {
              select: async (columns: string) => {
                order.push(`select ${columns}`);
                return insertResult;
              },
            };
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

const { confirmReport } = await import("./actions");

const ID = "20000000-0000-4000-8000-000000000002";
const OPEN: Row = { id: ID, hidden: false, authored_by_me: false, confirmed_by_me: false };

let errorLog: ReturnType<typeof vi.spyOn>;
let otherLogs: ReturnType<typeof vi.spyOn>[];

beforeEach(() => {
  order.length = 0;
  inserted = [];
  signedIn = true;
  throwOnCreate = false;
  throwOnInsert = false;
  readResult = { data: OPEN, error: null };
  insertResult = { data: [{ report_id: ID }], error: null };
  countResult = { data: { seen_count: 3, confirmed_by_me: true }, error: null };
  requireUser.mockClear();
  revalidatePath.mockClear();
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  otherLogs = (["warn", "info", "log"] as const).map((level) =>
    vi.spyOn(console, level).mockImplementation(() => {}),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function loggedText(): string {
  return [errorLog, ...otherLogs]
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map(String).join(" "))
    .join("\n");
}

describe("confirmReport", () => {
  test("kaller requireUser med detaljsiden først, og en besøkende når aldri databasen", async () => {
    signedIn = false;
    await expect(confirmReport(ID)).rejects.toBe(REDIRECT);
    expect(order).toEqual([`requireUser /rapporter/${ID}`]);
    expect(inserted).toEqual([]);
  });

  test("en besøkende med en ugyldig id sendes til lista, uten databasekall", async () => {
    signedIn = false;
    await expect(confirmReport("abc")).rejects.toBe(REDIRECT);
    expect(order).toEqual(["requireUser /"]);
  });

  test.each(["abc", "123", "", ID + "0", null, undefined, 42, { id: ID }, [ID]])(
    "ugyldig id %j gir validation_failed uten databasekall",
    async (value) => {
      const answer = await confirmReport(value);
      expect(answer).toEqual({
        ok: false,
        error: { code: "validation_failed", message: "Sjekk feltene og prøv igjen." },
      });
      expect(order.filter((step) => step.startsWith("from"))).toEqual([]);
      expect(inserted).toEqual([]);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  test("en bekreftelse leser raden først, setter inn bare report_id og leser tallene etterpå", async () => {
    const answer = await confirmReport(ID);
    expect(answer).toEqual({ ok: true, data: { seen_count: 3, confirmed_by_me: true } });
    expect(inserted).toEqual([{ report_id: ID }]);
    expect(Object.keys(inserted[0] as object)).toEqual(["report_id"]);
    expect(order).toEqual([
      `requireUser /rapporter/${ID}`,
      "from reports_with_counts",
      "select id, hidden, authored_by_me, confirmed_by_me",
      `eq id ${ID}`,
      "les raden",
      "from confirmations",
      "insert",
      "select report_id",
      `revalidatePath /`,
      `revalidatePath /rapporter/${ID}`,
      "from reports_with_counts",
      "select seen_count, confirmed_by_me",
      `eq id ${ID}`,
      "les tallene",
    ]);
  });

  test("store bokstaver i id-en leses og settes inn med små", async () => {
    await confirmReport(ID.toUpperCase());
    expect(inserted).toEqual([{ report_id: ID }]);
    expect(order[0]).toBe(`requireUser /rapporter/${ID}`);
  });

  test.each([
    ["ingen rad (også en skjult rapport for en vanlig bruker)", null, "report_not_found"],
    ["skjult rapport (moderatoren ser den)", { ...OPEN, hidden: true }, "forbidden"],
    ["egen rapport", { ...OPEN, authored_by_me: true }, "own_report"],
    ["allerede bekreftet", { ...OPEN, confirmed_by_me: true }, "already_confirmed"],
  ] as const)("%s gir %s uten INSERT", async (_name, row, code) => {
    readResult = { data: row, error: null };
    const answer = await confirmReport(ID);
    expect(answer.ok).toBe(false);
    expect(!answer.ok && answer.error.code).toBe(code);
    expect(inserted).toEqual([]);
  });

  test("skjult og egen rapport sjekkes før allerede bekreftet", async () => {
    readResult = {
      data: { ...OPEN, hidden: true, authored_by_me: true, confirmed_by_me: true },
      error: null,
    };
    const answer = await confirmReport(ID);
    expect(!answer.ok && answer.error.code).toBe("forbidden");
    readResult = { data: { ...OPEN, authored_by_me: true, confirmed_by_me: true }, error: null };
    const own = await confirmReport(ID);
    expect(!own.ok && own.error.code).toBe("own_report");
  });

  test("allerede bekreftet revalideres, så siden viser «Du har sett dette ✓»", async () => {
    readResult = { data: { ...OPEN, confirmed_by_me: true }, error: null };
    await confirmReport(ID);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/rapporter/${ID}`);
  });

  test("de andre feilsvarene revalideres ikke", async () => {
    for (const row of [null, { ...OPEN, hidden: true }, { ...OPEN, authored_by_me: true }]) {
      readResult = { data: row, error: null };
      await confirmReport(ID);
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("feil ved lesingen av raden gir en feilkode, uten INSERT", async () => {
    readResult = { data: null, error: { code: "42501", message: "hemmelig databasetekst" } };
    const answer = await confirmReport(ID);
    expect(!answer.ok && answer.error.code).toBe("forbidden");
    readResult = { data: null, error: { code: "XX000", message: "hemmelig databasetekst" } };
    const unknown = await confirmReport(ID);
    expect(!unknown.ok && unknown.error.code).toBe("unknown");
    expect(inserted).toEqual([]);
  });

  test("42501 fra INSERT gir forbidden, uten revalidering", async () => {
    insertResult = { data: null, error: { code: "42501", message: "hemmelig databasetekst" } };
    const answer = await confirmReport(ID);
    expect(answer).toEqual({
      ok: false,
      error: { code: "forbidden", message: "Du har ikke lov til å gjøre dette." },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("23505 fra INSERT gir already_confirmed og revalidering", async () => {
    insertResult = { data: null, error: { code: "23505", message: "hemmelig databasetekst" } };
    const answer = await confirmReport(ID);
    expect(answer).toEqual({
      ok: false,
      error: { code: "already_confirmed", message: "Du har allerede bekreftet denne rapporten." },
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/rapporter/${ID}`);
  });

  test("andre databasefeil gir unknown", async () => {
    insertResult = { data: null, error: { code: "08006", message: "hemmelig databasetekst" } };
    const answer = await confirmReport(ID);
    expect(!answer.ok && answer.error.code).toBe("unknown");
  });

  test("ingen rad tilbake fra INSERT gir unknown, selv uten error", async () => {
    insertResult = { data: [], error: null };
    const none = await confirmReport(ID);
    expect(!none.ok && none.error.code).toBe("unknown");
    insertResult = { data: null, error: null };
    const missing = await confirmReport(ID);
    expect(!missing.ok && missing.error.code).toBe("unknown");
    insertResult = { data: [{ report_id: ID }, { report_id: ID }], error: null };
    const two = await confirmReport(ID);
    expect(!two.ok && two.error.code).toBe("unknown");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("tallene leses fra visningen: svaret har serverens seen_count", async () => {
    countResult = { data: { seen_count: 7, confirmed_by_me: true }, error: null };
    expect(await confirmReport(ID)).toEqual({
      ok: true,
      data: { seen_count: 7, confirmed_by_me: true },
    });
  });

  test("lagret bekreftelse, men feil ved lesingen av tallene: unknown, og siden er revalidert", async () => {
    countResult = { data: null, error: { code: "XX000", message: "hemmelig databasetekst" } };
    const answer = await confirmReport(ID);
    expect(!answer.ok && answer.error.code).toBe("unknown");
    expect(revalidatePath).toHaveBeenCalledWith(`/rapporter/${ID}`);
    countResult = { data: null, error: null };
    const none = await confirmReport(ID);
    expect(!none.ok && none.error.code).toBe("unknown");
  });

  test("et kast gir unknown, og meldingen logges ikke", async () => {
    throwOnCreate = true;
    const answer = await confirmReport(ID);
    expect(answer).toEqual({
      ok: false,
      error: { code: "unknown", message: "Noe gikk galt. Prøv igjen." },
    });
    throwOnCreate = false;
    throwOnInsert = true;
    const insertThrew = await confirmReport(ID);
    expect(!insertThrew.ok && insertThrew.error.code).toBe("unknown");
    expect(loggedText()).not.toContain("hemmelig");
  });

  test("bare feilkoden logges, med confirmReport foran, aldri databasetekst eller e-post", async () => {
    insertResult = { data: null, error: { code: "08006", message: "hemmelig databasetekst" } };
    await confirmReport(ID);
    expect(errorLog).toHaveBeenCalledExactlyOnceWith("confirmReport", "08006");
    expect(loggedText()).not.toMatch(/hemmelig|localfix\.test/);
  });
});
