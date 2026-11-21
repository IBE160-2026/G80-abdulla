"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, toActionError, type ActionResult } from "@/shared/lib/errors";
import { parseReportId } from "@/shared/report/report-id";
import { requireUser } from "@/shared/supabase/auth";
import { Constants } from "@/shared/supabase/database.types";
import { createClient } from "@/shared/supabase/server";
import type { ReportStatus } from "@/shared/supabase/types";

/** Svaret fra `setReportStatus`: statusen og «sist oppdatert» slik databasen satte dem. */
export type StatusChange = { status: ReportStatus; status_changed_at: string };

const statusSchema = z.enum(Constants.public.Enums.report_status);

/**
 * Flytter statusen på en rapport fra `from` til `to` (FR-8, Story 4.1). Bare
 * moderatoren kan det, men det avgjør databasen (AD-12, AD-14): policyen,
 * kolonnegranten og triggeren `reports_guard_update`, som også sjekker at det
 * er ett steg og setter `status_changed_at`. Handlingen bruker brukerens egen
 * sesjon, aldri tjenestenøkkelen, og sjekker ikke rollen selv.
 *
 * Rekkefølgen er fast: innlogging først (`requireUser` sender en besøkende til
 * innlogging og så tilbake til detaljsiden, eller til lista når id-en ikke er
 * en uuid), så validering av id-en som uuid og av statusene mot enumen
 * (`validation_failed`).
 *
 * Oppdateringen har `WHERE id = $1 AND status = $2`, så en side som viser en
 * utdatert status, ikke overskriver en nyere endring. Både `error` og antall
 * rader sjekkes. Feil fra databasen oversettes i `shared/lib/errors.ts`:
 * `42501` gir `forbidden`, og `P0001` gir koden fra triggeren
 * (`invalid_status_step`). Null rader gir et nytt oppslag: finnes ikke raden
 * (eller RLS skjuler den), er svaret `report_not_found`, ellers `stale_state`.
 *
 * Lista og detaljsiden revalideres etter en endring og etter `stale_state`,
 * så siden viser statusen som gjelder nå. Bare feilkoden logges, med
 * «setReportStatus» foran, aldri rapporttekst, e-post eller tekst fra
 * databasen.
 */
export async function setReportStatus(
  reportId: unknown,
  from: unknown,
  to: unknown,
): Promise<ActionResult<StatusChange>> {
  const id = typeof reportId === "string" ? parseReportId(reportId) : null;
  await requireUser(id ? `/rapporter/${id}` : "/");
  if (!id) return actionError("validation_failed");
  const fromStatus = statusSchema.safeParse(from);
  const toStatus = statusSchema.safeParse(to);
  if (!fromStatus.success || !toStatus.success) return actionError("validation_failed");

  const revalidate = () => {
    revalidatePath("/");
    revalidatePath(`/rapporter/${id}`);
  };

  try {
    const supabase = await createClient();

    const { data: updated, error: updateError } = await supabase
      .from("reports")
      .update({ status: toStatus.data })
      .eq("id", id)
      .eq("status", fromStatus.data)
      .select("status, status_changed_at");
    if (updateError) {
      console.error("setReportStatus", updateError.code || "ukjent");
      return { ok: false, error: toActionError(updateError) };
    }

    if (!updated || updated.length > 1) {
      console.error("setReportStatus", updated ? "flere_rader" : "ingen_svar");
      return actionError("unknown");
    }
    if (updated.length === 1) {
      revalidate();
      return { ok: true, data: updated[0] };
    }

    // Null rader: rapporten finnes ikke (for denne brukeren), eller statusen
    // er ikke lenger `from`.
    const { data: row, error: readError } = await supabase
      .from("reports")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (readError) {
      console.error("setReportStatus", readError.code || "ukjent");
      return { ok: false, error: toActionError(readError) };
    }
    if (!row) return actionError("report_not_found");
    revalidate();
    return actionError("stale_state");
  } catch {
    // Nettverksfeil eller annet som kastes. Meldingen kan inneholde tekst fra
    // kallet, så den logges ikke.
    console.error("setReportStatus", "ukjent");
    return actionError("unknown");
  }
}

/** Svaret fra `setReportHidden`: om rapporten er skjult, slik databasen lagret det. */
export type HiddenChange = { hidden: boolean };

/**
 * Skjuler eller viser en rapport (FR-9, Story 4.2). `hidden` er målverdien,
 * aldri en veksling, så å skjule en skjult rapport er lov og endrer ingenting.
 * Bare moderatoren kan det, men det avgjør databasen, som for
 * `setReportStatus`: en vanlig bruker får `42501` (`forbidden`) fra triggeren
 * `reports_guard_update`. Skjuling sletter ingenting og flytter ikke
 * `status_changed_at`. RLS avgjør hvem som ser rapporten etterpå, og appen
 * filtrerer aldri på `hidden`. Rapportøren får ingen melding.
 *
 * Rekkefølgen er den samme som i `setReportStatus`: innlogging først, så
 * validering av id-en som uuid og av `hidden` som boolean (`validation_failed`).
 * Både `error` og antall rader sjekkes. Skjuling har ingen fra-verdi, så det
 * finnes ingen utdatert tilstand: null rader betyr at rapporten ikke finnes
 * for brukeren, og svaret er alltid `report_not_found` (Design Notes i
 * spec-en). Lista og detaljsiden revalideres etter en endring. Bare
 * feilkoden logges, med «setReportHidden» foran.
 */
export async function setReportHidden(
  reportId: unknown,
  hidden: unknown,
): Promise<ActionResult<HiddenChange>> {
  const id = typeof reportId === "string" ? parseReportId(reportId) : null;
  await requireUser(id ? `/rapporter/${id}` : "/");
  if (!id) return actionError("validation_failed");
  const target = z.boolean().safeParse(hidden);
  if (!target.success) return actionError("validation_failed");

  try {
    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from("reports")
      .update({ hidden: target.data })
      .eq("id", id)
      .select("hidden");
    if (error) {
      console.error("setReportHidden", error.code || "ukjent");
      return { ok: false, error: toActionError(error) };
    }

    if (!updated || updated.length > 1) {
      console.error("setReportHidden", updated ? "flere_rader" : "ingen_svar");
      return actionError("unknown");
    }
    if (updated.length === 0) return actionError("report_not_found");

    revalidatePath("/");
    revalidatePath(`/rapporter/${id}`);
    return { ok: true, data: updated[0] };
  } catch {
    // Nettverksfeil eller annet som kastes. Meldingen kan inneholde tekst fra
    // kallet, så den logges ikke.
    console.error("setReportHidden", "ukjent");
    return actionError("unknown");
  }
}
