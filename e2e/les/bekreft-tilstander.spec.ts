// Bekreftknappen på detaljsiden i de fem tilstandene (Story 3.3, FR-7, UX-DR14),
// lest fra seed-dataene uten å bekrefte noe: besøkende og innlogget på en
// rapport brukeren ikke har bekreftet (aktiv), egen rapport («Din rapport»),
// allerede bekreftet («Du har sett dette ✓») og den skjulte rapporten 7
// («Skjult rapport», bare moderatoren ser den). De deaktiverte knappene bruker
// aria-disabled, så de kan få fokus, og et trykk endrer ingenting. Besøkende som
// trykker, sendes til innlogging og tilbake. axe og breddesjekk for hver
// tilstand. Seed: rapport 1 har bruker1 som forfatter og to bekreftelser
// (bruker2 og moderator), rapport 2 har bruker2 som forfatter og to
// bekreftelser (bruker1 og moderator), rapport 4 har ingen bekreftelser.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn } from "../auth";
import { tabTo } from "../keyboard";
import { expectNoHorizontalScroll } from "../layout";
import { reportId } from "../list";

const reportUrl = (n: number) => `/rapporter/${reportId(n)}`;

const main = (page: Page) => page.getByRole("main");
const button = (page: Page, name: string) =>
  main(page).getByRole("button", { name, exact: true });
const counter = (page: Page) => main(page).locator('[aria-live="polite"]');

const OPEN = "Jeg har også sett dette";

/** Sjekker at knappen er deaktivert, kan få fokus og ikke gjør noe ved trykk. */
async function expectInert(page: Page, name: string, seen: string) {
  const target = button(page, name);
  await expect(target).toBeVisible();
  await expect(target).toHaveAttribute("aria-disabled", "true");
  await expect(target).not.toHaveAttribute("disabled", /.*/);
  await expect(counter(page)).toHaveText(seen);
  await tabTo(page, "button", name, { max: 20 });
  await page.keyboard.press("Enter");
  // Playwright venter ellers for alltid på en knapp med aria-disabled.
  await target.click({ force: true });
  await expect(counter(page)).toHaveText(seen);
  await expect(target).toBeVisible();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
}

test("en besøkende ser en aktiv knapp, og et trykk sender til innlogging og tilbake", async ({
  page,
}) => {
  await page.goto(reportUrl(4));
  await expect(counter(page)).toHaveText("1 har sett dette");
  const open = button(page, OPEN);
  await expect(open).toBeVisible();
  await expect(open).not.toHaveAttribute("aria-disabled", "true");
  const box = await open.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await open.click();
  await expect(page).toHaveURL(`/auth/login?next=${encodeURIComponent(reportUrl(4))}`);
  // Innlogging og tilbake: knappen er aktiv, og ingenting er bekreftet ennå.
  await logIn(page, "bruker1@localfix.test", { next: reportUrl(4) });
  await expect(counter(page)).toHaveText("1 har sett dette");
  await expect(button(page, OPEN)).not.toHaveAttribute("aria-disabled", "true");
});

test("en innlogget bruker på en rapport hen ikke har bekreftet, ser en aktiv knapp", async ({
  page,
}) => {
  await logIn(page, "bruker1@localfix.test", { next: reportUrl(4) });
  await expect(counter(page)).toHaveText("1 har sett dette");
  await expect(button(page, OPEN)).not.toHaveAttribute("aria-disabled", "true");
  await expect(button(page, OPEN)).toBeEnabled();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});

test("forfatteren ser «Din rapport», deaktivert", async ({ page }) => {
  await logIn(page, "bruker1@localfix.test", { next: reportUrl(1) });
  await expectInert(page, "Din rapport", "3 har sett dette");
});

test("en bruker som har bekreftet, ser «Du har sett dette ✓», deaktivert", async ({ page }) => {
  await logIn(page, "bruker2@localfix.test", { next: reportUrl(1) });
  await expectInert(page, "Du har sett dette ✓", "3 har sett dette");
});

test("moderatoren ser «Skjult rapport» på den skjulte rapporten 7, deaktivert", async ({
  page,
}) => {
  await logIn(page, "moderator@localfix.test", { next: reportUrl(7) });
  await expectInert(page, "Skjult rapport", "2 har sett dette");
});

test("moderatoren har en aktiv knapp på en annens synlige rapport", async ({ page }) => {
  await logIn(page, "moderator@localfix.test", { next: reportUrl(4) });
  await expect(button(page, OPEN)).not.toHaveAttribute("aria-disabled", "true");
  await expect(counter(page)).toHaveText("1 har sett dette");
});

test("axe og breddesjekk ved 320 px for tilstandene (NFR-8)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(reportUrl(4));
  await expect(button(page, OPEN)).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await logIn(page, "bruker2@localfix.test", { next: reportUrl(1) });
  await expect(button(page, "Du har sett dette ✓")).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await page.goto(reportUrl(2));
  await expect(button(page, "Din rapport")).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});
