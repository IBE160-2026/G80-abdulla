// Bare for testene mot lokal Supabase (Story 2.4, retro F3): en klient med
// service-role-nøkkelen, som rydder bucketen report-images, siden AD-9 ikke gir
// noen DELETE-policy. Nøkkelen hentes fra `npx supabase status -o env`, aldri
// fra `.env`, og appen importerer aldri denne filen (AD-11). Filen heter ikke
// *.test.ts, så Vitest kjører den ikke selv.
import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let cached: { url: string; key: string } | null = null;

function localStatus(): { url: string; key: string } {
  if (cached) return cached;
  // execSync går gjennom skallet, så npx virker også på Windows.
  const output = execSync("npx supabase status -o env", {
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60_000,
  }).toString();
  const read = (name: string) =>
    output.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?\\s*$`, "m"))?.[1];
  const url = read("API_URL");
  const key = read("SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Fant ikke API_URL og SERVICE_ROLE_KEY i `npx supabase status -o env`. Kjører den lokale databasen?");
  }
  cached = { url, key };
  return cached;
}

/** Klient med service-role mot lokal Supabase. Bruk den bare til opprydding. */
export function serviceRoleClient(): SupabaseClient<Database> {
  const { url, key } = localStatus();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Navnene på objektene (hele stier) direkte under en mappe i bucketen, sett med service-role. */
export async function listObjects(bucket: string, folder: string): Promise<string[]> {
  const { data, error } = await serviceRoleClient()
    .storage.from(bucket)
    .list(folder, { limit: 1000 });
  if (error) throw new Error(`Kunne ikke liste bucketen ${bucket}: ${error.message}`);
  return data.map((object) => `${folder}/${object.name}`).sort();
}

/**
 * Sletter objektene (stier i bucketen) med service-role. Feiler hvis Storage
 * svarer med feil, så en opprydding som ikke virket, ikke går ubemerket.
 */
export async function removeObjects(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { data, error } = await serviceRoleClient().storage.from(bucket).remove(paths);
  if (error) throw new Error(`Kunne ikke rydde bucketen ${bucket}: ${error.message}`);
  if (data.length !== paths.length) {
    throw new Error(`Ryddet ${data.length} av ${paths.length} objekter i bucketen ${bucket}.`);
  }
}
