"use client";

import { AuthForm, type AuthResult } from "@/components/auth-form";
import { MIN_PASSWORD_LENGTH } from "@/lib/limits";
import { createClient } from "@/lib/supabase/client";

async function signUp(credentials: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { data, error } = await createClient().auth.signUp(credentials);
  if (error) return { ok: false, code: error.code };
  // Uten e-postbekreftelse (enable_confirmations = false) gir signUp en
  // innlogget sesjon med en gang. Mangler den, er oppsettet endret, og
  // brukeren får den generelle feilmeldingen i stedet for en side som venter
  // på en e-post som aldri kommer.
  return data.session ? { ok: true } : { ok: false };
}

/**
 * Registreringen (FR-1, Story 2.1). En ny konto er innlogget med en gang og
 * får rollen `user` fra triggeren `handle_new_user`. Nettleserklienten brukes
 * bare til `signUp`, aldri til data (AD-3).
 */
export function SignUpForm({ next }: { next: string | null }) {
  return (
    <AuthForm
      title="Registrer konto"
      submitLabel="Registrer konto"
      pendingLabel="Registrerer …"
      newPassword
      passwordHint={`Minst ${MIN_PASSWORD_LENGTH} tegn.`}
      next={next}
      switchQuestion="Har du allerede konto?"
      switchLabel="Logg inn"
      switchPath="/auth/login"
      submit={signUp}
    />
  );
}
