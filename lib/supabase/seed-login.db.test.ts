// Logger inn med hver testbruker i README («Testbrukere») via Supabase Auth,
// med den offentlige nøkkelen, og sjekker rollen i brukerens egen profil
// (issue #24). Krever lokal Supabase med seed-dataene: kjøres av
// `npm run test:db` etter `npx supabase db reset`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "vitest";
import type { Database } from "./types";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Vitest leser ikke .env selv. lib/env.ts validerer variablene når den
// importeres, så den lastes etter at .env er lest.
loadEnvConfig(ROOT, false, { info: () => {}, error: console.error });
const { publicEnv } = await import("@/lib/env");

type TestUser = { email: string; password: string; role: string };

// Leser tabellen under overskriften «Testbrukere» i README. Kolonnene er
// e-post, passord og rolle, med e-post og passord i `kode`.
function readTestUsers(): TestUser[] {
  const readme = readFileSync(`${ROOT}README.md`, "utf8");
  const lines = readme.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#+\s+Testbrukere\s*$/.test(line));
  if (start === -1) throw new Error("README mangler overskriften «Testbrukere».");
  const users: TestUser[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#+\s/.test(line)) break;
    const match = line.match(/^\|\s*`([^`]+@[^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*(\w+)\s*\|/);
    if (match) users.push({ email: match[1], password: match[2], role: match[3] });
  }
  return users;
}

const users = readTestUsers();

test("README har alle testbrukerne fra seed", () => {
  expect(users.map((user) => user.email)).toEqual([
    "moderator@localfix.test",
    "bruker1@localfix.test",
    "bruker2@localfix.test",
    "kjerneflyt360@localfix.test",
    "kjerneflyt1280@localfix.test",
  ]);
});

test.each(users)("$email kan logge inn og har rollen $role", async (user) => {
  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  expect(error, `innlogging feilet for ${user.email}`).toBeNull();
  expect(data.session, `ingen sesjon for ${user.email}`).not.toBeNull();

  const profile = await supabase.from("profiles").select("role").single();
  expect(profile.error, `fant ikke profilen til ${user.email}`).toBeNull();
  expect(profile.data?.role, `feil rolle for ${user.email}`).toBe(user.role);

  await supabase.auth.signOut();
});
