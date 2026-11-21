import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { PASSWORD } from "./auth";

// Oppretter testdata rett mot lokal Supabase, med en seed-brukers sesjon og den
// offentlige nøkkelen, som appen selv gjør (ingen tjenestenøkkel, AD-11).
// Playwright leser ikke .env selv, så fila leses her (som i Vitest-testene).
loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

/** En klient logget inn som `email`, med den offentlige nøkkelen. */
async function signedIn(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Mangler NEXT_PUBLIC_SUPABASE_URL eller _PUBLISHABLE_KEY i .env.");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw new Error(`Innlogging feilet for ${email}.`);
  return supabase;
}

/**
 * Registrerer en rapport som `email` og gir id-en. Rapporten har kategorien
 * «Annet» og blir liggende til neste `db reset`. Brukes av testene som trenger
 * en rapport uten bekreftelser, så de ikke avhenger av seed-tallene.
 */
export async function createReportAs(email: string, summary: string): Promise<string> {
  const supabase = await signedIn(email);
  const { data, error } = await supabase
    .from("reports")
    .insert({
      description: `${summary}. Opprettet av en test.`,
      location: "Teststedet",
      category: "other",
      summary,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Kunne ikke opprette rapporten (${error?.code ?? "ukjent"}).`);
  return data.id as string;
}

/**
 * Statusen og `status_changed_at` for rapporten `id`, lest som `email` (Story
 * 4.1). Testene bruker tidspunktet fra databasen til å sjekke «Sist oppdatert».
 */
export async function readStatusAs(
  email: string,
  id: string,
): Promise<{ status: string; status_changed_at: string }> {
  const supabase = await signedIn(email);
  const { data, error } = await supabase
    .from("reports")
    .select("status, status_changed_at")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(`Kunne ikke lese rapporten (${error?.code ?? "ukjent"}).`);
  return data as { status: string; status_changed_at: string };
}

/** Flytter statusen på rapporten `id` fra `from` til `to` som `email` (Story 4.1). */
export async function setStatusAs(email: string, id: string, from: string, to: string) {
  const supabase = await signedIn(email);
  const { data, error } = await supabase
    .from("reports")
    .update({ status: to })
    .eq("id", id)
    .eq("status", from)
    .select("id");
  if (error || data?.length !== 1) {
    throw new Error(`Kunne ikke endre statusen (${error?.code ?? "ingen rad"}).`);
  }
}

/**
 * `hidden`, statusen og `status_changed_at` for rapporten `id`, lest som
 * `email` (Story 4.2). Gir `null` når RLS skjuler rapporten for `email`.
 */
export async function readHiddenAs(
  email: string,
  id: string,
): Promise<{ hidden: boolean; status: string; status_changed_at: string } | null> {
  const supabase = await signedIn(email);
  const { data, error } = await supabase
    .from("reports")
    .select("hidden, status, status_changed_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Kunne ikke lese rapporten (${error.code ?? "ukjent"}).`);
  return data as { hidden: boolean; status: string; status_changed_at: string } | null;
}

/** Skjuler eller viser rapporten `id` som `email`, med eksplisitt målverdi (Story 4.2). */
export async function setHiddenAs(email: string, id: string, hidden: boolean) {
  const supabase = await signedIn(email);
  const { data, error } = await supabase
    .from("reports")
    .update({ hidden })
    .eq("id", id)
    .select("id");
  if (error || data?.length !== 1) {
    throw new Error(`Kunne ikke endre skjulingen (${error?.code ?? "ingen rad"}).`);
  }
}
