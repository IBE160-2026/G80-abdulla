"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { setReportStatus } from "@/features/moderering/actions";
import { HideControl } from "@/features/moderering/components/hide-control";
import { neighbourStatuses, STATUS_ORDER } from "@/features/moderering/status-steps";
import { ERROR_MESSAGES } from "@/shared/lib/errors";
import { STATUS_LABELS } from "@/shared/report/labels";
import type { ReportStatus } from "@/shared/supabase/types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

/**
 * Moderatorpanelet nederst på detaljsiden (FR-8, Story 4.1, UX-DR15). Siden i
 * `app/` setter det inn bare for moderatoren. Det viser nåværende status som
 * tekst og knapper bare til nabostatusene (`status-steps.ts`): tilbake i
 * `outline`, fram som primærknapp, som `detalj.html`.
 *
 * Trykk sender `setReportStatus(reportId, status, to)`. Mens endringen lagres,
 * er knappene deaktivert med `aria-disabled` (ikke `disabled`, som ville tatt
 * fokuset og sendt det til `body`, som i `hide-control.tsx`): trykk gjør
 * ingenting. Den nye statusen kommer fra serveren: handlingen
 * revaliderer detaljsiden, og nye props synkes inn under rendering, som i
 * `confirm-section.tsx`, så statusmerket og «Sist oppdatert» over panelet
 * følger med. En feil gir en toast med meldingen fra `shared/lib/errors.ts`,
 * og ved `stale_state` viser siden statusen som gjelder nå.
 *
 * Knappesettet byttes etter endringen, og antallet knapper kan endres. Derfor
 * får første statusknapp fokus etter svaret, så fokus aldri ender på `body`.
 * Statusmerket ligger i `rapporter`, og panelet kan ikke nå det uten å bryte
 * slicegrensen. Knappene har indeksen som nøkkel, så den første beholder fokus
 * også når nye props kommer etter svaret. Statusteksten har `role="status"` (en
 * høflig live-region), så endringen leses opp.
 *
 * Under statusknappene står skjul/vis-knappen på egen rad (`HideControl`,
 * Story 4.2), med `hidden` fra siden.
 */
export function StatusPanel({
  reportId,
  status,
  hidden,
}: {
  reportId: string;
  status: ReportStatus;
  hidden: boolean;
}) {
  const [shown, setShown] = useState(status);
  const [saving, setSaving] = useState(false);
  // Ny status fra serveren (revalidering) erstatter det som vises. Sammenlignes
  // under rendering, så komponenten ikke monteres på nytt og fokus består.
  const [server, setServer] = useState(status);
  if (server !== status) {
    setServer(status);
    setShown(status);
  }

  const firstButton = useRef<HTMLButtonElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const headingId = useId();
  useEffect(() => {
    if (focusRequest > 0) firstButton.current?.focus();
  }, [focusRequest]);

  async function onStep(to: ReportStatus) {
    if (saving) return;
    setSaving(true);
    try {
      const answer = await setReportStatus(reportId, shown, to);
      if (answer.ok) {
        // Også det serveren sist har sagt, så nye props etterpå alltid synkes
        // inn, også når de er lik statusen før trykket (en annen har endret
        // den tilbake i mellomtiden).
        setServer(answer.data.status);
        setShown(answer.data.status);
      } else {
        toast.error(answer.error.message);
      }
    } catch {
      // Nettverksfeil: Server Action kastet.
      toast.error(ERROR_MESSAGES.unknown);
    }
    setSaving(false);
    setFocusRequest((n) => n + 1);
  }

  const steps = neighbourStatuses(shown);

  return (
    <Card className="mt-6 p-4 shadow-none">
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="text-sm font-semibold">
          Moderator
        </h2>
        <p className="mt-1 text-sm" role="status" aria-atomic="true">
          Status: {STATUS_LABELS[shown]}
        </p>
        <div className="mt-3 flex gap-2">
          {steps.map((step, index) => (
            <Button
              // Indeksen som nøkkel: den første knappen er samme element etter
              // byttet, så fokuset står der (se over).
              key={index}
              ref={index === 0 ? firstButton : undefined}
              type="button"
              variant={
                STATUS_ORDER.indexOf(step.to) < STATUS_ORDER.indexOf(shown) ? "outline" : "default"
              }
              aria-disabled={saving || undefined}
              onClick={() => onStep(step.to)}
              className="min-h-11 flex-1 whitespace-normal px-3 text-[15px] font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              {step.label}
            </Button>
          ))}
        </div>
        <div className="mt-2">
          <HideControl reportId={reportId} hidden={hidden} />
        </div>
      </section>
    </Card>
  );
}
