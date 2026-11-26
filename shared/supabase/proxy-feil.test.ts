// Tester `updateSession` i prosessen med en falsk Supabase-klient (gap fra
// code review v1 gruppe A, deferred-work.md): hva proxyen svarer når
// `getClaims()` gir data, gir en feil som data eller kaster, og at en fornyet
// sesjon havner både på forespørselen og på svaret. Proxyen skal bare fornye
// sesjonen og aldri avgjøre tilgang (AR-2), så den skal ikke gi 500 eller
// sende noen til innlogging. proxy.test.ts kjører den ekte klienten i en egen
// Node-prosess og beholdes.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

type CookieOptions = {
  cookies: {
    getAll(): { name: string; value: string }[];
    setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]): void;
  };
};

const { createServerClient } = vi.hoisted(() => ({ createServerClient: vi.fn() }));

// shared/lib/env.ts validerer miljøvariablene ved import.
vi.mock("@/shared/lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  },
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

import { updateSession } from "./proxy";

const SECRET = "hemmelig-token-som-ikke-skal-i-loggen";

function requestWithSession(path = "/rapporter/123") {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: `sb-test-auth-token=${SECRET}` },
  });
}

/** Lar `getClaims` være `fn`, og gir `fn` tilgang til cookie-valgene proxyen sendte inn. */
function fakeClient(getClaims: (options: CookieOptions) => Promise<unknown>) {
  createServerClient.mockImplementation((_url: string, _key: string, options: CookieOptions) => ({
    auth: { getClaims: () => getClaims(options) },
  }));
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  createServerClient.mockReset();
});

test("getClaims med data gir 200 uten omdirigering", async () => {
  fakeClient(async () => ({ data: { claims: { sub: "bruker" } }, error: null }));
  const response = await updateSession(requestWithSession());
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(errorSpy).not.toHaveBeenCalled();
});

test("getClaims som gir en feil som data, gir 200 uten omdirigering", async () => {
  fakeClient(async () => ({ data: null, error: { name: "AuthSessionMissingError" } }));
  const response = await updateSession(requestWithSession());
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
});

test("getClaims som kaster, gir 200 uten omdirigering og uten verdier fra kapselen i loggen", async () => {
  fakeClient(async () => {
    throw new TypeError(`fetch failed for ${SECRET}`);
  });
  const response = await updateSession(requestWithSession());
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SECRET);
});

test("en fornyet sesjon står på forespørselen og i set-cookie på svaret", async () => {
  let seen: { name: string; value: string }[] = [];
  fakeClient(async (options) => {
    seen = options.cookies.getAll();
    options.cookies.setAll([
      { name: "sb-test-auth-token", value: "fornyet", options: { path: "/", httpOnly: true } },
    ]);
    return { data: { claims: { sub: "bruker" } }, error: null };
  });
  const request = requestWithSession();
  const response = await updateSession(request);
  expect(seen).toEqual([{ name: "sb-test-auth-token", value: SECRET }]);
  expect(request.cookies.get("sb-test-auth-token")?.value).toBe("fornyet");
  expect(response.cookies.get("sb-test-auth-token")?.value).toBe("fornyet");
  expect(response.headers.get("set-cookie")).toMatch(/sb-test-auth-token=fornyet.*HttpOnly/i);
});

test("getClaims som kaster etter at sesjonen er fornyet, beholder den fornyede kapselen", async () => {
  fakeClient(async (options) => {
    options.cookies.setAll([{ name: "sb-test-auth-token", value: "fornyet", options: { path: "/" } }]);
    throw new TypeError("fetch failed");
  });
  const request = requestWithSession();
  const response = await updateSession(request);
  expect(response.status).toBe(200);
  expect(request.cookies.get("sb-test-auth-token")?.value).toBe("fornyet");
  expect(response.cookies.get("sb-test-auth-token")?.value).toBe("fornyet");
  expect(errorSpy).toHaveBeenCalledTimes(1);
});

test("et kast som ikke er en Error (en tekst), gir også 200 og en logglinje uten innholdet", async () => {
  fakeClient(async () => {
    throw SECRET;
  });
  const response = await updateSession(requestWithSession());
  expect(response.status).toBe(200);
  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SECRET);
});
