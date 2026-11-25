import Link from "next/link";

/**
 * 404 for alle URL-er som ikke finnes, for eksempel `/foo`, `/rapporter` og
 * `/rapporter/<id>/x`. Uten denne gir Next sin engelske 404. Detaljsiden har
 * sin egen, `app/rapporter/[id]/not-found.tsx`. Topplinja viser ikke «←» her
 * (BackLink), bare lenken tilbake til lista.
 */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <h1 className="mb-3 text-title">Fant ikke siden.</h1>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Tilbake til lista
      </Link>
    </main>
  );
}
