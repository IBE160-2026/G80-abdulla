// Felles hjelpere for lista på forsiden og testrapportene fra seed, brukt av
// spec-filene i e2e/les/. Samlet her etter retroen for Epic 3 (handlingspunkt 2,
// `epic-3-retro-item-16`), siden hver story hadde laget sin egen kopi.
import { expect, type Page } from "@playwright/test";

/** Id-en til testrapport nummer `n` i seed.sql, med nuller foran nummeret. */
export const reportId = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** Lenkene på rapportkortene i lista, i den rekkefølgen de vises. */
export const cardLinks = (page: Page) =>
  page.getByRole("main").getByRole("listitem").getByRole("link");

/** Nummeret til testrapportene som vises i lista, i rekkefølge. */
export async function shownReports(page: Page): Promise<number[]> {
  // Lista strømmes inn bak en lasteskjerm («Laster rapportene …»). Uten ventingen
  // kan kortene leses før de er kommet, og svaret er da en tom liste.
  await expect(page.getByText("Laster rapportene …", { exact: true })).toHaveCount(0);
  const hrefs = await cardLinks(page).evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href") ?? ""),
  );
  // Siste del av uuid-en er rapportnummeret, med nuller foran.
  return hrefs.map((h) => Number(h.split("-").pop()));
}

/** En filterbrikke i lista (knapp med `aria-pressed`). */
export const chip = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

/** Sorteringsvalget over lista. */
export const sortSelect = (page: Page) =>
  page.getByRole("combobox", { name: "Sortering", exact: true });
