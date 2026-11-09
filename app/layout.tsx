import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalFix",
  description:
    "Meld fra om problemer på campus ved Høgskolen i Molde, og se hva andre har meldt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body className="antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
