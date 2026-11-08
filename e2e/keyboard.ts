import { expect, type Page } from "@playwright/test";

type Role = Parameters<Page["getByRole"]>[0];

/**
 * Trykker Tab til elementet med rollen og det tilgjengelige navnet har fokus,
 * og sjekker at det er synlig (AC 2). Feiler etter `max` trykk og navngir
 * rollen og navnet.
 */
export async function tabTo(
  page: Page,
  role: Role,
  name: string | RegExp,
  { max = 50 }: { max?: number } = {},
) {
  const target = page.getByRole(role, { name, exact: true });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const focused = await target.evaluateAll((elements) =>
      elements.some((element) => element === document.activeElement),
    );
    if (focused) {
      await expect(target).toBeFocused();
      await expect(target).toBeVisible();
      return target;
    }
  }
  throw new Error(
    `tabTo: ${role} «${String(name)}» fikk ikke fokus etter ${max} trykk på Tab.`,
  );
}
