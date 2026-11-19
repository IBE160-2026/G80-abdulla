// Tester feilmeldingene i skjemaene for innlogging og registrering (Story
// 2.1): hver kode i matrisen i spec-en gir riktig tekst ved riktig felt, og
// en ukjent kode gir «Noe gikk galt. Prøv igjen.». Tester også sjekkene
// skjemaene gjør før kallet til Supabase.
import { describe, expect, test } from "vitest";
import { authErrorMessage, checkCredentials } from "./auth-errors";

const IN_USE = "Det finnes allerede en konto med denne e-postadressen.";
const UNKNOWN = { field: "form", message: "Noe gikk galt. Prøv igjen." };

describe("authErrorMessage", () => {
  test.each([
    ["invalid_credentials", "form", "Feil e-post eller passord."],
    ["user_already_exists", "email", IN_USE],
    ["email_exists", "email", IN_USE],
    ["weak_password", "password", "Passordet må ha minst 6 tegn."],
    ["email_address_invalid", "email", "Skriv inn en gyldig e-postadresse."],
    ["over_request_rate_limit", "form", "For mange forsøk. Vent litt og prøv igjen."],
    ["email_missing", "email", "Skriv inn e-postadressen din."],
    ["password_missing", "password", "Skriv inn passordet ditt."],
  ])("%s gir feltet %s og «%s»", (code, field, message) => {
    expect(authErrorMessage(code)).toEqual({ field, message });
  });

  test.each([
    ["en ukjent kode", "validation_failed"],
    ["en kode med andre bokstaver", "Invalid_Credentials"],
    ["et navn fra Object.prototype", "toString"],
    ["en tom kode", ""],
    ["ingen kode (nettverksfeil)", undefined],
    ["null", null],
  ])("%s gir skjemafeilen «Noe gikk galt. Prøv igjen.»", (_name, code) => {
    expect(authErrorMessage(code)).toEqual(UNKNOWN);
  });
});

describe("checkCredentials", () => {
  const login = { newPassword: false };
  const signUp = { newPassword: true };

  test("tomme felt gir én feil per felt, i rekkefølgen feltene står i", () => {
    expect(checkCredentials({ email: "", password: "" }, login)).toEqual([
      { field: "email", message: "Skriv inn e-postadressen din." },
      { field: "password", message: "Skriv inn passordet ditt." },
    ]);
  });

  test("en e-postadresse med bare mellomrom er tom", () => {
    expect(checkCredentials({ email: "   ", password: "localfix-test" }, login)).toEqual([
      { field: "email", message: "Skriv inn e-postadressen din." },
    ]);
  });

  test.each(["abc", "abc@", "@localfix.test", "a b@localfix.test", "a@b..test"])(
    "%s er ikke en gyldig e-postadresse",
    (email) => {
      expect(checkCredentials({ email, password: "localfix-test" }, login)).toEqual([
        { field: "email", message: "Skriv inn en gyldig e-postadresse." },
      ]);
    },
  );

  test.each(["bruker1@localfix.test", " bruker1@localfix.test ", "a.b+c@d-e.test"])(
    "%s godtas",
    (email) => {
      expect(checkCredentials({ email, password: "localfix-test" }, login)).toEqual([]);
    },
  );

  test("ved registrering gir 5 tegn «Passordet må ha minst 6 tegn.», og 6 tegn godtas", () => {
    expect(checkCredentials({ email: "ny@localfix.test", password: "12345" }, signUp)).toEqual([
      { field: "password", message: "Passordet må ha minst 6 tegn." },
    ]);
    expect(checkCredentials({ email: "ny@localfix.test", password: "123456" }, signUp)).toEqual(
      [],
    );
  });

  test("passordlengden telles i tegn, ikke UTF-16-enheter", () => {
    // Tre emoji er seks UTF-16-enheter, men tre tegn.
    expect(checkCredentials({ email: "ny@localfix.test", password: "😀😀😀" }, signUp)).toEqual([
      { field: "password", message: "Passordet må ha minst 6 tegn." },
    ]);
  });

  test("ved innlogging sjekkes ikke passordlengden", () => {
    expect(checkCredentials({ email: "bruker1@localfix.test", password: "12345" }, login)).toEqual(
      [],
    );
  });
});
