// Registrere en rapport (Story 2.2, FR-3): innloggingskravet og veien tilbake,
// fokus i beskrivelsen, «Send inn» som er deaktivert til feltene er fylt,
// tegntelleren, feil over grensen med fokus på første feil, innsending med
// toast og «1 har sett dette», «+»-knappen under 640 px og topplinjelenka fra
// 640 px, og axe og breddesjekk. Testene lager rapporter, så de ligger i
// endrer-prosjektene. Rapportene blir liggende til neste `db reset`.
// Fra Story 2.3 henter blur på beskrivelsen et KI-forslag. Testene som velger
// kategori selv, bruker derfor testordet «ingenforslag» i beskrivelsen (mock
// gir da ikke noe forslag), så et mock-forslag ikke endrer valget.
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn, PASSWORD } from "../auth";
import { expectNoHorizontalScroll } from "../layout";

const NEW_REPORT = "/rapporter/ny";
// Testordet som gir «ingen forslag» fra mock-adapteren.
const NO_AI = "ingenforslag";
const REMINDER =
  "Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.";
const LOGIN_FOR_FORM = "/auth/login?next=%2Frapporter%2Fny";

const description = (page: Page) => page.getByLabel("Beskrivelse", { exact: true });
const location = (page: Page) => page.getByLabel("Lokasjon", { exact: true });
const category = (page: Page) => page.getByRole("combobox", { name: "Kategori", exact: true });
const submit = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: /^(Send inn|Sender …)$/ });
const registerLink = (page: Page) =>
  page.getByRole("link", { name: "Registrer problem", exact: true });

const isSmall = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;

// Kategoriene i den rekkefølgen lista viser dem.
const CATEGORY_ORDER = ["Søppel", "Belysning", "Vei og fortau", "Skadeverk", "Annet"];

/** Tekst på nøyaktig `n` tegn med testordet først. */
const padded = (n: number) => `${NO_AI} ${"a".repeat(n - NO_AI.length - 1)}`;

/** createReport har «location» i kroppen. Forslagskallet har bare teksten. */
const isCreateReport = (request: { postData(): string | null }) =>
  (request.postData() ?? "").includes('"location"');

/** Velger en kategori med tastatur: åpner lista, piler og Enter. */
async function chooseCategory(page: Page, label: string, downs: number) {
  await category(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  // Fokus flyttes til første valg når lista har åpnet. Piltastene før det
  // går tapt.
  await expect(page.getByRole("option", { name: "Søppel", exact: true })).toBeFocused();
  // Ett trykk om gangen, og vent til neste valg har fokus.
  for (let i = 1; i <= downs; i++) {
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: CATEGORY_ORDER[i], exact: true })).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(category(page)).toHaveText(label);
  await expect(category(page)).toBeFocused();
}

async function openForm(page: Page) {
  await logIn(page, "bruker2@localfix.test", { next: NEW_REPORT });
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
}

test("en besøkende sendes til innlogging og er tilbake på skjemaet etterpå", async ({
  page,
}) => {
  await page.goto(NEW_REPORT);
  await expect(page).toHaveURL(LOGIN_FOR_FORM);

  await page.getByLabel("E-post", { exact: true }).fill("bruker2@localfix.test");
  await page.getByLabel("Passord", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Logg inn", exact: true }).click();

  await expect(page).toHaveURL(NEW_REPORT);
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
  await expect(description(page)).toBeFocused();
});

test("«+» og «Registrer problem» fører en besøkende til innlogging, og så til skjemaet", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  await registerLink(page).click();
  await expect(page).toHaveURL(LOGIN_FOR_FORM);

  await page.getByLabel("E-post", { exact: true }).fill("bruker2@localfix.test");
  await page.getByLabel("Passord", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Logg inn", exact: true }).click();
  await expect(page).toHaveURL(NEW_REPORT);
  await expect(description(page)).toBeFocused();
});

test("inngangene: «+» under 640 px og topplinjelenka fra 640 px, med aria-label og trykkflate", async ({
  page,
}) => {
  await page.goto("/");
  const links = registerLink(page);
  // Bare én av dem er synlig for skjermlesere ved hver bredde.
  await expect(links).toHaveCount(1);
  await expect(links).toBeVisible();
  await expect(links).toHaveAttribute("href", NEW_REPORT);
  const box = await links.boundingBox();
  expect(box).not.toBeNull();

  if (isSmall(page)) {
    // Den flytende knappen: 56 px, nede til høyre, uten synlig tekst.
    await expect(links).toHaveAttribute("aria-label", "Registrer problem");
    expect(box!.width).toBeCloseTo(56, 0);
    expect(box!.height).toBeCloseTo(56, 0);
    const viewport = page.viewportSize()!;
    expect(box!.x + box!.width).toBeCloseTo(viewport.width - 16, 0);
    expect(box!.y + box!.height).toBeCloseTo(viewport.height - 16, 0);
    await expect(page.getByRole("banner").getByRole("link", { name: "Registrer problem" })).toHaveCount(0);

    // Siste kort er ikke dekket av knappen når lista er rullet helt ned.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const lastCard = page.getByRole("main").getByRole("listitem").last();
    const cardBox = await lastCard.boundingBox();
    const fabBox = await links.boundingBox();
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(fabBox!.y);
  } else {
    // Topplinjelenka med synlig tekst og trykkflate på minst 44 px.
    await expect(page.getByRole("banner").getByRole("link", { name: "Registrer problem" })).toBeVisible();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("main").getByRole("link", { name: "Registrer problem" })).toHaveCount(0);
  }
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});

test("topplinjelenka er skjult på skjemaet og på innloggingssidene", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { level: 1, name: "Logg inn" })).toBeVisible();
  await expect(registerLink(page)).toHaveCount(0);
  await page.goto("/auth/sign-up");
  await expect(page.getByRole("heading", { level: 1, name: "Registrer konto" })).toBeVisible();
  await expect(registerLink(page)).toHaveCount(0);

  await openForm(page);
  await expect(registerLink(page)).toHaveCount(0);
});

test("skjemaet: fokus i beskrivelsen, påminnelsen, teller, og «Send inn» er deaktivert til feltene er fylt", async ({
  page,
}) => {
  await openForm(page);
  await expect(description(page)).toBeFocused();

  // Påminnelsen er hele teksten fra Story 2.3, med setningen om KI-tjenesten.
  await expect(page.getByText(REMINDER, { exact: true })).toBeVisible();
  await expect(page.getByText(/KI-tjeneste/)).toHaveCount(1);
  await expect(location(page)).toHaveAttribute("placeholder", "F.eks. gangveien ved bygg A");
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (page.viewportSize()!.width === 360) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // Feltene er 16 px og 44 px høye.
  for (const field of [description(page), location(page), category(page)]) {
    await expect(field).toHaveCSS("font-size", "16px");
  }
  for (const field of [location(page), category(page), submit(page)]) {
    const box = await field.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await expect(page.getByText("0/1000", { exact: true })).toBeVisible();
  await expect(submit(page)).toBeDisabled();

  await page.keyboard.type("abc");
  await expect(page.getByText("3/1000", { exact: true })).toBeVisible();
  // Telleren leses ikke opp: den står ikke i beskrivelsen av feltet og er ikke aria-live.
  await expect(description(page)).toHaveAccessibleDescription(REMINDER);
  await expect(page.locator("[aria-live]").filter({ hasText: "3/1000" })).toHaveCount(0);
  await expect(submit(page)).toBeDisabled();

  await location(page).fill("Bygg A");
  await expect(submit(page)).toBeDisabled();
  await chooseCategory(page, "Belysning", 1);
  await expect(submit(page)).toBeEnabled();

  // Bare mellomrom er tomt.
  await description(page).fill("     ");
  await expect(submit(page)).toBeDisabled();
  await description(page).fill("abc");
  await location(page).fill("   ");
  await expect(submit(page)).toBeDisabled();
  await location(page).fill("Bygg A");
  await expect(submit(page)).toBeEnabled();
});

test("tekst over grensen gir feil under feltet med en gang, holder knappen aktiv og gir fokus på første feil ved innsending", async ({
  page,
}) => {
  await openForm(page);
  // Bare innsendingene telles. Forslagskallet etter blur er også en POST.
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && isCreateReport(request)) requests.push(request.url());
  });

  const descriptionError = page.getByText("Beskrivelsen kan ha høyst 1000 tegn.", { exact: true });
  const locationError = page.getByText("Stedet kan ha høyst 200 tegn.", { exact: true });

  // De tre feltene er påkrevd.
  for (const field of [description(page), location(page), category(page)]) {
    await expect(field).toHaveAttribute("aria-required", "true");
  }

  // Feilen står under feltet med en gang teksten er over grensen, før noe
  // er sendt inn.
  await description(page).fill(padded(1000));
  await expect(descriptionError).toHaveCount(0);
  await description(page).fill(padded(1001));
  await expect(descriptionError).toBeVisible();
  await location(page).fill("b".repeat(201));
  await expect(locationError).toBeVisible();
  await chooseCategory(page, "Søppel", 0);
  await expect(page.getByText("1001/1000", { exact: true })).toBeVisible();
  await expect(submit(page)).toBeEnabled();
  expect(requests, "ingenting sendes").toEqual([]);

  // Et innsendingsforsøk flytter fokus til første feil.
  await submit(page).click();
  await expect(descriptionError).toBeVisible();
  await expect(locationError).toBeVisible();
  await expect(description(page)).toBeFocused();
  await expect(description(page)).toHaveAttribute("aria-invalid", "true");
  await expect(description(page)).toHaveAccessibleDescription(
    `${REMINDER} Beskrivelsen kan ha høyst 1000 tegn.`,
  );
  await expect(location(page)).toHaveAttribute("aria-invalid", "true");
  await expect(location(page)).toHaveAccessibleDescription("Stedet kan ha høyst 200 tegn.");
  await expect(page).toHaveURL(NEW_REPORT);
  expect(requests, "ingenting sendes").toEqual([]);
  // Alt brukeren skrev, er beholdt.
  await expect(description(page)).toHaveValue(padded(1001));
  await expect(location(page)).toHaveValue("b".repeat(201));
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (page.viewportSize()!.width === 360) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // Rettes beskrivelsen, forsvinner feilen uten nytt innsendingsforsøk. Neste
  // forsøk gir fokus til neste feil, lokasjonen.
  await description(page).fill(padded(1000));
  await expect(descriptionError).toHaveCount(0);
  await expect(description(page)).not.toHaveAttribute("aria-invalid");
  await expect(locationError).toBeVisible();
  await submit(page).click();
  await expect(location(page)).toBeFocused();
  await expect(locationError).toBeVisible();
  expect(requests, "ingenting sendes").toEqual([]);

  // Nøyaktig grensen er godtatt: feilen forsvinner med en gang, og rapporten sendes.
  await location(page).fill("b".repeat(200));
  await expect(locationError).toHaveCount(0);
  await expect(location(page)).not.toHaveAttribute("aria-invalid");
  await submit(page).click();
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
});

test("en gyldig innsending: trimmet tekst, toast, detaljsiden med «1 har sett dette» og rapporten øverst i lista", async ({
  page,
}) => {
  // Brukeren kommer fra lista, så den ligger før detaljsiden i historikken.
  await page.goto("/");
  await openForm(page);
  const unique = randomUUID();
  const text = `${NO_AI} Ny rapport fra e2e ${unique} æøå 😀`;

  await description(page).fill(`   ${text}   `);
  await location(page).fill("  Gangveien ved bygg A  ");
  await chooseCategory(page, "Vei og fortau", 2);
  await submit(page).click();

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  await expect(
    page.locator("[data-sonner-toast]").getByText("Rapporten er sendt inn", { exact: true }),
  ).toBeVisible();
  const main = page.getByRole("main");
  // Uten oppsummering (testordet gir ikke forslag) er overskriften kategorinavnet.
  await expect(main.getByRole("heading", { level: 1, name: "Vei og fortau", exact: true })).toBeVisible();
  await expect(main.getByText(text, { exact: true })).toBeVisible();
  await expect(main.getByText("Ny", { exact: true })).toBeVisible();
  await expect(main.getByText("Hvor: Gangveien ved bygg A", { exact: true })).toBeVisible();
  await expect(main.getByText("1 har sett dette", { exact: true })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // «←» går til lista, ikke til skjemaet, og rapporten står øverst med status Ny.
  await page.getByRole("banner").getByRole("link", { name: "Tilbake til lista" }).click();
  await expect(page).toHaveURL("/");
  const first = page.getByRole("main").getByRole("listitem").first();
  await expect(first).toContainText(text);
  await expect(first).toContainText("Ny");
});

test("dobbeltklikk på «Send inn» gir én rapport", async ({ page }) => {
  await openForm(page);
  const unique = randomUUID();
  // Server Action sendes som POST til siden. Innsendingene telles, så et andre
  // kall også oppdages når begge ville gitt samme rapport.
  let posts = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === NEW_REPORT &&
      isCreateReport(request)
    ) {
      posts++;
    }
  });

  await description(page).fill(`${NO_AI} Dobbeltklikk ${unique}`);
  await location(page).fill("Bygg C");
  await chooseCategory(page, "Annet", 4);
  await submit(page).dblclick();

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  expect(posts).toBe(1);

  await page.goto("/");
  await expect(
    page.getByRole("main").getByRole("listitem").filter({ hasText: unique }),
  ).toHaveCount(1);
});

test("feiler innsendingen, vises en toast og feltene er beholdt", async ({ page }) => {
  await openForm(page);
  // Server Action sendes som POST til siden. Nettverksfeil gir feil fra anropet.
  await page.route(`**${NEW_REPORT}`, (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );

  await description(page).fill("Skal ikke lagres");
  await location(page).fill("Bygg B");
  await chooseCategory(page, "Søppel", 0);
  await submit(page).click();

  const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
  await expect(errorToast.getByText("Kunne ikke sende inn. Prøv igjen.", { exact: true })).toBeVisible();
  // Destructive: kantlinje i destructive-fargen, men teksten i forgrunnsfargen.
  await expect(errorToast).toHaveCSS("border-top-color", "rgb(239, 68, 68)");
  await expect(errorToast.getByText("Kunne ikke sende inn. Prøv igjen.", { exact: true })).toHaveCSS(
    "color",
    "rgb(23, 33, 43)",
  );
  await expect(page).toHaveURL(NEW_REPORT);
  await expect(description(page)).toHaveValue("Skal ikke lagres");
  await expect(location(page)).toHaveValue("Bygg B");
  await expect(category(page)).toHaveText("Søppel");
  await expect(submit(page)).toBeEnabled();
  await expect(submit(page)).toHaveText("Send inn");
});

test("«←» på skjemaet går ut uten å sende inn", async ({ page }) => {
  await page.goto("/");
  await logIn(page, "bruker2@localfix.test", { next: NEW_REPORT });
  await page.getByRole("banner").getByRole("link", { name: "Tilbake til lista" }).click();
  await expect(page).toHaveURL("/");
});
