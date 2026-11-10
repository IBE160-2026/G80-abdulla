// KI-forslag i skjemaet (Story 2.3, FR-4, UX-DR10, UX-DR11): forslaget hentes
// når brukeren forlater beskrivelsen, med spinner, pillen «Foreslått av KI» og
// en usynlig aria-live-region som leser opp kategorien. Manuelt valg går foran
// og låser kategorien, utdaterte svar forkastes, terskelen er 10 endrede tegn,
// testordet og en feil gir «Vi fikk ikke et forslag», oppsummeringen kan
// endres (300 tegn) og lagres, og vises i lista og på detaljsiden. axe og
// breddesjekk på 360, 320 og 1280 px. AI_PROVIDER=mock settes av
// playwright.config.ts, så ingen tekst forlater maskinen. Testene lager
// rapporter, så de ligger i endrer-prosjektene.
import { randomUUID } from "node:crypto";
import { expect, test, type Page, type Request } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn } from "../auth";
import { expectNoHorizontalScroll } from "../layout";

const NEW_REPORT = "/rapporter/ny";

const description = (page: Page) => page.getByLabel("Beskrivelse", { exact: true });
const location = (page: Page) => page.getByLabel("Lokasjon", { exact: true });
const category = (page: Page) => page.getByRole("combobox", { name: "Kategori", exact: true });
const submit = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: /^(Send inn|Sender …)$/ });
const loading = (page: Page) => page.getByText("Finner kategori …", { exact: true });
const aiTag = (page: Page) => page.getByText("Foreslått av KI", { exact: true });
const noSuggestion = (page: Page) =>
  page.getByText("Vi fikk ikke et forslag. Velg kategori selv.", { exact: true });
const editButton = (page: Page) => page.getByRole("button", { name: "Endre", exact: true });
const summaryField = (page: Page) => page.getByLabel("Oppsummering", { exact: true });
// Oppsummeringen som lesetekst. Teksten står også i beskrivelsen (textarea), så bare avsnitt teller.
const summaryText = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).and(page.locator("p"));
const liveRegion = (page: Page) => page.locator('p[aria-live="polite"]');
const main = (page: Page) => page.getByRole("main");

const CATEGORY_ORDER = ["Søppel", "Belysning", "Vei og fortau", "Skadeverk", "Annet"];

/** Velger en kategori med tastatur når lista er tom: åpner lista, piler og Enter. */
async function chooseCategory(page: Page, label: string, downs: number) {
  await category(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Søppel", exact: true })).toBeFocused();
  for (let i = 1; i <= downs; i++) {
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: CATEGORY_ORDER[i], exact: true })).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(category(page)).toHaveText(label);
}

async function openForm(page: Page) {
  await logIn(page, "bruker2@localfix.test", { next: NEW_REPORT });
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
  await expect(description(page)).toBeFocused();
}

/**
 * Samler Server Action-kallene (POST til skjemasiden). `createReport` har feltet
 * «location» i kroppen, forslagskallet bare beskrivelsen.
 */
function trackPosts(page: Page) {
  const suggestions: Request[] = [];
  const creations: Request[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST" || new URL(request.url()).pathname !== NEW_REPORT) return;
    const isCreation = (request.postData() ?? "").includes('"location"');
    (isCreation ? creations : suggestions).push(request);
  });
  return { suggestions, creations };
}

/** Holder tilbake det første forslagskallet til `release()` kalles. */
async function holdFirstPost(page: Page) {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  await page.route(`**${NEW_REPORT}`, async (route) => {
    if (route.request().method() === "POST" && !held) {
      held = true;
      await gate;
    }
    await route.continue();
  });
  return release;
}

/** axe og breddesjekk, og også 320 px i 360-prosjektet. */
async function expectAccessibleLayout(page: Page) {
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (page.viewportSize()!.width === 360) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }
}

test("et forslag velger kategorien med pillen, leses opp og gir en oppsummering", async ({ page }) => {
  await openForm(page);
  const posts = trackPosts(page);
  const release = await holdFirstPost(page);

  // Aldri mens brukeren skriver.
  await page.keyboard.type("Gatelyset ved gangveien er ødelagt");
  expect(posts.suggestions).toHaveLength(0);
  await expect(loading(page)).toHaveCount(0);

  // Å forlate beskrivelsen henter forslaget. Imens står spinneren, og kategorien er tom.
  await page.keyboard.press("Tab");
  await expect(category(page)).toBeFocused();
  await expect(loading(page)).toBeVisible();
  await expect(category(page)).toHaveText("Velg kategori");
  await expect(category(page)).toHaveAccessibleDescription(/Finner kategori/);
  await expect(liveRegion(page)).toHaveText("");

  release();
  await expect(category(page)).toHaveText("Belysning");
  await expect(loading(page)).toHaveCount(0);
  await expect(aiTag(page)).toBeVisible();
  expect(posts.suggestions).toHaveLength(1);

  // Opplesningen: en usynlig aria-live-region, og forslaget flytter ikke fokus.
  await expect(liveRegion(page)).toHaveText("Kategori foreslått: Belysning");
  await expect(liveRegion(page)).toHaveAttribute("aria-live", "polite");
  const live = await liveRegion(page).boundingBox();
  expect(live!.width).toBeLessThanOrEqual(1);
  expect(live!.height).toBeLessThanOrEqual(1);
  await expect(category(page)).toBeFocused();
  await expect(noSuggestion(page)).toHaveCount(0);

  // Oppsummeringen er lesetekst med «Endre».
  await expect(summaryText(page, "Gatelyset ved gangveien er ødelagt")).toBeVisible();
  await expect(editButton(page)).toBeVisible();
  await expect(summaryField(page)).toHaveCount(0);

  await expectAccessibleLayout(page);
});

test("et manuelt valg før svaret står uten pille, og oppsummeringen vises", async ({ page }) => {
  await openForm(page);
  const release = await holdFirstPost(page);

  await page.keyboard.type("Gatelyset ved gangveien er ødelagt");
  await page.keyboard.press("Tab");
  await expect(loading(page)).toBeVisible();

  // Kategorivalget kan brukes mens KI-en jobber.
  await chooseCategory(page, "Annet", 4);
  await expect(aiTag(page)).toHaveCount(0);

  release();
  await expect(summaryText(page, "Gatelyset ved gangveien er ødelagt")).toBeVisible();
  await expect(loading(page)).toHaveCount(0);
  await expect(category(page)).toHaveText("Annet");
  await expect(aiTag(page)).toHaveCount(0);
  await expect(liveRegion(page)).toHaveText("");
  await expect(editButton(page)).toBeVisible();
});

test("«Send inn» venter bare når ingen kategori er valgt mens KI-en jobber", async ({ page }) => {
  await openForm(page);
  const release = await holdFirstPost(page);

  await page.keyboard.type("Gatelyset ved gangveien er ødelagt");
  await location(page).fill("Bygg A");
  await expect(loading(page)).toBeVisible();
  await expect(submit(page)).toBeDisabled();

  await chooseCategory(page, "Søppel", 0);
  await expect(loading(page)).toBeVisible();
  await expect(submit(page)).toBeEnabled();
  release();
  await expect(loading(page)).toHaveCount(0);
  await expect(category(page)).toHaveText("Søppel");
});

test("å endre kategorien fjerner pillen, og senere forslag overskriver ikke valget", async ({ page }) => {
  await openForm(page);
  const posts = trackPosts(page);

  await page.keyboard.type("Gatelyset ved gangveien er ødelagt");
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Belysning");
  await expect(aiTag(page)).toBeVisible();

  await category(page).click();
  await page.getByRole("option", { name: "Annet", exact: true }).click();
  await expect(category(page)).toHaveText("Annet");
  await expect(aiTag(page)).toHaveCount(0);

  // Mer tekst og blur gir et nytt kall, men kategorien står.
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type(" og søppel ved bygg A");
  await page.keyboard.press("Tab");
  await expect.poll(() => posts.suggestions.length).toBe(2);
  await expect(loading(page)).toHaveCount(0);
  await expect(category(page)).toHaveText("Annet");
  await expect(aiTag(page)).toHaveCount(0);
  // Oppsummeringen er ikke endret av brukeren, så den følger den nye teksten.
  await expect(
    summaryText(page, "Gatelyset ved gangveien er ødelagt og søppel ved bygg A"),
  ).toBeVisible();
});

test("forslaget hentes bare ved blur og bare når minst 10 tegn er endret", async ({ page }) => {
  await openForm(page);
  const posts = trackPosts(page);

  // Under 10 tegn gir ikke kall, også etter blur.
  await page.keyboard.type("Hull i ve");
  await page.keyboard.press("Tab");
  await expect(loading(page)).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(posts.suggestions).toHaveLength(0);

  // Første forslag regnes mot tom tekst: 12 tegn gir kall (9 tegn ga ikke).
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type("ien");
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Vei og fortau");
  expect(posts.suggestions).toHaveLength(1);

  // 9 endrede tegn siden forrige forslag gir ikke kall.
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type(" abcdefgh");
  await page.keyboard.press("Tab");
  await expect(loading(page)).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(posts.suggestions).toHaveLength(1);

  // Nøyaktig 10 gir kall.
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type("i");
  await page.keyboard.press("Tab");
  await expect.poll(() => posts.suggestions.length).toBe(2);
  await expect(loading(page)).toHaveCount(0);
});

test("et svar for tekst som er endret siden kallet, forkastes", async ({ page }) => {
  await openForm(page);
  const posts = trackPosts(page);
  const release = await holdFirstPost(page);

  await page.keyboard.type("Hull i veien ved bygg A");
  await page.keyboard.press("Tab");
  await expect(loading(page)).toBeVisible();

  // Brukeren går tilbake og skriver videre mens kallet går.
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type(" og knust rute i døra");
  release();
  await expect(loading(page)).toHaveCount(0);

  // Svaret for den gamle teksten er forkastet: ingen kategori, pille eller oppsummering.
  await expect(category(page)).toHaveText("Velg kategori");
  await expect(aiTag(page)).toHaveCount(0);
  await expect(editButton(page)).toHaveCount(0);
  await expect(noSuggestion(page)).toHaveCount(0);
  expect(posts.suggestions).toHaveLength(1);

  // Å forlate feltet henter forslaget for den nye teksten (vandalism foran roads_sidewalks).
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Skadeverk");
  await expect(aiTag(page)).toBeVisible();
  expect(posts.suggestions).toHaveLength(2);
});

test("et forkastet svar når brukeren allerede har forlatt feltet, gir et nytt forslag uten ny blur", async ({
  page,
}) => {
  await openForm(page);
  const posts = trackPosts(page);
  const release = await holdFirstPost(page);

  await page.keyboard.type("Hull i veien ved bygg A");
  await page.keyboard.press("Tab");
  await expect(loading(page)).toBeVisible();

  // Brukeren går tilbake, endrer teksten med færre enn 10 tegn og forlater feltet
  // igjen mens det første kallet går (det andre blur-et gir ikke kall).
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type(" knust");
  await location(page).focus();
  expect(posts.suggestions).toHaveLength(1);

  // Det gamle svaret forkastes, og et nytt forslag hentes uten ny blur.
  release();
  await expect.poll(() => posts.suggestions.length).toBe(2);
  await expect(loading(page)).toHaveCount(0);
  await expect(location(page)).toBeFocused();
  await expect(category(page)).toHaveText("Skadeverk");
  await expect(aiTag(page)).toBeVisible();
  await expect(liveRegion(page)).toHaveText("Kategori foreslått: Skadeverk");
});

test("«Send inn» rett fra beskrivelsen henter ikke et forslag først", async ({ page }) => {
  await openForm(page);
  const posts = trackPosts(page);

  await location(page).fill("Bygg A");
  await chooseCategory(page, "Annet", 4);
  await description(page).fill("Gatelyset ved gangveien er ødelagt");
  await submit(page).click();

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  expect(posts.suggestions).toHaveLength(0);
  expect(posts.creations).toHaveLength(1);
});

test("testordet gir «Vi fikk ikke et forslag», med kategori tom og påkrevd, og rapporten kan sendes uten oppsummering", async ({
  page,
}) => {
  await openForm(page);
  const unique = randomUUID();
  const text = `ingenforslag Rapport uten forslag ${unique}`;

  await page.keyboard.type(text);
  await page.keyboard.press("Tab");
  await expect(noSuggestion(page)).toBeVisible();
  await expect(category(page)).toHaveText("Velg kategori");
  await expect(category(page)).toHaveAccessibleDescription(
    "Vi fikk ikke et forslag. Velg kategori selv.",
  );
  await expect(category(page)).toHaveAttribute("aria-required", "true");
  await expect(aiTag(page)).toHaveCount(0);
  await expect(editButton(page)).toHaveCount(0);
  await expect(liveRegion(page)).toHaveText("");

  await location(page).fill("Bygg A");
  await expect(submit(page)).toBeDisabled();
  await expectAccessibleLayout(page);

  // Brukeren velger selv, og meldingen forsvinner.
  await chooseCategory(page, "Søppel", 0);
  await expect(noSuggestion(page)).toHaveCount(0);
  await expect(submit(page)).toBeEnabled();
  await submit(page).click();

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  // Uten oppsummering er overskriften kategorinavnet.
  await expect(main(page).getByRole("heading", { level: 1, name: "Søppel", exact: true })).toBeVisible();
  await expect(main(page).getByText(text, { exact: true })).toBeVisible();
});

test("en feil fra forslagskallet gir «Vi fikk ikke et forslag», og rapporten kan sendes", async ({ page }) => {
  await openForm(page);
  await page.route(`**${NEW_REPORT}`, (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );

  await page.keyboard.type("Gatelyset ved gangveien er ødelagt");
  await page.keyboard.press("Tab");
  await expect(noSuggestion(page)).toBeVisible();
  await expect(loading(page)).toHaveCount(0);
  await expect(category(page)).toHaveText("Velg kategori");
  await expect(aiTag(page)).toHaveCount(0);

  // Kategorien kan velges selv, og meldingen forsvinner.
  await chooseCategory(page, "Belysning", 1);
  await expect(noSuggestion(page)).toHaveCount(0);
});

test("en rapport med oppsummering lagres og vises i lista og på detaljsiden", async ({ page }) => {
  await page.goto("/");
  await openForm(page);
  const unique = randomUUID();
  const first = `Gatelyset ${unique} er ødelagt`;
  const text = `${first}. Det er mørkt om kvelden.`;

  await page.keyboard.type(text);
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Belysning");
  await expect(summaryText(page, first)).toBeVisible();
  await location(page).fill("Gangveien ved bygg A");
  const posts = trackPosts(page);
  await expect(submit(page)).toBeEnabled();
  await submit(page).click();

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  expect(posts.creations).toHaveLength(1);
  // Overskriften på detaljsiden er oppsummeringen, og beskrivelsen står under.
  await expect(main(page).getByRole("heading", { level: 1, name: first, exact: true })).toBeVisible();
  await expect(main(page).getByText(text, { exact: true })).toBeVisible();
  await expectAccessibleLayout(page);

  // Kortet i lista viser oppsummeringen.
  await page.getByRole("banner").getByRole("link", { name: "Tilbake til lista" }).click();
  await expect(page).toHaveURL("/");
  const card = main(page).getByRole("listitem").first();
  await expect(card).toContainText(first);
  await expect(card).not.toContainText("Det er mørkt om kvelden");
  await expect(card).toContainText("Ny");
});

test("egen oppsummering: «Endre» åpner feltet med teller, 300 tegn godtas og 301 avvises", async ({
  page,
}) => {
  await openForm(page);
  const unique = randomUUID();
  const posts = trackPosts(page);
  await page.keyboard.type(`Hull ${unique} i veien. Mer tekst.`);
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Vei og fortau");
  await location(page).fill("Bygg A");

  await editButton(page).click();
  await expect(summaryField(page)).toBeFocused();
  await expect(summaryField(page)).toHaveValue(`Hull ${unique} i veien`);
  await expect(editButton(page)).toHaveCount(0);
  await expect(page.getByText(`${`Hull ${unique} i veien`.length}/300`, { exact: true })).toBeVisible();

  const error = page.getByText("Oppsummeringen kan ha høyst 300 tegn.", { exact: true });
  const word = "abcde ";
  const exactly300 = word.repeat(49) + "abcdef";
  const tooLong = word.repeat(49) + "abcdefg";
  expect(exactly300).toHaveLength(300);

  await summaryField(page).fill(tooLong);
  await expect(page.getByText("301/300", { exact: true })).toBeVisible();
  await expect(error).toBeVisible();
  await expect(summaryField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(summaryField(page)).toHaveAccessibleDescription("Oppsummeringen kan ha høyst 300 tegn.");
  await expectAccessibleLayout(page);

  // «Send inn» gir fokus til feltet med feilen, og ingenting sendes.
  await submit(page).click();
  await expect(summaryField(page)).toBeFocused();
  expect(posts.creations).toHaveLength(0);
  await expect(page).toHaveURL(NEW_REPORT);

  // Nøyaktig 300 tegn godtas.
  await summaryField(page).fill(exactly300);
  await expect(page.getByText("300/300", { exact: true })).toBeVisible();
  await expect(error).toHaveCount(0);
  await expect(summaryField(page)).not.toHaveAttribute("aria-invalid");

  // Et nytt forslag overskriver ikke en oppsummering brukeren har endret.
  await description(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type(" og mer tekst om hullet");
  await location(page).focus();
  await expect.poll(() => posts.suggestions.length).toBe(2);
  await expect(loading(page)).toHaveCount(0);
  await expect(summaryField(page)).toHaveValue(exactly300);

  await submit(page).click();
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  await expect(main(page).getByRole("heading", { level: 1, name: exactly300.trim(), exact: true })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("et tomt oppsummeringsfelt gir ingen oppsummering", async ({ page }) => {
  await openForm(page);
  const unique = randomUUID();
  await page.keyboard.type(`Boss ${unique} ved inngangen`);
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Søppel");
  await location(page).fill("Bygg A");

  await editButton(page).click();
  await summaryField(page).fill("   ");
  await expect(page.getByText("0/300", { exact: true })).toBeVisible();
  await submit(page).click();

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  // Uten oppsummering er overskriften kategorinavnet.
  await expect(main(page).getByRole("heading", { level: 1, name: "Søppel", exact: true })).toBeVisible();
});

test("HTML i beskrivelsen gir en oppsummering uten tagger, som ren tekst", async ({ page }) => {
  await openForm(page);
  await page.keyboard.type("Boss <b>fet</b> ved inngangen");
  await page.keyboard.press("Tab");
  await expect(category(page)).toHaveText("Søppel");
  // Valideringen fjerner taggene, og oppsummeringen vises som tekst, ikke som element.
  await expect(summaryText(page, "Boss fet ved inngangen")).toBeVisible();
  await expect(main(page).locator("form b")).toHaveCount(0);
  await expect(page.locator("form p", { hasText: "<b>" })).toHaveCount(0);
});
