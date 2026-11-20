import type { ListSort } from "@/features/rapporter/list-params";

// Sorteringen i lista (UX-DR8). Kodene står i `list-params.ts` og er det som
// ligger i URL-en (`sort=newest`, `sort=confirmations`). Visningsnavnene hører
// til lista (rapporter), ikke til `shared/report/labels.ts`, som bare har det
// flere slices bruker.
export const SORT_LABELS: Record<ListSort, string> = {
  newest: "Nyeste",
  confirmations: "Flest har sett",
};
