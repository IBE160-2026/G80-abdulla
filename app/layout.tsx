import type { Metadata } from "next";
import { Suspense } from "react";
import { UserMenu } from "@/features/auth/components/user-menu";
import { NewReportLink } from "@/features/registrering/components/new-report-link";
import { SiteHeader } from "@/shared/layout/site-header";
import { Toaster } from "@/shared/ui/sonner";
import { getViewer } from "@/shared/supabase/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalFix",
  description:
    "Meld fra om problemer på campus ved Høgskolen i Molde, og se hva andre har meldt.",
};

/**
 * Layouten henter brukeren én gang per forespørsel (`getViewer` er i
 * `cache()`) og gir topplinja bare det menyen viser: e-postadressen og om
 * brukeren er moderator. Id-en og resten av brukerobjektet sendes aldri til
 * nettleseren (AD-3, AD-5). Layouten setter også sammen topplinja: «Registrer
 * problem» (registrering) og menyen (auth) sendes inn som `actions`.
 * Menyen leser stien med `useSearchParams()`, så den står i `<Suspense>`.
 * Plassholderen har samme størrelse som menyknappen.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isModerator } = await getViewer();
  const viewer = user ? { email: user.email, isModerator } : null;

  return (
    <html lang="nb">
      <body className="antialiased">
        <SiteHeader
          actions={
            <>
              <NewReportLink />
              <Suspense fallback={<span aria-hidden="true" className="-mr-2 size-11 shrink-0" />}>
                <UserMenu viewer={viewer} />
              </Suspense>
            </>
          }
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
