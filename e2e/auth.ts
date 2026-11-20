import { expect, type Page } from "@playwright/test";

// Felles hjelpere for innloggingen (Story 2.1). Testbrukerne står i
// supabase/seed.sql, og alle har samme passord.

export const PASSWORD = "localfix-test";

/** Menyknappen ☰ i topplinja. */
export const menuButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Meny", exact: true });

/**
 * Åpner menyen i topplinja med musa og gir den åpne menyen
 * (`data-state="open"`). En meny som nettopp ble lukket, for eksempel med
 * «Logg ut», tones ut i 150 ms og er synlig så lenge, med `data-state="closed"`.
 * Den ventes bort først, ellers ville den bli tatt for den åpne menyen og
 * forsvinne rett etterpå. Det var rotårsaken til at «Logg ut» med tastatur i
 * innlogging.spec.ts var ustabil (epic-2-retro-item-6). Klikket prøves på nytt
 * til menyen er åpen.
 */
export async function openMenu(page: Page) {
  const closing = page.getByRole("menu").and(page.locator('[data-state="closed"]'));
  const menu = page.getByRole("menu").and(page.locator('[data-state="open"]'));
  await expect(async () => {
    await expect(closing).toHaveCount(0, { timeout: 1_000 });
    if (!(await menu.isVisible())) await menuButton(page).click();
    await expect(menu).toBeVisible({ timeout: 1_000 });
  }).toPass();
  return menu;
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
