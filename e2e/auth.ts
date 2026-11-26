import { expect, type Page } from "@playwright/test";

// Felles hjelpere for innloggingen (Story 2.1). Testbrukerne står i
// supabase/seed.sql, og alle har samme passord.

export const PASSWORD = "localfix-test";

/** Menyknappen ☰ i topplinja. */
export const menuButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Meny", exact: true });

/**
 * Panelet som ☰ åpner: en gruppe med navnet «Konto». Det er ikke i DOM-en
 * når det er lukket.
 */
export const menuPanel = (page: Page) =>
  page.getByRole("group", { name: "Konto", exact: true });

/**
 * Åpner menyen i topplinja med musa og gir panelet. Panelet toner ikke inn
 * eller ut og er borte fra DOM-en med en gang det lukkes, så det finnes ikke
 * noe «lukkes»-vindu som kan tas for et åpent panel (epic-2-retro-item-6).
 * Klikket prøves på nytt til panelet er der, for en knapp som klikkes før
 * siden er hydrert, gjør ingenting.
 */
export async function openMenu(page: Page) {
  const panel = menuPanel(page);
  await expect(async () => {
    if (!(await panel.isVisible())) await menuButton(page).click();
    await expect(panel).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await expect(menuButton(page)).toHaveAttribute("aria-expanded", "true");
  return panel;
}

/**
 * Logger inn med skjemaet på `/auth/login`, eventuelt med `next`, og venter
 * til brukeren er på `expectedUrl` (standard: `next`, ellers lista).
 */
export async function logIn(
  page: Page,
  email: string,
  { next, expectedUrl }: { next?: string; expectedUrl?: string } = {},
) {
  await page.goto(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login");
  await page.getByLabel("E-post", { exact: true }).fill(email);
  await page.getByLabel("Passord", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Logg inn", exact: true }).click();
  await expect(page).toHaveURL(expectedUrl ?? next ?? "/");
}
