import { MIN_PASSWORD_LENGTH } from "./limits";

/** Feltet feilmeldingen hører til. `form` vises over knappen. */
export type AuthErrorField = "email" | "password" | "form";

export type AuthError = { field: AuthErrorField; message: string };

/**
 * Kodene fra Supabase Auth (`error.code`) i matrisen i spec-en for Story 2.1,
 * og `email_missing` og `password_missing`, som skjemaene finner selv før
 * kallet.
 */
const MESSAGES: Record<string, AuthError> = {
  email_missing: { field: "email", message: "Skriv inn e-postadressen din." },
  password_missing: { field: "password", message: "Skriv inn passordet ditt." },
  invalid_credentials: { field: "form", message: "Feil e-post eller passord." },
  user_already_exists: {
    field: "email",
    message: "Det finnes allerede en konto med denne e-postadressen.",
  },
  email_exists: {
    field: "email",
    message: "Det finnes allerede en konto med denne e-postadressen.",
  },
  weak_password: {
    field: "password",
    message: `Passordet må ha minst ${MIN_PASSWORD_LENGTH} tegn.`,
  },
  email_address_invalid: {
    field: "email",
    message: "Skriv inn en gyldig e-postadresse.",
  },
  over_request_rate_limit: {
    field: "form",
    message: "For mange forsøk. Vent litt og prøv igjen.",
  },
};

const UNKNOWN: AuthError = { field: "form", message: "Noe gikk galt. Prøv igjen." };

/**
 * Den norske feilmeldingen for en feilkode fra Supabase Auth eller fra
 * skjemaets egne sjekker (Story 2.1). Teksten fra Supabase vises aldri: en
 * ukjent kode, eller ingen kode (for eksempel en nettverksfeil), gir «Noe gikk
 * galt. Prøv igjen.».
 */
export function authErrorMessage(code: string | null | undefined): AuthError {
  return (code && Object.hasOwn(MESSAGES, code) && MESSAGES[code]) || UNKNOWN;
}

/**
 * Samme regel som nettleseren bruker for `type="email"` (WHATWG HTML). Brukes
 * fordi skjemaene har `noValidate`, og fordi Supabase svarer med den generelle
 * koden `validation_failed` på en e-postadresse som `abc`.
 */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Sjekkene skjemaene gjør før kallet til Supabase: tomme felt, formen på
 * e-postadressen og, ved registrering, passordlengden. Gir feilene i
 * rekkefølgen feltene står i, så den første kan få fokus. En tom liste betyr
 * at skjemaet kan sendes.
 */
export function checkCredentials(
  { email, password }: { email: string; password: string },
  { newPassword }: { newPassword: boolean },
): AuthError[] {
  const errors: AuthError[] = [];
  if (email.trim() === "") errors.push(authErrorMessage("email_missing"));
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.push(authErrorMessage("email_address_invalid"));

  if (password === "") errors.push(authErrorMessage("password_missing"));
  else if (newPassword && [...password].length < MIN_PASSWORD_LENGTH)
    errors.push(authErrorMessage("weak_password"));

  return errors;
}
