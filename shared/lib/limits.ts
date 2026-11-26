// Lengdegrensene for tekstfeltene i rapporter. De samme tallene står i
// CHECK-uttrykkene i databasen (AD-4), som er den egentlige kontrollen.

export const DESCRIPTION_MAX = 1000;
export const LOCATION_MAX = 200;
export const SUMMARY_MAX = 300;

/**
 * Antall tegn slik Postgres teller dem med char_length: kodepunkter, ikke
 * UTF-16-enheter. En emoji er ett tegn her, men to i `s.length`.
 */
export function charCount(s: string): number {
  return [...s].length;
}

/**
 * Minste passordlengde ved registrering. Samme tall som
 * `minimum_password_length` i supabase/config.toml, som er den egentlige
 * kontrollen. shared/lib/limits.test.ts sjekker at de er like.
 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Bildene til rapportene (Story 2.4, AD-9): 5 × 1024 × 1024 byte, lik
 * `file_size_limit = "5MiB"` i bucketen. Nøyaktig grensen godtas, én byte mer
 * avvises.
 */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Mest bredde × høyde i piksler. Verner serveren mot svært store bilder. */
export const MAX_IMAGE_PIXELS = 40_000_000;

/**
 * Skjemaet gjør et bilde mindre før det sendes når fila er over
 * `IMAGE_RESIZE_THRESHOLD_BYTES` (4 MiB) eller lengste side er over
 * `IMAGE_RESIZE_MAX_SIDE` (2048 px). Det skalerte bildet er en JPEG med lengste
 * side høyst 2048 px. 4 MiB er under `IMAGE_MAX_BYTES` og under 4,5 MB, som
 * Vercel etter dokumentasjonen tillater i en forespørsel. Serveren bruker ikke
 * disse tallene: grensen der er fortsatt `IMAGE_MAX_BYTES`.
 */
export const IMAGE_RESIZE_MAX_SIDE = 2048;
export const IMAGE_RESIZE_THRESHOLD_BYTES = 4 * 1024 * 1024;
