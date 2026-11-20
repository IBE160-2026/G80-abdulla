import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./server";

/** Den innloggede brukeren slik serveren ser den. Bare id og e-post. */
export type ViewerUser = { id: string; email: string };

export type Viewer = { user: ViewerUser | null; isModerator: boolean };

/**
 * Hvem som ser på siden (AD-3, Story 2.1). Brukeren kommer fra
 * `auth.getUser()`, som sjekker sesjonen mot Supabase Auth, og rollen fra
 * brukerens egen rad i `profiles`, lest under RLS. Rollen leses aldri fra JWT
 * eller metadata, som brukeren kan påvirke selv.
 *
 * Feiler profiloppslaget, er `isModerator` `false`, så en feil aldri gir mer
 * tilgang. Bare feilkoden logges, aldri e-postadressen.
 *
 * Pakket i Reacts `cache()`, så layouten og siden deler ett kall per
 * forespørsel.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isModerator: false };

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error(`Kunne ikke lese rollen (${error.code || "ukjent"}).`);

  return {
    user: { id: user.id, email: user.email ?? "" },
    isModerator: !error && data?.role === "moderator",
  };
});

/**
 * Brukeren, eller en omdirigering til innloggingen med `returnTo` som `next`,
 * så brukeren kommer tilbake etter innlogging. Sider og Server Actions som
 * krever innlogging, kaller denne først (AD-3).
 */
export async function requireUser(returnTo: string): Promise<ViewerUser> {
  const { user } = await getViewer();
  if (!user) redirect("/auth/login?next=" + encodeURIComponent(returnTo));
  return user;
}
