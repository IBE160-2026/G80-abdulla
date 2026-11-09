// Tester getViewer og requireUser (Story 2.1, AD-3) uten Supabase: en
// besøkende, en vanlig bruker, moderatoren, at en feil i profiloppslaget gir
// isModerator = false uten å logge e-postadressen, og at requireUser sender en
// besøkende til innloggingen med kodet next.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { cacheSpy, REDIRECT } = vi.hoisted(() => ({
  cacheSpy: vi.fn(<T>(fn: T) => fn),
  REDIRECT: new Error("NEXT_REDIRECT"),
}));

const calls: { method: string; args: unknown[] }[] = [];
let user: { id: string; email?: string } | null;
let profile: { data: unknown; error: { code: string; message: string } | null };

// En falsk serverklient: auth.getUser() og
// from("profiles").select("role").eq("id", id).maybeSingle().
vi.mock("./server", () => ({
  createClient: async () => {
    const chain = (method: string) => (...args: unknown[]): unknown => {
      calls.push({ method, args });
      return builder;
    };
    const builder = {
      auth: {
        getUser: async () => {
          calls.push({ method: "getUser", args: [] });
          return { data: { user }, error: null };
        },
      },
      from: chain("from"),
      select: chain("select"),
      eq: chain("eq"),
      maybeSingle: async () => {
        calls.push({ method: "maybeSingle", args: [] });
        return profile;
      },
    };
    return builder;
  },
}));

const redirect = vi.fn((url: string) => {
  void url;
  throw REDIRECT;
});
vi.mock("next/navigation", () => ({ redirect }));

// cache() er en ren videresending her, så hvert kall går til klienten. Spionen
// viser at getViewer er pakket i cache().
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: cacheSpy,
}));

const { getViewer, requireUser } = await import("./auth");
// Leses rett etter importen, før kallhistorikken til spionene nullstilles.
const cached = cacheSpy.mock.results.map((result) => result.value);

const USER_ID = "10000000-0000-4000-8000-000000000002";
const EMAIL = "bruker1@localfix.test";

beforeEach(() => {
  calls.length = 0;
  redirect.mockClear();
  user = null;
  profile = { data: null, error: null };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getViewer", () => {
  test("er pakket i Reacts cache()", () => {
    expect(cached).toEqual([getViewer]);
  });

  test("en besøkende gir user = null og slår ikke opp profilen", async () => {
    await expect(getViewer()).resolves.toEqual({ user: null, isModerator: false });
    expect(calls).toEqual([{ method: "getUser", args: [] }]);
  });

  test("en vanlig bruker gir id og e-post og isModerator = false", async () => {
    user = { id: USER_ID, email: EMAIL };
    profile = { data: { role: "user" }, error: null };
    await expect(getViewer()).resolves.toEqual({
      user: { id: USER_ID, email: EMAIL },
      isModerator: false,
    });
    expect(calls).toEqual([
      { method: "getUser", args: [] },
      { method: "from", args: ["profiles"] },
      { method: "select", args: ["role"] },
      { method: "eq", args: ["id", USER_ID] },
      { method: "maybeSingle", args: [] },
    ]);
  });

  test("moderatoren gir isModerator = true", async () => {
    user = { id: USER_ID, email: "moderator@localfix.test" };
    profile = { data: { role: "moderator" }, error: null };
    await expect(getViewer()).resolves.toEqual({
      user: { id: USER_ID, email: "moderator@localfix.test" },
      isModerator: true,
    });
  });

  test("gir bare id og e-post, ikke resten av brukerobjektet", async () => {
    user = {
      id: USER_ID,
      email: EMAIL,
      ...{ user_metadata: { role: "moderator" }, app_metadata: { role: "moderator" } },
    };
    profile = { data: { role: "user" }, error: null };
    const viewer = await getViewer();
    expect(viewer).toEqual({ user: { id: USER_ID, email: EMAIL }, isModerator: false });
  });

  test("en feil i profiloppslaget gir isModerator = false og logger bare feilkoden", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    user = { id: USER_ID, email: EMAIL };
    profile = {
      data: { role: "moderator" },
      error: { code: "PGRST000", message: `feil for ${EMAIL}` },
    };
    await expect(getViewer()).resolves.toEqual({
      user: { id: USER_ID, email: EMAIL },
      isModerator: false,
    });
    expect(log).toHaveBeenCalledExactlyOnceWith("Kunne ikke lese rollen (PGRST000).");
    expect(JSON.stringify(log.mock.calls)).not.toContain(EMAIL);
  });

  test("en manglende profilrad gir isModerator = false", async () => {
    user = { id: USER_ID, email: EMAIL };
    profile = { data: null, error: null };
    await expect(getViewer()).resolves.toMatchObject({ isModerator: false });
  });
});

describe("requireUser", () => {
  test("gir brukeren når hen er innlogget", async () => {
    user = { id: USER_ID, email: EMAIL };
    profile = { data: { role: "user" }, error: null };
    await expect(requireUser("/rapporter/ny")).resolves.toEqual({
      id: USER_ID,
      email: EMAIL,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  test("sender en besøkende til innloggingen med kodet next", async () => {
    await expect(requireUser("/rapporter/ny?category=waste&x=1")).rejects.toBe(REDIRECT);
    expect(redirect).toHaveBeenCalledExactlyOnceWith(
      "/auth/login?next=%2Frapporter%2Fny%3Fcategory%3Dwaste%26x%3D1",
    );
  });
});
