"use client";

import Link from "next/link";

/**
 * Den norske feilsiden for alle sider, for eksempel når databasen svarer med
 * feil (beslutningen om feilsiden i Story 1.5). Logger ingenting selv, fordi
 * serveren allerede har logget feilkoden. «Prøv igjen» henter siden på nytt
 * fra serveren med `retry` (Next 16.3), siden `reset` bare tegner den feilede
 * siden på nytt uten å hente den.
 */
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <h1 className="mb-3 text-title">Noe gikk galt. Prøv igjen.</h1>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Prøv igjen
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Tilbake til lista
        </Link>
      </div>
    </main>
  );
}
