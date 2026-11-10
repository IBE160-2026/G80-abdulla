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
 * kontrollen. lib/limits.test.ts sjekker at de er like.
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
