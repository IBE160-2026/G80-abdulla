"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authErrorMessage,
  checkCredentials,
  type AuthError,
  type AuthErrorField,
} from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/safe-next";

/** Svaret fra Supabase Auth: `code` er `error.code`, og mangler ved nettverksfeil. */
export type AuthResult = { ok: true } | { ok: false; code?: string };

type Errors = Partial<Record<AuthErrorField, string>>;

function toErrors(list: AuthError[]): Errors {
  const errors: Errors = {};
  for (const { field, message } of list) errors[field] ??= message;
  return errors;
}

/**
 * Felles skjema for innlogging og registrering (Story 2.1). Kallet til
 * Supabase gjøres av `submit`, som login-form.tsx og sign-up-form.tsx gir, så
 * bare de importerer nettleserklienten.
 *
 * Skjemaet har `noValidate` og sjekker tomme felt, formen på e-postadressen
 * og, ved registrering, passordlengden selv. Alle feil vises med tekst fra
 * `authErrorMessage`, aldri tekst fra Supabase. Feltfeil står under feltet,
 * er koblet med `aria-describedby` og gir `aria-invalid`. Skjemafeil står
 * over knappen med `role="alert"`. Fokus går til første feil.
 *
 * Feilteksten har vanlig tekstfarge og et ikon i `destructive`: shadcns
 * `destructive` har for lav kontrast til liten tekst (3,8:1 mot hvit).
 *
 * Etter innlogging går brukeren til `next`, kontrollert med `safeNextPath`
 * (en adresse under `/auth/` gir lista), og `router.refresh()` henter
 * topplinja på nytt med menyen for innloggede.
 */
export function AuthForm({
  title,
  submitLabel,
  pendingLabel,
  newPassword,
  passwordHint,
  next,
  switchQuestion,
  switchLabel,
  switchPath,
  submit,
}: {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  /** Registrering: `autocomplete="new-password"` og sjekk av passordlengden. */
  newPassword: boolean;
  passwordHint?: string;
  /** `next` fra adressen, som den står. Kontrolleres før den brukes. */
  next: string | null;
  switchQuestion: string;
  switchLabel: string;
  switchPath: string;
  submit: (credentials: { email: string; password: string }) => Promise<AuthResult>;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  function showErrors(found: Errors) {
    // Feilene tegnes før fokus flyttes, så skjemafeilen finnes og
    // skjermleseren leser feltet sammen med feilmeldingen.
    flushSync(() => {
      setErrors(found);
      setPending(false);
    });
    if (found.email) emailRef.current?.focus();
    else if (found.password) passwordRef.current?.focus();
    else if (found.form) formErrorRef.current?.focus();
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const local = checkCredentials({ email, password }, { newPassword });
    if (local.length > 0) {
      showErrors(toErrors(local));
      return;
    }

    setErrors({});
    setPending(true);
    let result: AuthResult;
    try {
      result = await submit({ email: email.trim(), password });
    } catch {
      result = { ok: false };
    }
    if (!result.ok) {
      showErrors(toErrors([authErrorMessage(result.code)]));
      return;
    }
    // En retur-adresse under /auth/ gir lista: router.replace til samme rute
    // monterer ikke skjemaet på nytt, så det ville stått fast på «Logger inn …».
    const target = safeNextPath(next, window.location.origin);
    router.replace(target.startsWith("/auth/") ? "/" : target);
    router.refresh();
  }

  const switchHref = next ? `${switchPath}?next=${encodeURIComponent(next)}` : switchPath;
  const hintId = passwordHint ? "password-hint" : undefined;

  return (
    <>
      <h1 className="mb-4 text-title">{title}</h1>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border bg-card p-4"
      >
        <div className="grid gap-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-11 md:text-base aria-[invalid=true]:border-destructive"
          />
          {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Passord</Label>
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete={newPassword ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              [hintId, errors.password ? "password-error" : undefined]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className="h-11 md:text-base aria-[invalid=true]:border-destructive"
          />
          {passwordHint && (
            <p id={hintId} className="text-meta text-muted-foreground">
              {passwordHint}
            </p>
          )}
          {errors.password && (
            <FieldError id="password-error">{errors.password}</FieldError>
          )}
        </div>
        {errors.form && (
          <p
            ref={formErrorRef}
            role="alert"
            tabIndex={-1}
            className="flex items-start gap-2 rounded-md border border-destructive bg-card p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            {errors.form}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-11 w-full text-base">
          {pending ? pendingLabel : submitLabel}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        {switchQuestion}{" "}
        <Link
          href={switchHref}
          className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {switchLabel}
        </Link>
      </p>
    </>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      {children}
    </p>
  );
}
