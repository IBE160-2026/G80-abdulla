// Tekstgrensene ved INSERT (Story 2.2, AD-4): en innlogget seed-bruker setter
// inn rapporter med supabase-js og den offentlige nøkkelen, som skjemaet gjør.
// Nøyaktig 1000 tegn i beskrivelsen og 200 i lokasjonen godtas, også med emoji
// og æøå, og ett tegn mer avvises med 23514. Tallene stemmer med charCount i
// lib/limits.ts, som skjemaet og Server Action bruker. Krever lokal Supabase
// med seed-dataene: kjøres av `npm run test:db`. Rapportene blir liggende til
// neste `db reset`.
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, expect, test } from "vitest";
import { charCount, DESCRIPTION_MAX, LOCATION_MAX } from "@/lib/limits";
import type { Database } from "./types";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Vitest leser ikke .env selv. lib/env.ts validerer variablene når den
// importeres, så den lastes etter at .env er lest.
loadEnvConfig(ROOT, false, { info: () => {}, error: console.error });
const { publicEnv } = await import("@/lib/env");

const BRUKER1 = "10000000-0000-4000-8000-000000000002";

const supabase = createClient<Database>(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

beforeAll(async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: "bruker1@localfix.test",
    password: "localfix-test",
  });
  expect(error, "innlogging feilet for bruker1@localfix.test").toBeNull();
});

/** Tekst med nøyaktig `n` tegn (kodepunkter), blandet av æøå, emoji og ASCII. */
function text(n: number, tag: string): string {
  const unit = ["æ", "ø", "å", "😀", "a"];
  const chars = [...tag];
  for (let i = chars.length; i < n; i++) chars.push(unit[i % unit.length]);
  return chars.join("");
}

async function insert(description: string, location: string) {
  return supabase
    .from("reports")
    .insert({ description, location, category: "other" })
    .select("id, author_id, status, hidden")
    .single();
}

test("nøyaktig grensen godtas: 1000 tegn beskrivelse og 200 tegn lokasjon, med emoji og æøå", async () => {
  const description = text(DESCRIPTION_MAX, randomUUID());
  const location = text(LOCATION_MAX, randomUUID());
  expect(charCount(description)).toBe(DESCRIPTION_MAX);
  expect(charCount(location)).toBe(LOCATION_MAX);
  // Teksten har emoji, så UTF-16-lengden er større enn antall tegn.
  expect(description.length).toBeGreaterThan(DESCRIPTION_MAX);

  const { data, error } = await insert(description, location);
  expect(error).toBeNull();
  expect(data?.author_id).toBe(BRUKER1);
  expect(data?.status).toBe("new");
  expect(data?.hidden).toBe(false);
});

test("ett tegn for mye avvises med 23514: 1001 tegn beskrivelse", async () => {
  const description = text(DESCRIPTION_MAX + 1, randomUUID());
  expect(charCount(description)).toBe(DESCRIPTION_MAX + 1);

  const { error } = await insert(description, "Gangveien");
  expect(error?.code).toBe("23514");
});

test("ett tegn for mye avvises med 23514: 201 tegn lokasjon", async () => {
  const location = text(LOCATION_MAX + 1, randomUUID());
  expect(charCount(location)).toBe(LOCATION_MAX + 1);

  const { error } = await insert("Hull i veien", location);
  expect(error?.code).toBe("23514");
});

test("bare mellomrom avvises med 23514", async () => {
  expect((await insert("   ", "Gangveien")).error?.code).toBe("23514");
  expect((await insert("Hull i veien", "   ")).error?.code).toBe("23514");
});

test("author_id, status og hidden kan ikke settes av brukeren (42501)", async () => {
  // Typen Insert har ikke feltene, så de sendes via en løs type.
  const forged = [
    { author_id: "10000000-0000-4000-8000-000000000003" },
    { status: "resolved" },
    { hidden: true },
    { created_at: "2020-01-01T00:00:00Z" },
    { status_changed_at: "2020-01-01T00:00:00Z" },
  ];
  for (const extra of forged) {
    const row = { description: "Forfalsket", location: "Gangveien", category: "other", ...extra };
    const { error } = await supabase
      .from("reports")
      .insert(row as unknown as Database["public"]["Tables"]["reports"]["Insert"]);
    expect(error?.code, JSON.stringify(Object.keys(extra))).toBe("42501");
  }
});
