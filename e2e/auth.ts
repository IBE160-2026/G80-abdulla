import { expect, type Page } from "@playwright/test";

// Felles hjelpere for innloggingen (Story 2.1). Testbrukerne står i
// supabase/seed.sql, og alle har samme passord.

export const PASSWORD = "localfix-test";

/** Menyknappen ☰ i topplinja. */
export const menuButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Meny", exact: true });

/**
 * Åpner menyen i topplinja med musa og gir menyen. Rett etter innlogging
 * eller utlogging kan `router.refresh()` flytte fokus og lukke menyen igjen,
 * så klikket prøves på nytt til menyen blir stående åpen.
 */
export async function openMenu(page: Page) {
  const menu = page.getByRole("menu");
  await expect(async () => {
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
