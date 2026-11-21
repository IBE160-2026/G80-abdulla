"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setReportHidden } from "@/features/moderering/actions";
import { ERROR_MESSAGES } from "@/shared/lib/errors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

// `aria-disabled` i stedet for `disabled` mens den lagrer, så knappen beholder
// fokus (som i `confirm-section.tsx`). Utseendet følger `disabled` i Button.
const BUTTON_CLASSES =
  "min-h-11 w-full whitespace-normal px-3 text-[15px] font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

/**
 * Skjul/vis-knappen i moderatorpanelet (FR-9, Story 4.2, UX-DR15). «Skjul
 * rapport» (`outline`) åpner en shadcn-`AlertDialog`, og rapporten skjules
 * først når moderatoren bekrefter. «Vis rapport» trenger ingen bekreftelse.
 * Begge sender en eksplisitt målverdi til `setReportHidden`, aldri en
 * veksling. Mens endringen lagres, er knappen deaktivert med `aria-disabled`
 * (ikke `disabled`, som ville tatt fokuset og sendt det til `body`): trykk
 * gjør ingenting, og «Skjul rapport» åpner ikke dialogen. En feil gir en toast
 * med meldingen fra `shared/lib/errors.ts`.
 *
 * Verdien fra serveren (props etter revalidering) synkes inn under rendering,
 * som i `status-panel.tsx`. Etter svaret byttes knappen, så fokus settes
 * eksplisitt på den knappen som da vises: «Vis rapport» etter skjuling og
 * «Skjul rapport» etter visning, aldri `body`. Lukkes dialogen (bekreftet,
 * «Avbryt» eller Escape), går fokus til samme knapp i stedet for Radix sin
 * utløser, som kan være byttet ut.
 */
export function HideControl({ reportId, hidden }: { reportId: string; hidden: boolean }) {
  const [shown, setShown] = useState(hidden);
  const [saving, setSaving] = useState(false);
  const [server, setServer] = useState(hidden);
  if (server !== hidden) {
    setServer(hidden);
    setShown(hidden);
  }

  const button = useRef<HTMLButtonElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest > 0) button.current?.focus();
  }, [focusRequest]);

  async function onSet(target: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      const answer = await setReportHidden(reportId, target);
      if (answer.ok) {
        // Bare det som vises, ikke `server`: svaret kan komme før de
        // revaliderte propsene. Ble `server` satt her, ville de gamle propsene
        // i neste rendering se ut som en endring fra serveren og sette knappen
        // tilbake, så fokus havnet på en knapp som så byttes ut.
        setShown(answer.data.hidden);
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

  if (shown) {
    return (
      <Button
        ref={button}
        type="button"
        variant="outline"
        aria-disabled={saving || undefined}
        onClick={() => onSet(false)}
        className={BUTTON_CLASSES}
      >
        Vis rapport
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        asChild
        onClick={(event) => {
          // Radix åpner ikke dialogen når standardhandlingen er stoppet.
          if (saving) event.preventDefault();
        }}
      >
        <Button
          ref={button}
          type="button"
          variant="outline"
          aria-disabled={saving || undefined}
          className={BUTTON_CLASSES}
        >
          Skjul rapport
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="w-[calc(100%-2rem)] rounded-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          button.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Skjule rapporten?</AlertDialogTitle>
          <AlertDialogDescription>
            Rapporten blir borte for alle andre, også for den som sendte den inn. Ingenting
            slettes, og du kan vise den igjen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* `flex-col`, ikke shadcn sin `flex-col-reverse`: på mobil står
            knappene i samme rekkefølge som Tab-rekkefølgen. */}
        <AlertDialogFooter className="flex-col gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 min-h-11 text-[15px] font-semibold">Avbryt</AlertDialogCancel>
          <AlertDialogAction
            className="min-h-11 text-[15px] font-semibold"
            onClick={() => onSet(true)}
          >
            Skjul rapport
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
