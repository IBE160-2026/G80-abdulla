"use server";

import { revalidatePath } from "next/cache";
import { actionError, toActionError, type ActionResult } from "@/lib/errors";
import { parseReportInput } from "@/lib/report-input";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Registrerer en rapport (FR-3, Story 2.2). Rekkefølgen er fast: innlogging
 * først (`requireUser` sender en besøkende til innlogging), så trimming og
 * validering med samme definisjon som skjemaet, så INSERT med brukerens egen
 * sesjon. Bare `description`, `location` og `category` sendes: forfatter,
 * status og tidspunkt kommer fra DEFAULT i databasen, som er den egentlige
 * kontrollen (AD-1). Både `error` og at en rad kom tilbake sjekkes.
 *
 * Feil oversettes i `lib/errors.ts`. Bare feilkoden logges, med «createReport»
 * foran så linjen kan spores, aldri rapporttekst eller e-post, og tekst fra databasen når aldri brukeren.
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
