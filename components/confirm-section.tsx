"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { confirmReport } from "@/app/rapporter/[id]/actions";
import {
  CONFIRM_LABELS,
  confirmOutcome,
  confirmState,
  confirmThrown,
  isConfirmDisabled,
  optimisticConfirm,
  type ConfirmView,
} from "@/lib/confirm-state";
import { cn } from "@/lib/utils";

/**
 * Telleren «N har sett dette» og bekreftknappen på detaljsiden (FR-7, Story
 * 3.3, UX-DR14). Knappen har fem tilstander (`lib/confirm-state.ts`): en
 * besøkende sendes til innlogging og tilbake hit, mens «Skjult rapport»,
 * «Din rapport» og «Du har sett dette ✓» er deaktiverte.
 *
 * Trykk: telleren går opp med én og knappen blir «Du har sett dette ✓» med en
 * gang. Når svaret kommer, erstattes tallet av serverens `seen_count`. En feil
 * setter telleren og knappen tilbake og viser meldingen fra `lib/errors.ts` som
 * toast, unntatt `already_confirmed`, som gir «Du har sett dette ✓» uten toast.
 *
 * De deaktiverte tilstandene bruker `aria-disabled`, ikke `disabled`, så
 * knappen beholder fokus når den blir «Du har sett dette ✓» etter trykket.
 * Telleren står i en `aria-live`-region, så endringen leses opp. Verdiene fra
 * serveren (props) tar over når en revalidering gir nye tall.
 */
export function ConfirmSection({
  reportId,
  seenCount,
  confirmedByMe,
  authoredByMe,
  hidden,
  isSignedIn,
}: {
  reportId: string;
  seenCount: number;
  confirmedByMe: boolean;
  authoredByMe: boolean;
  hidden: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<ConfirmView>({ seen: seenCount, confirmed: confirmedByMe });
  // Nye tall fra serveren (revalidering) erstatter det som vises. Sammenlignes
  // under rendering, så komponenten ikke monteres på nytt og fokus består.
  const [server, setServer] = useState({ seenCount, confirmedByMe });
  if (server.seenCount !== seenCount || server.confirmedByMe !== confirmedByMe) {
    setServer({ seenCount, confirmedByMe });
    setView({ seen: seenCount, confirmed: confirmedByMe });
  }

  // Det serveren sist har sagt. Svaret fra Server Action-en bruker denne, ikke
  // propsene fra trykket, så en revalidering som kom først, ikke blir overskrevet.
  const latest = useRef<ConfirmView>({ seen: seenCount, confirmed: confirmedByMe });
  useEffect(() => {
    latest.current = { seen: seenCount, confirmed: confirmedByMe };
  });

  const state = confirmState({
    isSignedIn,
    hidden,
    authoredByMe,
    confirmedByMe: view.confirmed,
  });
  const disabled = isConfirmDisabled(state);

  async function onClick() {
    if (state === "visitor") {
      router.push(`/auth/login?next=${encodeURIComponent(`/rapporter/${reportId}`)}`);
      return;
    }
    if (state !== "open") return;

    // Optimistisk +1 fra det serveren sist har sagt.
    setView(optimisticConfirm(latest.current));
    let outcome: { view: ConfirmView; toast: string | null };
    try {
      outcome = confirmOutcome(await confirmReport(reportId), latest.current);
    } catch {
      // Nettverksfeil: Server Action kastet. Samme tilbakestilling som `unknown`.
      outcome = confirmThrown(latest.current);
    }
    setView(outcome.view);
    if (outcome.toast) toast.error(outcome.toast);
  }

  return (
    <>
      <p className="my-1.5 text-sm" aria-live="polite" aria-atomic="true">
        {view.seen} har sett dette
      </p>
      <button
        type="button"
        onClick={onClick}
        aria-disabled={disabled || undefined}
        className={cn(
          "mt-3 flex min-h-11 w-full items-center justify-center rounded-md px-4 text-[15px] font-semibold",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          state === "confirmed"
            ? "bg-status-new text-primary"
            : "border border-primary bg-background text-primary",
          state === "visitor" || state === "open"
            ? "hover:bg-status-new"
            : "cursor-default",
          (state === "hidden" || state === "own") && "opacity-60",
        )}
      >
        {CONFIRM_LABELS[state]}
      </button>
    </>
  );
}
