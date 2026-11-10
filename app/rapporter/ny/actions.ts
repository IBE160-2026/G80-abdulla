"use server";

import { revalidatePath } from "next/cache";
import { actionError, toActionError, type ActionResult } from "@/lib/errors";
import { suggest, type Suggestion } from "@/lib/ai";
import { clipInput } from "@/lib/ai/validate";
import { parseReportInput } from "@/lib/report-input";
import { getViewer, requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

// Brukerne som har et KI-kall i gang. Nøkkelen er bruker-id, og låsen ligger i
// minnet til denne serverprosessen (Story 2.3).
const suggesting = new Set<string>();

/**
 * Foreslår kategori og oppsummering for en beskrivelse (FR-4, Story 2.3). Bare
 * for innloggede: en besøkende får `unauthenticated` uten at KI-en nås. Hver
 * bruker har høyst ett kall i gang. Et samtidig kall fra samme bruker gir
 * `{ ok: true, data: null }`, og låsen frigjøres også ved feil og
 * tidsavbrudd. Ingen forslag er `data: null`, aldri en feil, så KI-en stopper
 * ikke innsendingen. Beskrivelsen og forslaget logges aldri.
 */
export async function suggestReport(
  description: unknown,
): Promise<ActionResult<Suggestion | null>> {
  const { user } = await getViewer();
  if (!user) return actionError("unauthenticated");

  if (typeof description !== "string" || description.trim() === "") {
    return { ok: true, data: null };
  }
  if (suggesting.has(user.id)) return { ok: true, data: null };

  suggesting.add(user.id);
  try {
    return { ok: true, data: await suggest(clipInput(description)) };
  } catch {
    console.error("suggestReport", "ukjent");
    return { ok: true, data: null };
  } finally {
    suggesting.delete(user.id);
  }
}

/**
 * Registrerer en rapport (FR-3, Story 2.2). Rekkefølgen er fast: innlogging
 * først (`requireUser` sender en besøkende til innlogging), så trimming og
 * validering med samme definisjon som skjemaet, så INSERT med brukerens egen
 * sesjon. Bare `description`, `location`, `category` og en valgfri `summary`
 * sendes: forfatter, status og tidspunkt kommer fra DEFAULT i databasen, som er
 * den egentlige kontrollen (AD-1). Uten oppsummering lagres `NULL`. Både
 * `error` og at en rad kom tilbake sjekkes.
 *
 * Feil oversettes i `lib/errors.ts`. Bare feilkoden logges, med «createReport»
 * foran så linjen kan spores, aldri rapporttekst eller e-post, og tekst fra
 * databasen når aldri brukeren.
 */
export async function createReport(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireUser("/rapporter/ny");

  const parsed = parseReportInput(input);
  if (!parsed.ok) return actionError("validation_failed");

  let id: string | undefined;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .insert(parsed.data)
      .select("id");

    if (error) {
      console.error("createReport", error.code || "ukjent");
      return { ok: false, error: toActionError(error) };
    }
    id = data?.length === 1 ? data[0].id : undefined;
  } catch {
    // Nettverksfeil eller annet som kastes. Meldingen kan inneholde tekst
    // fra kallet, så den logges ikke.
    console.error("createReport", "ukjent");
    return actionError("unknown");
  }

  if (!id) {
    console.error("createReport", "ingen_rad");
    return actionError("unknown");
  }

  revalidatePath("/");
  revalidatePath(`/rapporter/${id}`);
  return { ok: true, data: { id } };
}
