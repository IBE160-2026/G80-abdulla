// Kjerneflyttesten (AR-14). Etter første `goto` brukes bare `page.keyboard`.
// Hver flate-story utvider testen med tastaturstegene sine (`tabTo` i
// keyboard.ts), axe-sjekken og breddesjekken. Den ligger i endrer-prosjektene,
// fordi den skal endre data fra Story 2.2.
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";
import { tabTo } from "./keyboard";
import { expectNoHorizontalScroll } from "./layout";

test("kjerneflyten med tastatur", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Rapporter" }),
  ).toBeVisible();
  const cards = page.getByRole("main").getByRole("listitem").getByRole("link");
  await expect(cards).toHaveCount(8);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Story 1.4: Tab til topplinjelenken og så gjennom alle kortlenkene, i
  // rekkefølgen i lista. Hvert kort får fokus og rulles inn i bildet.
  await tabTo(page, "link", "LocalFix · Campus Molde", { max: 5 });
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const card = cards.nth(i);
    await expect(card).toBeFocused();
    await expect(card).toBeVisible();
    await expect(card).toBeInViewport();
  }

  // I 360-prosjektet sjekkes også den smaleste bredden, 320 px (NFR-1).
  if (test.info().project.name === "endrer-360") {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
  }
});
