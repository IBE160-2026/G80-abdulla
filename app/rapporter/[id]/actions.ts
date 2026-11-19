"use server";

import { revalidatePath } from "next/cache";
import { actionError, toActionError, type ActionResult } from "@/lib/errors";
import { parseReportId } from "@/lib/report-id";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/** Svaret fra `confirmReport`: tallene slik visningen har dem etter bekreftelsen. */
export type Confirmation = { seen_count: number; confirmed_by_me: boolean };

/**
 * Bekrefter en annens rapport, «Jeg har også sett dette» (FR-7, Story 3.3).
 * Rekkefølgen er fast: innlogging først (`requireUser` sender en besøkende til
 * innlogging og så tilbake til detaljsiden, eller til lista når id-en ikke er en
 * uuid), så validering av id-en som uuid (`validation_failed`).
 *
 * Raden leses fra `reports_with_counts` med brukerens sesjon, bare for en riktig
 * feilmelding: ingen rad (også en skjult rapport for en vanlig bruker) gir
 * `report_not_found`, `hidden` gir `forbidden`, `authored_by_me` gir
 * `own_report` og `confirmed_by_me` gir `already_confirmed`. Databasen er den
 * egentlige kontrollen (AD-1, AD-7): INSERT sender bare `report_id`, og policyen
 * og primærnøkkelen avgjør. `42501` gir `forbidden`, `23505` gir
 * `already_confirmed`. Både `error` og antall rader sjekkes. Svaret leses fra
 * visningen etterpå, så telleren er serverens `seen_count`.
 *
 * Lista og detaljsiden revalideres etter en bekreftelse og etter
 * `already_confirmed`, så siden viser at brukeren har bekreftet. Bare
 * feilkoden logges, med «confirmReport» foran, aldri rapporttekst eller
 * e-post, og tekst fra databasen når aldri brukeren.
 */
export async function confirmReport(
  reportId: unknown,
): Promise<ActionResult<Confirmation>> {
  const id = typeof reportId === "string" ? parseReportId(reportId) : null;
  await requireUser(id ? `/rapporter/${id}` : "/");
  if (!id) return actionError("validation_failed");

  const revalidate = () => {
    revalidatePath("/");
    revalidatePath(`/rapporter/${id}`);
  };

  try {
    const supabase = await createClient();

    const { data: row, error: readError } = await supabase
      .from("reports_with_counts")
      .select("id, hidden, authored_by_me, confirmed_by_me")
      .eq("id", id)
      .maybeSingle();
    if (readError) {
      console.error("confirmReport", readError.code || "ukjent");
      return { ok: false, error: toActionError(readError) };
    }
    if (!row) return actionError("report_not_found");
    if (row.hidden) return actionError("forbidden");
    if (row.authored_by_me) return actionError("own_report");
    if (row.confirmed_by_me) {
      revalidate();
      return actionError("already_confirmed");
    }

    const { data: inserted, error: insertError } = await supabase
      .from("confirmations")
      .insert({ report_id: id })
      .select("report_id");
    if (insertError) {
      console.error("confirmReport", insertError.code || "ukjent");
      if (insertError.code === "23505") {
        revalidate();
        return actionError("already_confirmed");
      }
      return { ok: false, error: toActionError(insertError) };
    }
    if (inserted?.length !== 1) {
      console.error("confirmReport", "ingen_rad");
      return actionError("unknown");
    }

    // Bekreftelsen er lagret, så siden revalideres også om lesingen under feiler.
    revalidate();
    const { data: counts, error: countError } = await supabase
      .from("reports_with_counts")
      .select("seen_count, confirmed_by_me")
      .eq("id", id)
      .maybeSingle();
    if (countError || !counts) {
      console.error("confirmReport", countError?.code || "ingen_rad");
      return actionError("unknown");
    }
    return {
      ok: true,
      data: { seen_count: counts.seen_count, confirmed_by_me: counts.confirmed_by_me },
    };
  } catch {
    // Nettverksfeil eller annet som kastes. Meldingen kan inneholde tekst fra
    // kallet, så den logges ikke.
    console.error("confirmReport", "ukjent");
    return actionError("unknown");
  }
}
