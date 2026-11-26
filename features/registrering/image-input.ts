import {
  IMAGE_MAX_BYTES,
  IMAGE_RESIZE_MAX_SIDE,
  IMAGE_RESIZE_THRESHOLD_BYTES,
} from "@/shared/lib/limits";

// Reglene for et bilde til en rapport (Story 2.4, AD-9), brukt av skjemaet.
// Ingen avhengigheter, så filen kan brukes i nettleseren og testes uten den.
// Serveren avgjør typen etter innholdet i `features/registrering/image-process.ts`:
// `type` her er bare det nettleseren oppgir, og skjemaet bruker det for å
// avvise med en gang. Selve skaleringen ligger i `image-resize.ts`.

/** Bildetypene som godtas, lik `allowed_mime_types` i bucketen. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

/** Verdien til `accept` på filfeltet. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

export const IMAGE_MESSAGES = {
  empty: "Fila er tom. Velg et annet bilde.",
  type: "Bildet må være JPEG, PNG eller WebP.",
  tooLarge: "Bildet er for stort.",
  unreadable: "Fila er ikke et gyldig bilde.",
} as const;

export type ImageProblem = keyof typeof IMAGE_MESSAGES;

/** Teksten under «Legg til bilde» (UX-DR10). */
export const IMAGE_HINT =
  "Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP. Store bilder gjøres mindre før de sendes.";

/**
 * Sjekker fila brukeren valgte, før bildet leses og eventuelt skaleres: tom fil
 * og type, i den rekkefølgen. Størrelsen sjekkes ikke her, siden et stort bilde
 * gjøres mindre.
 */
export function checkImageType(file: { size: number; type: string }): "empty" | "type" | null {
  if (file.size === 0) return "empty";
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  return null;
}

/**
 * Sjekker fila som skal sendes, etter en eventuell skalering: tom fil, type og
 * størrelse, i den rekkefølgen. 5 MiB godtas, 5 MiB + 1 byte avvises, som på
 * serveren.
 */
export function checkImageFile(file: { size: number; type: string }): ImageProblem | null {
  const problem = checkImageType(file);
  if (problem) return problem;
  if (file.size > IMAGE_MAX_BYTES) return "tooLarge";
  return null;
}

/**
 * Må bildet gjøres mindre? Ja når fila er over 4 MiB eller lengste side er over
 * 2048 px. Nøyaktig grensene gir nei, så bildet sendes uendret. `width` og
 * `height` er målene etter EXIF-orienteringen.
 */
export function needsResize(image: { size: number; width: number; height: number }): boolean {
  return (
    image.size > IMAGE_RESIZE_THRESHOLD_BYTES ||
    Math.max(image.width, image.height) > IMAGE_RESIZE_MAX_SIDE
  );
}

/**
 * Målene til det skalerte bildet: samme forhold, og lengste side høyst 2048 px.
 * Et bilde som allerede er innenfor, beholder målene (det gjøres bare om til
 * JPEG). Ingen side blir under 1 px.
 */
export function resizedDimensions(width: number, height: number): { width: number; height: number } {
  const scale = IMAGE_RESIZE_MAX_SIDE / Math.max(width, height);
  if (scale >= 1) return { width, height };
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
