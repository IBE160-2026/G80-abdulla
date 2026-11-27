// Tester `getViewer` og `requireUser` mot den ekte Supabase-klienten (auth-js)
// når Auth ikke svarer eller svarer med feil (testhull-code-review-gruppe-a,
// deferred-work.md). Bare fetch og lagring er falske. `getUser()` kaster ikke
// ved nettverksfeil eller 5xx: `auth-js` gir dem som data (`AuthRetryableFetchError`),
// og `getViewer` gir da en besøkende, ikke feilsiden. Testen låser dette, så en
// oppgradering av `auth-js` som begynte å kaste, ville feilet her og ikke i
// produksjon. Beslutningen 2026-11-27: ingen try/catch i `getViewer`.
import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, test, vi } from "vitest";

const { REDIRECT } = vi.hoisted(() => ({ REDIRECT: new Error("NEXT_REDIRECT") }));

const redirect = vi.fn((url: string) => {
  void url;
  throw REDIRECT;
});
vi.mock("next/navigation", () => ({ redirect }));

// cache() er en ren videresending her, så hvert kall går til klienten.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

let fetchImpl: typeof fetch;
let fetchCalls: string[];

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** En innlogget sesjon i lagringen, med et utløpsdato langt fram i tid. */
function storedSession() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return JSON.stringify({
    access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", exp })}.sig`,
    refresh_token: "r",
    expires_in: 3600,
    expires_at: exp,
    token_type: "bearer",
    user: { id: "10000000-0000-4000-8000-000000000002", aud: "authenticated", email: "bruker1@localfix.test" },
  });
}

// En ekte klient med falsk fetch og lagring. `getViewer` får den i stedet for
// serverklienten som leser sesjonen fra kapselen.
vi.mock("./server", () => ({
  createClient: async () => {
    const store = new Map([["sb-test-auth-token", storedSession()]]);
    return createClient("http://127.0.0.1:54321", "test-key", {
      auth: {
        storageKey: "sb-test-auth-token",
        storage: {
          getItem: (key) => store.get(key) ?? null,
          setItem: (key, value) => void store.set(key, value),
          removeItem: (key) => void store.delete(key),
        },
        autoRefreshToken: false,
        persistSession: true,
      },
      global: {
        fetch: (input, init) => {
          fetchCalls.push(String(input));
          return fetchImpl(input, init);
        },
      },
    });
  },
}));

const { getViewer, requireUser } = await import("./auth");

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  redirect.mockClear();
  vi.restoreAllMocks();
});

const OUTAGES: [string, () => typeof fetch][] = [
  ["nettverksfeil (fetch kaster)", () => async () => { throw new TypeError("fetch failed"); }],
  ["fetch kaster en tekst", () => async () => { throw "bare tekst"; }],
  ["500 fra Auth", () => async () => json(500, { message: "boom" })],
  ["503 fra Auth", () => async () => json(503, { message: "utilgjengelig" })],
  ["401 fra Auth (ugyldig sesjon)", () => async () => json(401, { message: "invalid JWT" })],
];

describe.each(OUTAGES)("når Auth gir %s", (_name, makeFetch) => {
  test("getViewer gir en besøkende, ikke et kast, og slår ikke opp profilen", async () => {
    fetchCalls = [];
    fetchImpl = makeFetch();
    await expect(getViewer()).resolves.toEqual({ user: null, isModerator: false });
    // Bare kallet til Auth: profiloppslaget (REST) gjøres ikke.
    expect(fetchCalls.every((url) => url.includes("/auth/v1/"))).toBe(true);
    expect(fetchCalls.length).toBeGreaterThan(0);
  });

  test("requireUser sender brukeren til innloggingen som en besøkende", async () => {
    fetchCalls = [];
    fetchImpl = makeFetch();
    await expect(requireUser("/rapporter/ny")).rejects.toBe(REDIRECT);
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/auth/login?next=%2Frapporter%2Fny");
  });
});
