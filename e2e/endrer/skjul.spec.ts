// Skjule og vise en rapport (Story 4.2, FR-9): «Skjul rapport» i
// moderatorpanelet åpner en AlertDialog. «Avbryt» og Escape lukker den uten
// endring og gir fokus tilbake til «Skjul rapport». Bekreftelsen skjuler
// rapporten, fokus går til «Vis rapport», og moderatoren ser «Skjult» og grå
// bakgrunn i lista og på detaljsiden, også etter omlasting. Rapportøren, en
// annen bruker og en besøkende ser den ikke i lista eller i «Mine rapporter»,
// og lenken gir 404 med «Fant ikke rapporten.». «Vis rapport» viser den igjen
// uten dialog, med fokus på «Skjul rapport». status_changed_at står stille
// hele veien. En nettverksfeil gir toast og ingen endring. Mens den lagrer, er
// knappen aria-disabled og beholder fokus. En skjuling fra en annen fane
// kommer inn i panelet ved neste revalidering. En rapport som er borte når den
// skal skjules, gir toast. axe på den åpne dialogen, lista med en skjult rapport
// og detaljsiden. Hver test lager sin egen rapport
// (REST, ikke seed), så testene kan kjøre i begge breddene mot samme database.
// Rapportene blir liggende til neste `db reset`.
import { randomUUID } from "node:crypto";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectAccessibleLayout, expectNoSeriousA11yViolations } from "../a11y";
import { createReportAs, readHiddenAs, setHiddenAs } from "../api";
import { logIn } from "../auth";
import { deleteReportRow } from "../db";
import { tabTo } from "../keyboard";
import { expectNoHorizontalScroll } from "../layout";

const MODERATOR = "moderator@localfix.test";
const BRUKER1 = "bruker1@localfix.test";
const BRUKER2 = "bruker2@localfix.test";

/** `hidden-bg` (#EEF0F2) fra DESIGN.md, slik nettleseren regner den ut. */
const HIDDEN_BG = "rgb(238, 240, 242)";

const main = (page: Page) => page.getByRole("main");
const panel = (page: Page) =>
  main(page).getByRole("region", { name: "Moderator", exact: true });
const hideButton = (page: Page) =>
  panel(page).getByRole("button", { name: "Skjul rapport", exact: true });
const showButton = (page: Page) =>
  panel(page).getByRole("button", { name: "Vis rapport", exact: true });
const dialog = (page: Page) => page.getByRole("alertdialog", { name: "Skjule rapporten?" });
const hiddenBadge = (page: Page) => main(page).getByText("Skjult", { exact: true });
const article = (page: Page) => main(page).locator("article");
const cardLink = (page: Page, summary: string) =>
  main(page).getByRole("link", { name: new RegExp(summary) });

/** Lister med og uten «Mine rapporter»: rapporten skal ikke stå i noen av dem. */
async function expectGoneFor(page: Page, summary: string, url: string, mine: boolean) {
  for (const path of mine ? ["/", "/?mine=true"] : ["/"]) {
    await page.goto(path);
    // Lista er lastet (ikke skjelettet): alle testbrukerne har seed-rapporter.
    await expect(main(page).getByRole("listitem").getByRole("link").first()).toBeVisible();
    await expect(cardLink(page, summary)).toHaveCount(0);
  }
  const response = await page.goto(url);
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Fant ikke rapporten." }),
  ).toBeVisible();
  await expect(page.getByText(summary)).toHaveCount(0);
}

/** En egen nettleserøkt med samme bredde, logget inn som `email` (eller besøkende). */
async function otherSession(browser: Browser, page: Page, email: string | null) {
  const context = await browser.newContext({ viewport: page.viewportSize() });
  const other = await context.newPage();
  if (email) await logIn(other, email);
  return { context, other };
}

test("moderatoren skjuler med tastatur etter bekreftelse, og bare moderatoren ser rapporten etterpå", async ({
  page,
  browser,
}) => {
  const summary = `Skjul ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  const before = await readHiddenAs(MODERATOR, id);
  expect(before?.hidden).toBe(false);

  // Rapportøren ser rapporten under «Mine rapporter» før den skjules.
  const reporter = await otherSession(browser, page, BRUKER2);
  await reporter.other.goto("/?mine=true");
  await expect(cardLink(reporter.other, summary)).toBeVisible();

  await logIn(page, MODERATOR, { next: url });
  await expect(hideButton(page)).toBeVisible();
  await expect(hiddenBadge(page)).toHaveCount(0);

  // Escape lukker dialogen uten endring, og fokus går tilbake.
  await tabTo(page, "button", "Skjul rapport", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toContainText(
    "Rapporten blir borte for alle andre, også for den som sendte den inn. Ingenting slettes, og du kan vise den igjen.",
  );
  await expect(dialog(page).getByRole("button")).toHaveText(["Avbryt", "Skjul rapport"]);
  await expect(dialog(page).getByRole("button", { name: "Avbryt", exact: true })).toBeFocused();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(hideButton(page)).toBeFocused();

  // «Avbryt» lukker den også uten endring.
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole("button", { name: "Avbryt", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toHaveCount(0);
  await expect(hideButton(page)).toBeFocused();
  expect(await readHiddenAs(MODERATOR, id)).toEqual(before);

  // Bekreftelsen skjuler rapporten, og fokus står på «Vis rapport».
  await page.keyboard.press("Enter");
  await expect(dialog(page).getByRole("button", { name: "Avbryt", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const confirm = dialog(page).getByRole("button", { name: "Skjul rapport", exact: true });
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toHaveCount(0);
  await expect(showButton(page)).toBeFocused();
  await expect(hideButton(page)).toHaveCount(0);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  // Skjuling flytter ikke status_changed_at og sletter ingenting.
  expect(await readHiddenAs(MODERATOR, id)).toEqual({ ...before, hidden: true });

  // Detaljsiden: «Skjult» ved statusmerket og «Skjult rapport» på bekreftknappen.
  await expect(hiddenBadge(page)).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Skjult rapport", exact: true })).toBeVisible();
  await expect(article(page)).toHaveCSS("background-color", HIDDEN_BG);
  await expectAccessibleLayout(page);

  // Etter omlasting starter panelet fra serveren på «Vis rapport».
  await page.reload();
  await expect(showButton(page)).toBeVisible();
  await expect(hideButton(page)).toHaveCount(0);
  await expect(hiddenBadge(page)).toBeVisible();
  await expect(article(page)).toHaveCSS("background-color", HIDDEN_BG);

  // Lista: kortet står blandet inn med «Skjult» og grå bakgrunn.
  await page.goto("/");
  const card = cardLink(page, summary);
  await expect(card).toBeVisible();
  await expect(card.getByText("Skjult", { exact: true })).toBeVisible();
  await expect(card.locator("> div")).toHaveCSS("background-color", HIDDEN_BG);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Rapportøren, en annen bruker og en besøkende ser den ikke, og lenken gir 404.
  await expectGoneFor(reporter.other, summary, url, true);
  await reporter.context.close();
  const otherUser = await otherSession(browser, page, BRUKER1);
  await expectGoneFor(otherUser.other, summary, url, true);
  await otherUser.context.close();
  const visitor = await otherSession(browser, page, null);
  await expectGoneFor(visitor.other, summary, url, false);
  await visitor.context.close();
});

test("«Vis rapport» viser rapporten igjen uten dialog, og fokus går til «Skjul rapport»", async ({
  page,
  browser,
}) => {
  const summary = `Vis ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  const before = await readHiddenAs(MODERATOR, id);
  await logIn(page, MODERATOR, { next: url });

  await hideButton(page).click();
  await dialog(page).getByRole("button", { name: "Skjul rapport", exact: true }).click();
  await expect(showButton(page)).toBeFocused();
  await expect(article(page)).toHaveCSS("background-color", HIDDEN_BG);

  await page.keyboard.press("Enter");
  await expect(dialog(page)).toHaveCount(0);
  await expect(hideButton(page)).toBeFocused();
  await expect(hiddenBadge(page)).toHaveCount(0);
  await expect(article(page)).not.toHaveCSS("background-color", HIDDEN_BG);
  await expect(main(page).getByRole("button", { name: "Skjult rapport", exact: true })).toHaveCount(0);
  expect(await readHiddenAs(MODERATOR, id)).toEqual(before);

  // Kortet i lista er vanlig igjen.
  await page.goto("/");
  const card = cardLink(page, summary);
  await expect(card).toBeVisible();
  await expect(card.getByText("Skjult", { exact: true })).toHaveCount(0);
  await expect(card.locator("> div")).not.toHaveCSS("background-color", HIDDEN_BG);

  // Rapportøren ser den igjen under «Mine rapporter» og på detaljsiden.
  const reporter = await otherSession(browser, page, BRUKER2);
  await reporter.other.goto("/?mine=true");
  await expect(cardLink(reporter.other, summary)).toBeVisible();
  const response = await reporter.other.goto(url);
  expect(response?.status()).toBe(200);
  await expect(main(reporter.other).getByRole("heading", { level: 1, name: summary })).toBeVisible();
  await reporter.context.close();
});

test("knappen er deaktivert mens skjulingen lagres", async ({ page }) => {
  const summary = `Lagrer skjul ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });

  // Server Action er en POST til siden. Den holdes igjen til knappen er sjekket.
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**${url}`, async (route) => {
    if (route.request().method() === "POST") await held;
    await route.continue();
  });

  await hideButton(page).click();
  await dialog(page).getByRole("button", { name: "Skjul rapport", exact: true }).click();
  // aria-disabled, ikke disabled: knappen beholder fokus mens den lagrer, og
  // fokus står aldri på body. Et nytt trykk åpner ikke dialogen.
  await expect(hideButton(page)).toBeDisabled();
  await expect(hideButton(page)).toHaveAttribute("aria-disabled", "true");
  await expect(hideButton(page)).toBeFocused();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toHaveCount(0);
  await expect(hideButton(page)).toBeFocused();
  release();
  await expect(showButton(page)).toBeEnabled();
  await expect(showButton(page)).toBeFocused();
  expect((await readHiddenAs(MODERATOR, id))?.hidden).toBe(true);
});

test("en skjuling fra en annen fane kommer inn i panelet ved neste revalidering", async ({
  page,
}) => {
  const summary = `Annen fane ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });
  await expect(hideButton(page)).toBeVisible();

  // En annen fane (her REST med moderatorens sesjon) skjuler rapporten, mens
  // denne siden fortsatt viser «Skjul rapport».
  await setHiddenAs(MODERATOR, id, true);
  await expect(hideButton(page)).toBeVisible();

  // Et statussteg revaliderer siden, og panelet tar inn hidden fra serveren.
  await panel(page).getByRole("button", { name: "Under behandling →", exact: true }).click();
  await expect(panel(page)).toContainText("Status: Under behandling");
  await expect(showButton(page)).toBeVisible();
  await expect(hideButton(page)).toHaveCount(0);
  await expect(hiddenBadge(page)).toBeVisible();
  await expect(article(page)).toHaveCSS("background-color", HIDDEN_BG);
});

test("en nettverksfeil gir toast, rapporten er fortsatt synlig, og et nytt forsøk virker", async ({
  page,
}) => {
  const summary = `Nettverksfeil skjul ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });

  // Avbrutt forespørsel gjør at Server Action kaster.
  const pattern = `**${url}`;
  await page.route(pattern, (route) => {
    if (route.request().method() === "POST") return route.abort();
    return route.continue();
  });

  const cancel = dialog(page).getByRole("button", { name: "Avbryt", exact: true });
  const confirm = dialog(page).getByRole("button", { name: "Skjul rapport", exact: true });
  await tabTo(page, "button", "Skjul rapport", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.locator("[data-sonner-toast]").getByText("Noe gikk galt. Prøv igjen.", { exact: true }),
  ).toBeVisible();
  await expect(hideButton(page)).toBeEnabled();
  await expect(hideButton(page)).toBeFocused();
  await expect(hiddenBadge(page)).toHaveCount(0);
  expect((await readHiddenAs(MODERATOR, id))?.hidden).toBe(false);
  await expectNoSeriousA11yViolations(page);

  await page.unroute(pattern);
  await page.keyboard.press("Enter");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(showButton(page)).toBeFocused();
  await expect(hiddenBadge(page)).toBeVisible();
  expect((await readHiddenAs(MODERATOR, id))?.hidden).toBe(true);
});

test("en rapport som er borte når den skal skjules, gir toast, og fokus blir på «Skjul rapport»", async ({
  page,
}) => {
  const summary = `Borte skjul ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });
  await expect(hideButton(page)).toBeVisible();

  // Rapporten finnes ikke lenger (her slettet rett i databasen, siden ingen
  // klient kan slette): handlingen får null rader og svarer report_not_found.
  // Raden er laget av denne testen.
  deleteReportRow(id);
  expect(await readHiddenAs(MODERATOR, id)).toBeNull();

  const cancel = dialog(page).getByRole("button", { name: "Avbryt", exact: true });
  const confirm = dialog(page).getByRole("button", { name: "Skjul rapport", exact: true });
  await tabTo(page, "button", "Skjul rapport", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.locator("[data-sonner-toast]").getByText("Fant ikke rapporten.", { exact: true }),
  ).toBeVisible();
  // Dialogen er lukket, knappen er aktiv igjen og har fokus, og ingenting er skjult.
  await expect(dialog(page)).toHaveCount(0);
  await expect(hideButton(page)).not.toHaveAttribute("aria-disabled", "true");
  await expect(hideButton(page)).toBeFocused();
  await expect(showButton(page)).toHaveCount(0);
  await expect(hiddenBadge(page)).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
});
