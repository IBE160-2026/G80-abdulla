import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Vises mens lista lastes: fire Skeleton-kort i samme form som rapportkortene
 * (EXPERIENCE.md, State Patterns).
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-4">
      <h1 className="mb-1 text-title">Rapporter</h1>
      <p role="status" className="sr-only">
        Laster rapportene …
      </p>
      <Skeleton className="mb-2.5 h-[18px] w-24" />
      <ul className="flex flex-col gap-2.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}>
            <Card className="rounded-lg px-3.5 py-3 shadow-none">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-[18px] w-20" />
                <Skeleton className="h-[22px] w-16 rounded-full" />
              </div>
              <Skeleton className="my-1 h-5 w-full" />
              <Skeleton className="mb-1 h-5 w-2/3" />
              <Skeleton className="h-[18px] w-40" />
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
