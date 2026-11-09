"use client";

import { AuthForm, type AuthResult } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/client";

async function signIn(credentials: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { error } = await createClient().auth.signInWithPassword(credentials);
  return error ? { ok: false, code: error.code } : { ok: true };
}

/**
 * Innloggingen (FR-1, Story 2.1). Nettleserklienten brukes bare til
 * `signInWithPassword`, aldri til data (AD-3). Skjemaet, feilmeldingene og
 * retur-adressen ligger i AuthForm.
 */
export function LoginForm({ next }: { next: string | null }) {
  return (
    <AuthForm
      title="Logg inn"
      submitLabel="Logg inn"
      pendingLabel="Logger inn …"
      newPassword={false}
      next={next}
      switchQuestion="Har du ikke konto?"
      switchLabel="Registrer konto"
      switchPath="/auth/sign-up"
      submit={signIn}
    />
  );
}
