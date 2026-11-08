// En ny konto får rollen user, også når registreringen sender med
// role = "moderator" i metadata (AD-4, AD-14). Går den ekte veien via
// Supabase Auth (GoTrue) med den offentlige nøkkelen. Krever lokal Supabase:
// kjøres av `npm run test:db`. Kontoen blir liggende til neste `db reset`.
import { randomUUID } from "node:crypto";
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

test("registrering med role = moderator i metadata gir likevel rollen user", async () => {
  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `falsk-rolle-${randomUUID()}@localfix.test`;
  const password = "localfix-test";

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "moderator" } },
  });
  expect(signUp.error).toBeNull();
  // Kontroll: metadataen kom fram til Auth, så testen prøver det den skal.
  expect(signUp.data.user?.user_metadata.role).toBe("moderator");

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  expect(signIn.error).toBeNull();
  expect(signIn.data.session).not.toBeNull();

  const profile = await supabase.from("profiles").select("id, role").single();
  expect(profile.error).toBeNull();
  expect(profile.data).toEqual({ id: signIn.data.user?.id, role: "user" });

  await supabase.auth.signOut();
});
