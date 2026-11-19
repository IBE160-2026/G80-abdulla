// Bekreftelser mot REST-grensen (Story 3.3, FR-7, NFR-4): innlogget seed-bruker
// og besøkende sender INSERT på confirmations med supabase-js og den offentlige
// nøkkelen, som appen gjør. En besøkende får 401, egen rapport, skjult rapport og
// satt user_id eller created_at får 403, samme bekreftelse to ganger får 409, og
// en vanlig bekreftelse får 201 med bruker-id fra sesjonen. Krever lokal
// Supabase med seed-dataene: kjøres av `npm run test:db`. Rapporten og
// bekreftelsene blir liggende til neste `db reset`.
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, expect, test } from "vitest";
import type { Database } from "./types";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Vitest leser ikke .env selv. lib/env.ts validerer variablene når den
// importeres, så den lastes etter at .env er lest.
loadEnvConfig(ROOT, false, { info: () => {}, error: console.error });
const { publicEnv } = await import("@/lib/env");

const BRUKER1 = "10000000-0000-4000-8000-000000000002";
const BRUKER2 = "10000000-0000-4000-8000-000000000003";
const SKJULT_RAPPORT = "20000000-0000-4000-8000-000000000007";

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
// En ny rapport fra bruker1, så testene ikke avhenger av bekreftelsene i seed.
let reportId: string;

beforeAll(async () => {
  [bruker1, bruker2, moderator] = await Promise.all([
    signedIn("bruker1@localfix.test"),
    signedIn("bruker2@localfix.test"),
    signedIn("moderator@localfix.test"),
  ]);
  const { data, error } = await bruker1
    .from("reports")
    .insert({ description: `Bekreftelsestest ${randomUUID()}`, location: "Gangveien", category: "other" })
    .select("id")
    .single();
  expect(error).toBeNull();
  reportId = data!.id;
});

const confirm = (supabase: typeof anon, id: string) =>
  supabase.from("confirmations").insert({ report_id: id }).select("report_id, user_id");

test("en besøkende får 401", async () => {
  const { error, status } = await confirm(anon, reportId);
  expect(status).toBe(401);
  expect(error?.code).toBe("42501");
});

test("forfatteren kan ikke bekrefte sin egen rapport: 403", async () => {
  const { error, status } = await confirm(bruker1, reportId);
  expect(status).toBe(403);
  expect(error?.code).toBe("42501");
});

test("en skjult rapport kan ikke bekreftes, heller ikke av moderatoren: 403", async () => {
  for (const supabase of [bruker2, moderator]) {
    const { error, status } = await confirm(supabase, SKJULT_RAPPORT);
    expect(status).toBe(403);
    expect(error?.code).toBe("42501");
  }
});

test("user_id og created_at kan ikke settes: 403", async () => {
  const forged = await bruker2
    .from("confirmations")
    .insert({ report_id: reportId, user_id: BRUKER1 });
  expect(forged.status).toBe(403);
  expect(forged.error?.code).toBe("42501");

  const own = await bruker2.from("confirmations").insert({ report_id: reportId, user_id: BRUKER2 });
  expect(own.status).toBe(403);

  const dated = await bruker2
    .from("confirmations")
    .insert({ report_id: reportId, created_at: "2020-01-01T00:00:00Z" });
  expect(dated.status).toBe(403);
  expect(dated.error?.code).toBe("42501");
});

test("en bekreftelse gir 201 med brukerens id, og telleren går opp med én", async () => {
  const before = await bruker2
    .from("reports_with_counts")
    .select("seen_count, confirmed_by_me")
    .eq("id", reportId)
    .single();
  expect(before.data).toEqual({ seen_count: 1, confirmed_by_me: false });

  const { data, error, status } = await confirm(bruker2, reportId);
  expect(error).toBeNull();
  expect(status).toBe(201);
  expect(data).toEqual([{ report_id: reportId, user_id: BRUKER2 }]);

  const after = await bruker2
    .from("reports_with_counts")
    .select("seen_count, confirmed_by_me, status")
    .eq("id", reportId)
    .single();
  expect(after.data).toEqual({ seen_count: 2, confirmed_by_me: true, status: "new" });
});

test("samme bekreftelse to ganger gir 409", async () => {
  const { error, status } = await confirm(bruker2, reportId);
  expect(status).toBe(409);
  expect(error?.code).toBe("23505");
});

test("moderatoren bekrefter en annens rapport som en vanlig bruker", async () => {
  const { error, status } = await confirm(moderator, reportId);
  expect(error).toBeNull();
  expect(status).toBe(201);
});

test("ingen kan endre eller slette en bekreftelse via REST", async () => {
  const update = await bruker2
    .from("confirmations")
    .update({ report_id: reportId })
    .eq("report_id", reportId)
    .select();
  expect(update.status).toBe(403);
  expect(update.error?.code).toBe("42501");

  const remove = await bruker2.from("confirmations").delete().eq("report_id", reportId).select();
  expect(remove.status).toBe(403);
  expect(remove.error?.code).toBe("42501");
});
