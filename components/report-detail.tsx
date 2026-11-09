import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { Report } from "@/lib/supabase/types";

/**
 * Hele rapporten på detaljsiden (FR-5, FR-8, UX-DR13), etter mockupen
 * `detalj.html` og beslutningene i Story 1.5. Øverst kategori og statusmerke,
 * rett under «Sist oppdatert» (siste statusendring), så oppsummeringen som
 * overskrift (eller kategorinavnet når den mangler), bildet, beskrivelsen og
 * til slutt «Hvor», «Registrert» og «N har sett dette». Teksten vises alltid
 * som ren tekst. Beskrivelsen beholder linjeskiftene, og lange ord brytes.
 *
 * Bildet (Story 1.7) vises bare når serveren har laget en signert lenke
 * (`imageUrl`). Det har full bredde og er høyst 480 px høyt. Høye bilder
 * vises hele (`object-contain` på `bg-muted`), så ingenting av problemet
 * kuttes bort. Margen er 8 px over og 12 px under, som `.photo` i
 * `detalj.html`.
 */
export function ReportDetail({
  report,
  imageUrl,
}: {
  report: Report;
  imageUrl: string | null;
}) {
  const category = CATEGORY_LABELS[report.category];

  return (
    <article>
      <div className="flex items-center justify-between gap-2">
        <span className="text-meta text-muted-foreground">{category}</span>
        <StatusBadge status={report.status} />
      </div>
      <p className="mt-1 text-meta text-muted-foreground">
        Sist oppdatert {formatDateTime(report.status_changed_at)}
      </p>
      <h1 className="mb-3 mt-1.5 text-title [overflow-wrap:anywhere]">
        {report.summary ?? category}
      </h1>
      {imageUrl && (
        // Vanlig <img>, ikke bildeoptimereren: lenken er signert og varer
        // bare 60 sekunder (AD-13). Overskriften over sier hva rapporten
        // gjelder, så den alternative teksten gjentar den ikke.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Bilde fra rapporten"
          className="mb-3 mt-2 block h-auto max-h-[480px] w-full rounded-lg bg-muted object-contain"
        />
      )}
      <p className="mb-2.5 whitespace-pre-line text-base leading-normal [overflow-wrap:anywhere]">
        {report.description}
      </p>
      <p className="my-1.5 text-sm [overflow-wrap:anywhere]">
        <span className="text-muted-foreground">Hvor:</span> {report.location}
      </p>
      <p className="my-1.5 text-sm">
        Registrert {formatDateTime(report.created_at)}
      </p>
      <p className="my-1.5 text-sm">{report.seen_count} har sett dette</p>
    </article>
  );
}
