// Statusflyten i moderatorpanelet (Story 4.1, FR-8, UX-DR15): fra en status kan
// moderatoren gå ett steg fram eller tilbake. Rekkefølgen er enumen i databasen
// (new, in_progress, resolved), som også triggeren reports_guard_update bruker,
// så panelet aldri tilbyr et steg databasen avviser. Navnene kommer bare fra
// shared/report/labels.ts.
import { STATUS_LABELS } from "@/shared/report/labels";
import { Constants } from "@/shared/supabase/database.types";
import type { ReportStatus } from "@/shared/supabase/types";

/** Statusene i enum-rekkefølgen, som er en del av kontrakten. */
export const STATUS_ORDER: readonly ReportStatus[] = Constants.public.Enums.report_status;

/** En knapp i panelet: målstatusen og teksten på knappen. */
export type StatusStep = { to: ReportStatus; label: string };

/**
 * Nabostatusene til `status`, tilbake først: Ny gir «Under behandling →»,
 * Under behandling gir «← Ny» og «Løst →», og Løst gir «← Under behandling».
 */
export function neighbourStatuses(status: ReportStatus): StatusStep[] {
  const index = STATUS_ORDER.indexOf(status);
  const back = STATUS_ORDER[index - 1];
  const forward = STATUS_ORDER[index + 1];
  return [
    ...(back ? [{ to: back, label: `← ${STATUS_LABELS[back]}` }] : []),
    ...(forward ? [{ to: forward, label: `${STATUS_LABELS[forward]} →` }] : []),
  ];
}
