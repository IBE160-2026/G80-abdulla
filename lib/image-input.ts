import { IMAGE_MAX_BYTES, MAX_IMAGE_PIXELS } from "./limits";

// Reglene for et bilde til en rapport (Story 2.4, AD-9), delt av skjemaet og
// serveren. Ingen avhengigheter, så filen kan brukes i nettleseren. Serveren
// avgjør typen etter innholdet i `lib/image-process.ts`: `type` her er bare det
// nettleseren oppgir, og skjemaet bruker det for å avvise med en gang.

/** Bildetypene som godtas, lik `allowed_mime_types` i bucketen. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

/** Verdien til `accept` på filfeltet. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

export const IMAGE_MESSAGES = {
  empty: "Fila er tom. Velg et annet bilde.",
  type: "Bildet må være JPEG, PNG eller WebP.",
  tooLarge: "Bildet er for stort. Maks 5 MB.",
  unreadable: "Fila er ikke et gyldig bilde.",
  dimensions: "Bildet har for store dimensjoner.",
} as const;

export type ImageProblem = keyof typeof IMAGE_MESSAGES;

/** Teksten under «Legg til bilde» (UX-DR10). */
export const IMAGE_HINT =
  "Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP, maks 5 MB.";

/**
 * Sjekker det som kan sjekkes uten å lese bildet: tom fil, type og størrelse,
 * i den rekkefølgen. 5 MiB godtas, 5 MiB + 1 byte avvises.
 */
export function checkImageFile(file: { size: number; type: string }): ImageProblem | null {
  if (file.size === 0) return "empty";
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > IMAGE_MAX_BYTES) return "tooLarge";
  return null;
}

/** Er bredde × høyde innenfor pikselgrensen? Ugyldige mål er aldri innenfor. */
export function withinPixelLimit(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    width * height <= MAX_IMAGE_PIXELS
  );
}
