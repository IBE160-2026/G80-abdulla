import { createClient } from "./server";

/** Den private bucketen med bildene til rapportene (AD-6). */
export const IMAGE_BUCKET = "report-images";

/** Så mange sekunder varer en signert lenke (AD-9). */
export const SIGNED_URL_SECONDS = 60;

/**
 * Lager én signert lenke til bildet til en rapport (Story 1.7, AD-6, AD-9).
 * Dette er det eneste stedet appen lager signerte lenker, så en reserve-
 * løsning bare endrer denne funksjonen. Lenken lages med brukerens sesjon
 * (serverklienten, ingen tjenestenøkkel), så Storage-policyene bestemmer om
 * brukeren får lenke. Kalles bare etter at rapporten er lest under RLS.
 *
 * Feiler signeringen, for eksempel fordi objektet mangler, gir den `null`, og
 * siden vises uten bilde. Loggen har bare statuskoden, aldri stien.
 */
export async function signReportImage(path: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS);

    if (error || !data) {
      const status =
        error && "statusCode" in error && error.statusCode
          ? String(error.statusCode)
          : "ukjent";
      console.error(`Kunne ikke lage bildelenke (${status}).`);
      return null;
    }
    return data.signedUrl;
  } catch {
    // Et kall som kaster (for eksempel nettverk), skal heller ikke gi feilside.
    console.error("Kunne ikke lage bildelenke (ukjent).");
    return null;
  }
}
