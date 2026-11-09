import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Logg inn · LocalFix",
};

/**
 * Innloggingssiden (FR-1, Story 2.1). `next` sendes som den står til
 * skjemaet, som kontrollerer den med `safeNextPath` før den brukes.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <LoginForm next={typeof next === "string" ? next : null} />
    </main>
  );
}
