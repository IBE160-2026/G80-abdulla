"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { actionError, toActionError, type ActionResult } from "@/lib/errors";
import { suggest, type Suggestion } from "@/lib/ai";
import { clipInput } from "@/lib/ai/validate";
import { prepareImage } from "@/lib/image-process";
import { parseReportInput } from "@/lib/report-input";
import { getViewer, requireUser } from "@/lib/supabase/auth";
import { IMAGE_BUCKET } from "@/lib/supabase/images";
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
 * Bilde (Story 2.4, AD-9, P-1): en valgfri `image` (File eller Blob) i objektet
 * valideres og renses i `prepareImage` (type fra innholdet, 5 MiB, pikselgrense,
 * EXIF fjernet, riktig vei). Bildet lastes opp først, med brukerens sesjon, til
 * `<author_id>/<uuid>.<ext>` med ny uuid og uten `upsert`, og stien settes inn
 * som `image_path`. Feiler INSERT etter opplastingen, blir fila liggende uten at
 * noen kan lese den (ingen DELETE-policy, utsatt i AD-9). Et `image_path` fra
 * klienten ignoreres.
 *
 * Feil oversettes i `lib/errors.ts`. Bare feilkoden logges, med «createReport»
 * foran så linjen kan spores, aldri rapporttekst eller e-post, og tekst fra
 * databasen når aldri brukeren.
 */
export async function createReport(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("/rapporter/ny");

  const parsed = parseReportInput(input);
  if (!parsed.ok) return actionError("validation_failed");

  // Bildet behandles før noe lastes opp, så en ugyldig fil gir ingen
  // Storage-kall og ingen INSERT.
  const rawImage =
    input !== null && typeof input === "object" && "image" in input
      ? (input as { image?: unknown }).image
      : undefined;
  let prepared: Awaited<ReturnType<typeof prepareImage>> | null = null;
  if (rawImage !== undefined && rawImage !== null) {
    if (!(rawImage instanceof Blob)) return actionError("invalid_image");
    try {
      prepared = await prepareImage(rawImage);
    } catch {
      // Meldingen kan nevne innholdet i fila, så den logges ikke.
      console.error("createReport", "bilde_ukjent");
      return actionError("invalid_image");
    }
    if (!prepared.ok) {
      console.error("createReport", `bilde_${prepared.reason}`);
      // `unavailable` er en feil på serveren (sharp kan ikke lastes), ikke i
      // fila. Brukeren får «kunne ikke laste opp», og rapporter uten bilde
      // virker som før.
      return actionError(prepared.reason === "unavailable" ? "upload_failed" : "invalid_image");
    }
  }

  let id: string | undefined;
  try {
    const supabase = await createClient();

    let imagePath: string | undefined;
    if (prepared?.ok) {
      const path = `${user.id}/${randomUUID()}.${prepared.image.ext}`;
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, prepared.image.bytes, {
          contentType: prepared.image.contentType,
          upsert: false,
        });
      if (uploadError) {
        // Bare statuskoden logges, aldri stien eller meldingen.
        const status =
          "statusCode" in uploadError && uploadError.statusCode
            ? String(uploadError.statusCode)
            : "ukjent";
        console.error("createReport", `opplasting_${status}`);
        return actionError("upload_failed");
      }
      imagePath = path;
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({ ...parsed.data, ...(imagePath ? { image_path: imagePath } : {}) })
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
