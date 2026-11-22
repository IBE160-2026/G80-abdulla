// Endre status (Story 4.1, FR-8, UJ-3): moderatorpanelet vises bare for
// moderatoren, med knapper bare til nabostatusene. Et trykk flytter statusen
// ett steg, statusmerket og «Sist oppdatert» viser den nye statusen og
// tidspunktet fra databasen i norsk tid, og fokus står på første statusknapp.
// En endring fra en annen fane gir toast med stale_state, og siden viser
// statusen som gjelder nå. UJ-3: rapportøren ser **Løst** under «Mine
// rapporter» og tidspunktet på detaljsiden. Hver test lager sin egen rapport
// (REST, ikke seed), så testene kan kjøre i begge breddene mot samme database.
// Rapportene blir liggende til neste `db reset`.
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { formatDateTime } from "@/shared/lib/format";
import { expectAccessibleLayout, expectNoSeriousA11yViolations } from "../a11y";
import { createReportAs, readStatusAs, setStatusAs } from "../api";
import { logIn } from "../auth";
import { deleteReportRow } from "../db";
import { tabTo } from "../keyboard";
import { expectNoHorizontalScroll } from "../layout";

const MODERATOR = "moderator@localfix.test";
const BRUKER1 = "bruker1@localfix.test";
const BRUKER2 = "bruker2@localfix.test";

const main = (page: Page) => page.getByRole("main");
const panel = (page: Page) =>
  main(page).getByRole("region", { name: "Moderator", exact: true });
const panelHeading = (page: Page) =>
  main(page).getByRole("heading", { name: "Moderator", exact: true });
/** Statusmerket øverst på detaljsiden: teksten står alene i merket. */
const badge = (page: Page, label: string) => main(page).getByText(label, { exact: true });
const lastUpdated = (page: Page) => main(page).getByText(/^Sist oppdatert /);
/** Knappene i panelet: statusknappene, og «Skjul rapport» sist (Story 4.2). */
const statusButtons = (page: Page) => panel(page).getByRole("button");

/** «Sist oppdatert …» slik siden skal vise tidspunktet databasen satte. */
async function expectedLastUpdated(id: string) {
  const { status_changed_at } = await readStatusAs(MODERATOR, id);
  return `Sist oppdatert ${formatDateTime(status_changed_at)}`;
}

test("panelet vises bare for moderatoren, ikke for rapportøren, en annen bruker eller en besøkende", async ({
  page,
}) => {
  const summary = `Panel ${randomUUID()}`;
  const id = await createReportAs(BRUKER1, summary);
  const url = `/rapporter/${id}`;

  await page.goto(url);
  await expect(main(page).getByRole("heading", { level: 1, name: summary })).toBeVisible();
  await expect(panelHeading(page)).toHaveCount(0);

  for (const email of [BRUKER1, BRUKER2]) {
    await page.context().clearCookies();
    await logIn(page, email, { next: url });
    await expect(main(page).getByRole("heading", { level: 1, name: summary })).toBeVisible();
    await expect(panelHeading(page)).toHaveCount(0);
    await expect(main(page).getByRole("button", { name: /→|←/ })).toHaveCount(0);
    await expect(main(page).getByRole("button", { name: "Skjul rapport", exact: true })).toHaveCount(0);
  }

  await page.context().clearCookies();
  await logIn(page, MODERATOR, { next: url });
  await expect(panelHeading(page)).toBeVisible();
  await expect(panel(page)).toContainText("Status: Ny");
});

test("moderatoren flytter statusen ett steg om gangen med tastatur, og fokus står på første statusknapp", async ({
  page,
}) => {
  const summary = `Status ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });

  // Ny: bare «Under behandling →».
  await expect(badge(page, "Ny")).toBeVisible();
  await expect(panel(page)).toContainText("Status: Ny");
  await expect(statusButtons(page)).toHaveText(["Under behandling →", "Skjul rapport"]);
  // Uten statusendring er «Sist oppdatert» registreringstidspunktet, skrevet
  // som «4. november kl. 14:20».
  await expect(lastUpdated(page)).toHaveText(await expectedLastUpdated(id));
  await expect(lastUpdated(page)).toHaveText(/^Sist oppdatert \d{1,2}\. \p{L}+ kl\. \d{2}:\d{2}$/u);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await tabTo(page, "button", "Under behandling →", { max: 30 });
  await page.keyboard.press("Enter");

  // Under behandling: merket, panelet og «Sist oppdatert» følger med, og
  // fokus står på første statusknapp, «← Ny».
  await expect(badge(page, "Under behandling")).toBeVisible();
  await expect(panel(page)).toContainText("Status: Under behandling");
  await expect(statusButtons(page)).toHaveText(["← Ny", "Løst →", "Skjul rapport"]);
  await expect(statusButtons(page).first()).toBeFocused();
  await expect(lastUpdated(page)).toHaveText(await expectedLastUpdated(id));
  expect((await readStatusAs(MODERATOR, id)).status).toBe("in_progress");
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  await expectAccessibleLayout(page);

  // «Løst →» er neste knapp. Løst gir bare «← Under behandling», med fokus.
  await page.keyboard.press("Tab");
  await expect(panel(page).getByRole("button", { name: "Løst →", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(badge(page, "Løst")).toBeVisible();
  await expect(panel(page)).toContainText("Status: Løst");
  await expect(statusButtons(page)).toHaveText(["← Under behandling", "Skjul rapport"]);
  await expect(statusButtons(page).first()).toBeFocused();
  await expect(lastUpdated(page)).toHaveText(await expectedLastUpdated(id));
  await expectNoSeriousA11yViolations(page);

  // Og tilbake ett steg.
  await page.keyboard.press("Enter");
  await expect(badge(page, "Under behandling")).toBeVisible();
  await expect(statusButtons(page)).toHaveText(["← Ny", "Løst →", "Skjul rapport"]);
  await expect(statusButtons(page).first()).toBeFocused();

  // Statusen står etter omlasting.
  await page.reload();
  await expect(badge(page, "Under behandling")).toBeVisible();
  await expect(lastUpdated(page)).toHaveText(await expectedLastUpdated(id));
});

test("knappene er aria-disabled mens endringen lagres, og fokus blir på knappen", async ({
  page,
}) => {
  const summary = `Lagrer ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });

  // Server Action er en POST til siden. Den holdes igjen til knappen er sjekket.
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route(`**${url}`, async (route) => {
    if (route.request().method() === "POST") {
      posts += 1;
      await held;
    }
    await route.continue();
  });

  const forward = panel(page).getByRole("button", { name: "Under behandling →", exact: true });
  await forward.click();
  // aria-disabled, ikke disabled: knappen beholder fokus mens den lagrer, og
  // fokus står aldri på body. Et nytt trykk gjør ingenting.
  await expect(forward).toBeDisabled();
  await expect(forward).toHaveAttribute("aria-disabled", "true");
  await expect(forward).not.toHaveAttribute("disabled", /.*/);
  await expect(forward).toBeFocused();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  await page.keyboard.press("Enter");
  await expect(forward).toBeFocused();
  expect(posts).toBe(1);
  release();
  await expect(statusButtons(page)).toHaveText(["← Ny", "Løst →", "Skjul rapport"]);
  for (const button of await statusButtons(page).all()) await expect(button).toBeEnabled();
  await expect(statusButtons(page).first()).toBeFocused();
  // Bare ett kall gikk ut, selv med et nytt trykk mens det lagret.
  expect(posts).toBe(1);
});

test("en feil gir toast, statusen står, og et nytt forsøk virker", async ({ page }) => {
  const summary = `Nettverksfeil ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });
  await expect(statusButtons(page)).toHaveText(["Under behandling →", "Skjul rapport"]);

  // Server Action er en POST til siden. Avbrutt forespørsel gjør at handlingen kaster.
  const pattern = `**${url}`;
  await page.route(pattern, (route) => {
    if (route.request().method() === "POST") return route.abort();
    return route.continue();
  });

  await tabTo(page, "button", "Under behandling →", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(
    page.locator("[data-sonner-toast]").getByText("Noe gikk galt. Prøv igjen.", { exact: true }),
  ).toBeVisible();
  await expect(badge(page, "Ny")).toBeVisible();
  await expect(panel(page)).toContainText("Status: Ny");
  await expect(statusButtons(page)).toHaveText(["Under behandling →", "Skjul rapport"]);
  await expect(statusButtons(page).first()).toBeEnabled();
  await expect(statusButtons(page).first()).toBeFocused();
  expect((await readStatusAs(MODERATOR, id)).status).toBe("new");

  await page.unroute(pattern);
  await page.keyboard.press("Enter");
  await expect(badge(page, "Under behandling")).toBeVisible();
  await expect(statusButtons(page)).toHaveText(["← Ny", "Løst →", "Skjul rapport"]);
  await expect(statusButtons(page).first()).toBeFocused();
  expect((await readStatusAs(MODERATOR, id)).status).toBe("in_progress");
});

test("en rapport som er borte når statusen skal endres, gir toast, og knappene virker igjen", async ({
  page,
}) => {
  const summary = `Borte status ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });
  await expect(statusButtons(page)).toHaveText(["Under behandling →", "Skjul rapport"]);

  // Rapporten finnes ikke lenger (her slettet rett i databasen, siden ingen
  // klient kan slette): handlingen får null rader og svarer report_not_found,
  // ikke stale_state. Raden er laget av denne testen.
  deleteReportRow(id);
  await expect(readStatusAs(MODERATOR, id)).rejects.toThrow();

  await tabTo(page, "button", "Under behandling →", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(
    page.locator("[data-sonner-toast]").getByText("Fant ikke rapporten.", { exact: true }),
  ).toBeVisible();
  // Ikke stale_state: den meldingen står ikke i noen toast.
  await expect(
    page.locator("[data-sonner-toast]").getByText(/Rapporten er endret/),
  ).toHaveCount(0);
  // Panelet står som før, knappene er aktive igjen, og fokus står på første knapp.
  await expect(panel(page)).toContainText("Status: Ny");
  await expect(statusButtons(page)).toHaveText(["Under behandling →", "Skjul rapport"]);
  await expect(statusButtons(page).first()).not.toHaveAttribute("aria-disabled", "true");
  await expect(statusButtons(page).first()).toBeFocused();
  await expectNoSeriousA11yViolations(page);
});

test("en endring fra en annen fane gir toast, og siden viser statusen som gjelder nå", async ({
  page,
}) => {
  const summary = `Utdatert ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;
  await logIn(page, MODERATOR, { next: url });
  await expect(statusButtons(page)).toHaveText(["Under behandling →", "Skjul rapport"]);

  // En annen fane (her direkte mot API-et med moderatorens sesjon) flytter
  // statusen, mens denne siden fortsatt viser Ny.
  await setStatusAs(MODERATOR, id, "new", "in_progress");

  await tabTo(page, "button", "Under behandling →", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(
    page
      .locator("[data-sonner-toast]")
      .getByText("Rapporten er endret. Last siden på nytt og prøv igjen.", { exact: true }),
  ).toBeVisible();
  await expect(badge(page, "Under behandling")).toBeVisible();
  await expect(panel(page)).toContainText("Status: Under behandling");
  await expect(statusButtons(page)).toHaveText(["← Ny", "Løst →", "Skjul rapport"]);
  await expect(statusButtons(page).first()).toBeFocused();
  // Ingen endring fra denne fanen: statusen er fortsatt in_progress.
  expect((await readStatusAs(MODERATOR, id)).status).toBe("in_progress");
  await expectNoSeriousA11yViolations(page);
});

test("UJ-3: moderatoren setter en ny rapport til Løst, og rapportøren ser Løst og tidspunktet", async ({
  page,
  browser,
}) => {
  const summary = `UJ-3 ${randomUUID()}`;
  const id = await createReportAs(BRUKER2, summary);
  const url = `/rapporter/${id}`;

  // Moderatoren sorterer på «Flest har sett», åpner rapporten og flytter den
  // til Løst i to steg.
  await logIn(page, MODERATOR, { next: "/?sort=confirmations" });
  await main(page).getByRole("link", { name: new RegExp(summary) }).click();
  await expect(page).toHaveURL(url);
  await panel(page).getByRole("button", { name: "Under behandling →", exact: true }).click();
  await expect(badge(page, "Under behandling")).toBeVisible();
  await panel(page).getByRole("button", { name: "Løst →", exact: true }).click();
  await expect(badge(page, "Løst")).toBeVisible();
  const shown = await expectedLastUpdated(id);
  await expect(lastUpdated(page)).toHaveText(shown);

  // Rapportøren, i en egen nettleserøkt, ser Løst under «Mine rapporter» og
  // «Sist oppdatert» med tidspunktet på detaljsiden, uten panelet.
  const reporterContext = await browser.newContext({ viewport: page.viewportSize() });
  const reporter = await reporterContext.newPage();
  await logIn(reporter, BRUKER2, { next: "/?mine=true" });
  const card = main(reporter).getByRole("link", { name: new RegExp(summary) });
  await expect(card).toContainText("Løst");
  await card.click();
  await expect(reporter).toHaveURL(url);
  await expect(badge(reporter, "Løst")).toBeVisible();
  await expect(lastUpdated(reporter)).toHaveText(shown);
  await expect(panelHeading(reporter)).toHaveCount(0);
  await expectNoSeriousA11yViolations(reporter);
  await reporterContext.close();
});
