import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { PASSWORD } from "./auth";

// Oppretter testdata rett mot lokal Supabase, med en seed-brukers sesjon og den
// offentlige nøkkelen, som appen selv gjør (ingen tjenestenøkkel, AD-11).
// Playwright leser ikke .env selv, så fila leses her (som i Vitest-testene).
loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

/**
 * Registrerer en rapport som `email` og gir id-en. Rapporten har kategorien
 * «Annet» og blir liggende til neste `db reset`. Brukes av testene som trenger
 * en rapport uten bekreftelser, så de ikke avhenger av seed-tallene.
 */
export async function createReportAs(email: string, summary: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Mangler NEXT_PUBLIC_SUPABASE_URL eller _PUBLISHABLE_KEY i .env.");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw new Error(`Innlogging feilet for ${email}.`);

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
