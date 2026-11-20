// Tester setReportStatus (Story 4.1) uten Supabase: at innlogging sjekkes
// først, valideringen av id og statuser, at oppdateringen sender bare status og
// har både id og fra-status i WHERE, at både error og antall rader sjekkes, at
// null rader gir report_not_found eller stale_state etter et nytt oppslag,
// oversettingen av 42501 og P0001, revalidatePath og at ingen tekst fra
// databasen, rapport eller e-post logges.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { REDIRECT } = vi.hoisted(() => ({ REDIRECT: new Error("NEXT_REDIRECT") }));

type DbError = { code: string; message: string };
type Changed = { status: string; status_changed_at: string };

const order: string[] = [];
let updates: unknown[] = [];
let signedIn = true;
let throwOnCreate = false;
let throwOnUpdate = false;
let updateResult: { data: Changed[] | null; error: DbError | null };
let readResult: { data: { id: string } | null; error: DbError | null };

const requireUser = vi.fn(async (returnTo: string) => {
  order.push(`requireUser ${returnTo}`);
  if (!signedIn) throw REDIRECT;
  return { id: "m1", email: "moderator@localfix.test" };
});
vi.mock("@/shared/supabase/auth", () => ({ requireUser }));

vi.mock("@/shared/supabase/server", () => ({
  createClient: async () => {
    if (throwOnCreate) throw new Error("nettverk: hemmelig tekst");
    return {
      from: (table: string) => {
        order.push(`from ${table}`);
        return {
          update: (row: unknown) => {
            if (throwOnUpdate) throw new Error("nettverk: hemmelig tekst");
            updates.push(row);
            order.push("update");
            const chain = {
              eq: (column: string, value: string) => {
                order.push(`eq ${column} ${value}`);
                return chain;
              },
              select: async (columns: string) => {
                order.push(`select ${columns}`);
                return updateResult;
              },
            };
            return chain;
          },
          select: (columns: string) => {
            order.push(`select ${columns}`);
            return {
              eq: (column: string, value: string) => {
                order.push(`eq ${column} ${value}`);
                return {
                  maybeSingle: async () => {
                    order.push("les raden");
                    return readResult;
                  },
                };
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

const { setReportStatus } = await import("./actions");

const ID = "20000000-0000-4000-8000-000000000004";
const CHANGED: Changed = { status: "in_progress", status_changed_at: "2026-11-20T12:00:00+00:00" };

let errorLog: ReturnType<typeof vi.spyOn>;
let otherLogs: ReturnType<typeof vi.spyOn>[];

beforeEach(() => {
  order.length = 0;
  updates = [];
  signedIn = true;
  throwOnCreate = false;
  throwOnUpdate = false;
  updateResult = { data: [CHANGED], error: null };
  readResult = { data: { id: ID }, error: null };
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

const code = (answer: Awaited<ReturnType<typeof setReportStatus>>) =>
  answer.ok ? null : answer.error.code;

describe("setReportStatus", () => {
  test("kaller requireUser med detaljsiden først, og en besøkende når aldri databasen", async () => {
    signedIn = false;
    await expect(setReportStatus(ID, "new", "in_progress")).rejects.toBe(REDIRECT);
    expect(order).toEqual([`requireUser /rapporter/${ID}`]);
    expect(updates).toEqual([]);
  });

  test("en besøkende med en ugyldig id sendes til lista, uten databasekall", async () => {
    signedIn = false;
    await expect(setReportStatus("abc", "new", "in_progress")).rejects.toBe(REDIRECT);
    expect(order).toEqual(["requireUser /"]);
  });

  test.each(["abc", "123", "", ID + "0", null, undefined, 42, { id: ID }, [ID]])(
    "ugyldig id %j gir validation_failed uten databasekall",
    async (value) => {
      const answer = await setReportStatus(value, "new", "in_progress");
      expect(answer).toEqual({
        ok: false,
        error: { code: "validation_failed", message: "Sjekk feltene og prøv igjen." },
      });
      expect(order.filter((step) => step.startsWith("from"))).toEqual([]);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["ukjent fra-status", "done", "in_progress"],
    ["ukjent til-status", "new", "closed"],
    ["tom til-status", "new", ""],
    ["til-status mangler", "new", undefined],
    ["fra-status er ikke tekst", 1, "in_progress"],
    ["visningsnavnet i stedet for koden", "Ny", "Under behandling"],
  ])("%s gir validation_failed uten databasekall", async (_name, from, to) => {
    const answer = await setReportStatus(ID, from, to);
    expect(code(answer)).toBe("validation_failed");
    expect(order.filter((step) => step.startsWith("from"))).toEqual([]);
  });

  test("en endring sender bare status, med id og fra-status i WHERE, og revaliderer", async () => {
    const answer = await setReportStatus(ID, "new", "in_progress");
    expect(answer).toEqual({ ok: true, data: CHANGED });
    expect(updates).toEqual([{ status: "in_progress" }]);
    expect(order).toEqual([
      `requireUser /rapporter/${ID}`,
      "from reports",
      "update",
      `eq id ${ID}`,
      "eq status new",
      "select status, status_changed_at",
      "revalidatePath /",
      `revalidatePath /rapporter/${ID}`,
    ]);
  });

  test("store bokstaver i id-en sendes med små", async () => {
    await setReportStatus(ID.toUpperCase(), "in_progress", "resolved");
    expect(order).toContain(`eq id ${ID}`);
    expect(order[0]).toBe(`requireUser /rapporter/${ID}`);
  });

  test("hoppet sjekkes av databasen, ikke her: P0001 invalid_status_step gir den koden", async () => {
    updateResult = { data: null, error: { code: "P0001", message: "invalid_status_step" } };
    const answer = await setReportStatus(ID, "new", "resolved");
    expect(updates).toEqual([{ status: "resolved" }]);
    expect(answer).toEqual({
      ok: false,
      error: { code: "invalid_status_step", message: "Statusen kan ikke endres til dette valget." },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("42501 (ikke moderator) gir forbidden med «Du har ikke tilgang til dette.»", async () => {
    updateResult = { data: null, error: { code: "42501", message: "hemmelig databasetekst" } };
    const answer = await setReportStatus(ID, "new", "in_progress");
    expect(answer).toEqual({
      ok: false,
      error: { code: "forbidden", message: "Du har ikke tilgang til dette." },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("andre databasefeil gir unknown", async () => {
    updateResult = { data: null, error: { code: "08006", message: "hemmelig databasetekst" } };
    expect(code(await setReportStatus(ID, "new", "in_progress"))).toBe("unknown");
    updateResult = { data: null, error: { code: "P0001", message: "hemmelig databasetekst" } };
    expect(code(await setReportStatus(ID, "new", "in_progress"))).toBe("unknown");
  });

  test("null rader på en rad som finnes gir stale_state og revalidering", async () => {
    updateResult = { data: [], error: null };
    const answer = await setReportStatus(ID, "new", "in_progress");
    expect(answer).toEqual({
      ok: false,
      error: {
        code: "stale_state",
        message: "Rapporten er endret. Last siden på nytt og prøv igjen.",
      },
    });
    expect(order).toEqual([
      `requireUser /rapporter/${ID}`,
      "from reports",
      "update",
      `eq id ${ID}`,
      "eq status new",
      "select status, status_changed_at",
      "from reports",
      "select id",
      `eq id ${ID}`,
      "les raden",
      "revalidatePath /",
      `revalidatePath /rapporter/${ID}`,
    ]);
  });

  test("null rader og ingen rad gir report_not_found, uten revalidering", async () => {
    updateResult = { data: [], error: null };
    readResult = { data: null, error: null };
    const answer = await setReportStatus(ID, "new", "in_progress");
    expect(answer).toEqual({
      ok: false,
      error: { code: "report_not_found", message: "Fant ikke rapporten." },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("feil ved oppslaget etter null rader gir en feilkode", async () => {
    updateResult = { data: [], error: null };
    readResult = { data: null, error: { code: "XX000", message: "hemmelig databasetekst" } };
    expect(code(await setReportStatus(ID, "new", "in_progress"))).toBe("unknown");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("uten svar eller med flere rader gir unknown, selv uten error", async () => {
    updateResult = { data: null, error: null };
    expect(code(await setReportStatus(ID, "new", "in_progress"))).toBe("unknown");
    updateResult = { data: [CHANGED, CHANGED], error: null };
    expect(code(await setReportStatus(ID, "new", "in_progress"))).toBe("unknown");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("et kast gir unknown, og meldingen logges ikke", async () => {
    throwOnCreate = true;
    expect(await setReportStatus(ID, "new", "in_progress")).toEqual({
      ok: false,
      error: { code: "unknown", message: "Noe gikk galt. Prøv igjen." },
    });
    throwOnCreate = false;
    throwOnUpdate = true;
    expect(code(await setReportStatus(ID, "new", "in_progress"))).toBe("unknown");
    expect(loggedText()).not.toContain("hemmelig");
  });

  test("bare feilkoden logges, med setReportStatus foran, aldri databasetekst eller e-post", async () => {
    updateResult = { data: null, error: { code: "08006", message: "hemmelig databasetekst" } };
    await setReportStatus(ID, "new", "in_progress");
    expect(errorLog).toHaveBeenCalledExactlyOnceWith("setReportStatus", "08006");
    expect(loggedText()).not.toMatch(/hemmelig|localfix\.test/);
  });
});
