import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getViewer } from "@/lib/supabase/auth";
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
 * nettleseren (AD-3, AD-5).
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
        <SiteHeader viewer={viewer} />
        {children}
      </body>
    </html>
  );
}
