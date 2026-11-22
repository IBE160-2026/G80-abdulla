// Bekrefte en rapport (Story 3.3, FR-7, UJ-2): en besøkende sendes til
// innlogging og tilbake, en innlogget bruker bekrefter bare med tastatur, telleren
// går opp med en gang og står igjen etter omlasting, knappen beholder fokus,
// endringen leses opp med aria-live, «Flest har sett» bruker det nye antallet,
// og en feil gir toast og setter telleren tilbake. Hver test lager sin egen
// rapport som forfatter (REST, ikke seed), så testene avhenger ikke av tallene
// i seed og kan kjøre i begge breddene mot samme database. Rapportene og
// bekreftelsene blir liggende til neste `db reset`.
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { expectAccessibleLayout, expectNoSeriousA11yViolations } from "../a11y";
import { createReportAs } from "../api";
import { logIn, PASSWORD } from "../auth";
import { tabTo } from "../keyboard";
import { expectNoHorizontalScroll } from "../layout";

const BRUKER2 = "bruker2@localfix.test";
// Seed-rapportene som lista sorteres mot: 1 og 2 har to bekreftelser, 3 og 6 én.
const SEED_1 = "20000000-0000-4000-8000-000000000001";
const SEED_2 = "20000000-0000-4000-8000-000000000002";
const SEED_3 = "20000000-0000-4000-8000-000000000003";
const SEED_6 = "20000000-0000-4000-8000-000000000006";
const OPEN = "Jeg har også sett dette";
const DONE = "Du har sett dette ✓";

const main = (page: Page) => page.getByRole("main");
const button = (page: Page, name: string) =>
  main(page).getByRole("button", { name, exact: true });
const counter = (page: Page) => main(page).locator('[aria-live="polite"]');

/** Rekkefølgen av rapportlenkene i lista, som id-er. */
async function listedIds(page: Page): Promise<string[]> {
  const hrefs = await main(page)
    .getByRole("listitem")
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  return hrefs.map((href) => href.replace("/rapporter/", ""));
}

test("en besøkende sendes til innlogging og tilbake, og bekrefter bare med tastatur", async ({
  page,
}) => {
  const summary = `Bekreftelse ${randomUUID()}`;
  const id = await createReportAs("bruker1@localfix.test", summary);
  const url = `/rapporter/${id}`;

  // Før bekreftelsen har rapporten ingen bekreftelser og står under rapport 3
  // og 6, som har én hver, på «Flest har sett».
  await page.goto("/?sort=confirmations");
  await expect(main(page).getByRole("link", { name: new RegExp(summary) })).toBeVisible();
  const before = await listedIds(page);
  for (const listed of [id, SEED_3, SEED_6]) expect(before).toContain(listed);
  expect(before.indexOf(id)).toBeGreaterThan(before.indexOf(SEED_3));
  expect(before.indexOf(id)).toBeGreaterThan(before.indexOf(SEED_6));

  // Besøkende: knappen er aktiv og viser «1 har sett dette».
  await page.goto(url);
  await expect(main(page).getByRole("heading", { level: 1, name: summary })).toBeVisible();
  await expect(counter(page)).toHaveText("1 har sett dette");
  await expect(button(page, OPEN)).not.toHaveAttribute("aria-disabled", "true");
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Tab til knappen og Enter sender til innlogging med veien tilbake.
  await tabTo(page, "button", OPEN, { max: 20 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/auth/login?next=${encodeURIComponent(url)}`);
  await tabTo(page, "textbox", "E-post", { max: 5 });
  await page.keyboard.type(BRUKER2);
  await page.keyboard.press("Tab");
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(url);

  // Tilbake på detaljsiden er knappen aktiv, og telleren er uendret.
  await expect(main(page).getByRole("heading", { level: 1, name: summary })).toBeVisible();
  await expect(counter(page)).toHaveText("1 har sett dette");
  await expect(button(page, OPEN)).not.toHaveAttribute("aria-disabled", "true");
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Bekreft med tastatur. Telleren går opp, knappen er «Du har sett dette ✓»,
  // deaktivert med aria-disabled, og beholder fokus.
  await tabTo(page, "button", OPEN, { max: 20 });
  await page.keyboard.press("Enter");
  await expect(counter(page)).toHaveText("2 har sett dette");
  await expect(counter(page)).toHaveAttribute("aria-atomic", "true");
  const done = button(page, DONE);
  await expect(done).toBeVisible();
  await expect(done).toHaveAttribute("aria-disabled", "true");
  await expect(done).toBeFocused();
  await expect(button(page, OPEN)).toHaveCount(0);
  // Et nytt trykk gjør ingenting, og fokus blir stående.
  await page.keyboard.press("Enter");
  await expect(counter(page)).toHaveText("2 har sett dette");
  await expect(done).toBeFocused();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  await expectAccessibleLayout(page);

  // Tallet står igjen etter omlasting, og knappen er fortsatt «Du har sett dette ✓».
  await page.reload();
  await expect(counter(page)).toHaveText("2 har sett dette");
  await expect(button(page, DONE)).toHaveAttribute("aria-disabled", "true");

  // Lista bruker det nye antallet: kortet viser «2 har sett dette», og
  // rapporten står nå over rapport 3 og 6 (én bekreftelse hver, eldre).
  await page.goto("/?sort=confirmations");
  const card = main(page).getByRole("link", { name: new RegExp(summary) });
  await expect(card).toContainText("2 har sett dette");
  const after = await listedIds(page);
  for (const listed of [id, SEED_1, SEED_2, SEED_3, SEED_6]) expect(after).toContain(listed);
  expect(after.indexOf(id)).toBeLessThan(after.indexOf(SEED_3));
  expect(after.indexOf(id)).toBeLessThan(after.indexOf(SEED_6));
  // Rapport 1 og 2 har to bekreftelser og står fortsatt øverst.
  expect(after.indexOf(id)).toBeGreaterThan(after.indexOf(SEED_1));
  expect(after.indexOf(id)).toBeGreaterThan(after.indexOf(SEED_2));
});

test("forfatteren ser «Din rapport», og trykk gjør ingenting", async ({ page }) => {
  const summary = `Egen rapport ${randomUUID()}`;
  const id = await createReportAs("bruker1@localfix.test", summary);
  await logIn(page, "bruker1@localfix.test", { next: `/rapporter/${id}` });

  const own = button(page, "Din rapport");
  await expect(own).toHaveAttribute("aria-disabled", "true");
  await expect(counter(page)).toHaveText("1 har sett dette");
  // Playwright venter ellers for alltid på en knapp med aria-disabled.
  await own.click({ force: true });
  await expect(counter(page)).toHaveText("1 har sett dette");
  await expect(own).toBeVisible();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
});

test("en feil gir toast, setter telleren tilbake, og et nytt forsøk virker", async ({ page }) => {
  const summary = `Feil ${randomUUID()}`;
  const id = await createReportAs("bruker1@localfix.test", summary);
  const url = `/rapporter/${id}`;
  await logIn(page, BRUKER2, { next: url });
  await expect(counter(page)).toHaveText("1 har sett dette");

  // Server Action er en POST til siden. Avbrutt forespørsel gir en feil.
  let blocked = true;
  await page.route(`**${url}`, (route) => {
    if (blocked && route.request().method() === "POST") return route.abort();
    return route.continue();
  });

  await button(page, OPEN).click();
  await expect(
    page.locator("[data-sonner-toast]").getByText("Noe gikk galt. Prøv igjen.", { exact: true }),
  ).toBeVisible();
  await expect(counter(page)).toHaveText("1 har sett dette");
  await expect(button(page, OPEN)).not.toHaveAttribute("aria-disabled", "true");
  await expect(button(page, DONE)).toHaveCount(0);

  blocked = false;
  await button(page, OPEN).click();
  await expect(counter(page)).toHaveText("2 har sett dette");
  await expect(button(page, DONE)).toHaveAttribute("aria-disabled", "true");
});

test("en bekreftelse fra en annen fane gir «Du har sett dette ✓» uten toast", async ({
  page,
  context,
}) => {
  const summary = `To faner ${randomUUID()}`;
  const id = await createReportAs("bruker1@localfix.test", summary);
  const url = `/rapporter/${id}`;
  await logIn(page, BRUKER2, { next: url });
  await expect(counter(page)).toHaveText("1 har sett dette");

  // Samme bruker bekrefter i en annen fane, mens denne fortsatt viser en aktiv knapp.
  const other = await context.newPage();
  await other.goto(url);
  await button(other, OPEN).click();
  await expect(button(other, DONE)).toBeVisible();
  await other.close();

  await button(page, OPEN).click();
  await expect(button(page, DONE)).toHaveAttribute("aria-disabled", "true");
  await expect(counter(page)).toHaveText("2 har sett dette");
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
});
