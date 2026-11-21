// Statusendring mot REST-grensen (Story 4.1, FR-8, NFR-4): innlogget seed-bruker
// og besøkende sender UPDATE på reports med supabase-js og den offentlige
// nøkkelen, som appen gjør. En besøkende får 401, en vanlig bruker 403, også på
// egen rapport, og moderatoren flytter statusen ett steg med status_changed_at
// fra databasen. En utdatert fra-status gir null rader, et hopp gir
// invalid_status_step, og status_changed_at kan ikke settes. Moderatoren
// skjuler og viser rapporten med 200, status_changed_at står stille, og en
// skjult rapport er borte for alle andre (Story 4.2). Krever lokal Supabase
// med seed-dataene: kjøres av `npm run test:db`. Rapporten blir liggende til
// neste `db reset`.
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, expect, test } from "vitest";
import type { Database } from "@/shared/supabase/types";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Vitest leser ikke .env selv. shared/lib/env.ts validerer variablene når den
// importeres, så den lastes etter at .env er lest.
loadEnvConfig(ROOT, false, { info: () => {}, error: console.error });
const { publicEnv } = await import("@/shared/lib/env");

function client() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function signedIn(email: string) {
  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword({ email, password: "localfix-test" });
  expect(error, `innlogging feilet for ${email}`).toBeNull();
  return supabase;
}

const anon = client();
let bruker1: Awaited<ReturnType<typeof signedIn>>;
let bruker2: Awaited<ReturnType<typeof signedIn>>;
let moderator: Awaited<ReturnType<typeof signedIn>>;
// En ny rapport fra bruker1 med status new, så testene ikke endrer seed.
let reportId: string;
let createdAt: string;

beforeAll(async () => {
  [bruker1, bruker2, moderator] = await Promise.all([
    signedIn("bruker1@localfix.test"),
    signedIn("bruker2@localfix.test"),
    signedIn("moderator@localfix.test"),
  ]);
  const { data, error } = await bruker1
    .from("reports")
    .insert({ description: `Statustest ${randomUUID()}`, location: "Gangveien", category: "other" })
    .select("id, created_at")
    .single();
  expect(error).toBeNull();
  reportId = data!.id;
  createdAt = data!.created_at;
});

const setStatus = (supabase: typeof anon, from: "new" | "in_progress" | "resolved", to: "new" | "in_progress" | "resolved") =>
  supabase
    .from("reports")
    .update({ status: to })
    .eq("id", reportId)
    .eq("status", from)
    .select("status, status_changed_at");

// Testene under kjører i rekkefølge mot samme rapport, og hver test bygger på
// statusen den forrige etterlot (new → in_progress → new).

const current = async () =>
  (await moderator.from("reports").select("status, status_changed_at").eq("id", reportId).single()).data;

test("en besøkende får 401", async () => {
  const { error, status } = await setStatus(anon, "new", "in_progress");
  expect(status).toBe(401);
  expect(error?.code).toBe("42501");
});

test("en vanlig bruker får 403, også på egen rapport", async () => {
  for (const supabase of [bruker1, bruker2]) {
    const { error, status } = await setStatus(supabase, "new", "in_progress");
    expect(status).toBe(403);
    expect(error?.code).toBe("42501");
  }
  const hide = await bruker1.from("reports").update({ hidden: true }).eq("id", reportId).select("id");
  expect(hide.status).toBe(403);
  expect(hide.error?.code).toBe("42501");
  expect(await current()).toEqual({ status: "new", status_changed_at: createdAt });
});

test("et hopp gir invalid_status_step, og ingenting endres", async () => {
  const { error, status } = await setStatus(moderator, "new", "resolved");
  expect(status).toBe(400);
  expect(error?.code).toBe("P0001");
  expect(error?.message).toBe("invalid_status_step");
  expect(await current()).toEqual({ status: "new", status_changed_at: createdAt });
});

test("status_changed_at kan ikke settes, heller ikke av moderatoren: 403", async () => {
  const { error, status } = await moderator
    .from("reports")
    .update({ status_changed_at: "2030-01-01T00:00:00Z" })
    .eq("id", reportId)
    .select("id");
  expect(status).toBe(403);
  expect(error?.code).toBe("42501");
});

test("moderatoren flytter statusen ett steg, og status_changed_at settes av databasen", async () => {
  const { data, error, status } = await setStatus(moderator, "new", "in_progress");
  expect(error).toBeNull();
  expect(status).toBe(200);
  expect(data).toHaveLength(1);
  expect(data![0].status).toBe("in_progress");
  expect(Date.parse(data![0].status_changed_at)).toBeGreaterThan(Date.parse(createdAt));
});

test("en utdatert fra-status gir null rader, og statusen står", async () => {
  const before = await current();
  const { data, error, status } = await setStatus(moderator, "new", "in_progress");
  expect(error).toBeNull();
  expect(status).toBe(200);
  expect(data).toEqual([]);
  expect(await current()).toEqual(before);
});

test("moderatoren kan flytte statusen tilbake, og status_changed_at flyttes fram", async () => {
  // pgTAP kan ikke sjekke dette: now() er fast i én transaksjon.
  const before = await current();
  const { data, error } = await setStatus(moderator, "in_progress", "new");
  expect(error).toBeNull();
  expect(data).toHaveLength(1);
  expect(data![0].status).toBe("new");
  expect(Date.parse(data![0].status_changed_at)).toBeGreaterThan(
    Date.parse(before!.status_changed_at),
  );
});

test("moderatoren skjuler og viser via REST (200), og status_changed_at står stille (Story 4.2)", async () => {
  const before = await current();
  for (const hidden of [true, true, false]) {
    // To ganger true: å skjule en skjult rapport er lov og endrer ingenting.
    const { data, error, status } = await moderator
      .from("reports")
      .update({ hidden })
      .eq("id", reportId)
      .select("hidden, status, status_changed_at");
    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toEqual([{ hidden, ...before }]);
  }
});

test("en skjult rapport er borte for rapportøren og en besøkende, men finnes for moderatoren (Story 4.2)", async () => {
  const hide = await moderator.from("reports").update({ hidden: true }).eq("id", reportId).select("id");
  expect(hide.error).toBeNull();
  expect(hide.data).toEqual([{ id: reportId }]);
  for (const supabase of [bruker1, bruker2, anon]) {
    const { data, error } = await supabase.from("reports").select("id").eq("id", reportId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  }
  const { data } = await moderator.from("reports").select("id, hidden").eq("id", reportId);
  expect(data).toEqual([{ id: reportId, hidden: true }]);
  // Vis igjen, så rapporten står som før.
  const show = await moderator.from("reports").update({ hidden: false }).eq("id", reportId).select("id");
  expect(show.error).toBeNull();
  expect(show.data).toEqual([{ id: reportId }]);
});
