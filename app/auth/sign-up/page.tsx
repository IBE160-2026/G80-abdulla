import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = {
  title: "Registrer konto · LocalFix",
};

/**
 * Registreringssiden (FR-1, Story 2.1). `next` sendes som den står til
 * skjemaet, som kontrollerer den med `safeNextPath` før den brukes.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <SignUpForm next={typeof next === "string" ? next : null} />
    </main>
  );
}
