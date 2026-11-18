import { DESCRIPTION_MAX } from "@/lib/limits";
import { Constants } from "@/lib/supabase/database.types";
import type { SM5Case } from "./testset";

// Sjekker formen på SM-5-testsettet (Story 2.5, AR-15). Gir en liste med
// feil, tom når settet er i orden. Brukes av enhetstesten.

const CATEGORIES: readonly string[] = Constants.public.Enums.report_category;
export const SM5_SIZE = 20;
export const SM5_PER_CATEGORY = 4;

export function testsetProblems(cases: readonly SM5Case[]): string[] {
  const problems: string[] = [];
  if (cases.length !== SM5_SIZE) problems.push(`${cases.length} oppføringer, skal være ${SM5_SIZE}`);

  const ids = new Set<string>();
  for (const { id, description, expected } of cases) {
    if (ids.has(id)) problems.push(`${id}: id brukt flere ganger`);
    ids.add(id);
    if (!CATEGORIES.includes(expected)) problems.push(`${id}: ugyldig kategorikode`);
    if (description !== description.trim()) problems.push(`${id}: teksten er ikke trimmet`);
    const length = [...description.trim()].length;
    if (length < 1) problems.push(`${id}: tom tekst`);
    if (length > DESCRIPTION_MAX) problems.push(`${id}: over ${DESCRIPTION_MAX} tegn`);
  }

  for (const category of CATEGORIES) {
    const count = cases.filter((c) => c.expected === category).length;
    if (count !== SM5_PER_CATEGORY) {
      problems.push(`${category}: ${count} oppføringer, skal være ${SM5_PER_CATEGORY}`);
    }
  }
  return problems;
}
