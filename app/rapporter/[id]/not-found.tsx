import Link from "next/link";

/**
 * 404 for detaljsiden: ugyldig id, en id som ikke finnes, eller en skjult
 * rapport (EXPERIENCE.md, State Patterns). Skiller ikke mellom dem, så en
 * skjult rapport ikke røper at den finnes.
 */
export default function ReportNotFound() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <h1 className="mb-3 text-title">Fant ikke rapporten.</h1>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Tilbake til lista
      </Link>
    </main>
  );
}
