// Innloggingen og menyen i topplinja (Story 2.1, FR-1): matrisen i spec-en
// uten registrering, menyen for besøkende, bruker og moderator, «Logg ut», og
// axe og bredde på innloggings- og registreringssiden, også med feil.
// Registrering som lager kontoer, ligger i e2e/endrer/registrering.spec.ts.
// Testene logger inn og ut, men endrer ingen data i appen.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn, menuButton, openMenu, PASSWORD } from "../auth";
import { tabTo } from "../keyboard";
import { expectNoHorizontalScroll } from "../layout";

const REPORT_1 = "/rapporter/20000000-0000-4000-8000-000000000001";
const BRUKER1 = "bruker1@localfix.test";
const MODERATOR = "moderator@localfix.test";

/** Kallene nettleseren gjør til Supabase Auth. */
function trackAuthRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/")) requests.push(request.url());
  });
  return requests;
}

/**
 * axe og horisontal scrolling ved prosjektbredden og ved 360 og 320 px
 * (NFR-1, NFR-8). Setter bredden tilbake etterpå.
 */
async function expectA11yAtAllWidths(page: Page) {
  const original = page.viewportSize()!;
  for (const width of new Set([original.width, 360, 320])) {
    await page.setViewportSize({ width, height: original.height });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
  }
  await page.setViewportSize(original);
}

const emailField = (page: Page) => page.getByLabel("E-post", { exact: true });
const passwordField = (page: Page) => page.getByLabel("Passord", { exact: true });
const submitButton = (page: Page, name: string) =>
  page.getByRole("main").getByRole("button", { name, exact: true });

test("en besøkende ser «Logg inn» i menyen og er tilbake på siden etter innlogging", async ({
  page,
}) => {
  await page.goto(REPORT_1);
  const box = (await menuButton(page).boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);

  const menu = await openMenu(page);
  await expect(menu.getByRole("menuitem")).toHaveText(["Logg inn"]);
  await expect(menu.getByText("Moderator")).toHaveCount(0);
  // offsetHeight, fordi menyen skaleres mens den åpnes.
  expect(
    await menu.getByRole("menuitem").evaluate((item: HTMLElement) => item.offsetHeight),
  ).toBeGreaterThanOrEqual(44);
  await expectNoSeriousA11yViolations(page);

  await menu.getByRole("menuitem", { name: "Logg inn" }).click();
  await expect(page).toHaveURL(`/auth/login?next=${encodeURIComponent(REPORT_1)}`);
  await expect(page.getByRole("heading", { level: 1, name: "Logg inn" })).toBeVisible();
  await expect(page).toHaveTitle("Logg inn · LocalFix");
  // Menyen tones ut når den lukkes. axe venter til den er borte.
  await expect(page.getByRole("menu")).toBeHidden();
  await expectA11yAtAllWidths(page);

  // Mellomrom rundt e-postadressen fjernes før kallet.
  await emailField(page).fill(`  ${BRUKER1}  `);
  await passwordField(page).fill(PASSWORD);
  await submitButton(page, "Logg inn").click();
  await expect(page).toHaveURL(REPORT_1);
  await expect(
    page.getByRole("heading", { level: 1, name: "Full søppelkasse ved hovedinngangen" }),
  ).toBeVisible();

  const loggedIn = await openMenu(page);
  await expect(loggedIn.getByText(BRUKER1, { exact: true })).toBeVisible();
  await expect(loggedIn.getByRole("menuitem")).toHaveText(["Logg ut"]);
  await expect(loggedIn.getByText("Moderator")).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
});

test("moderatoren ser e-postadressen sin, «Moderator» og «Logg ut» i menyen", async ({
  page,
}) => {
  await logIn(page, MODERATOR);
  const menu = await openMenu(page);
  await expect(menu.getByText(MODERATOR, { exact: true })).toBeVisible();
  await expect(menu.getByText("Moderator", { exact: true })).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText(["Logg ut"]);
  await expect(menu.getByText(BRUKER1)).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});

test("«Logg ut» med tastatur viser lista med «Logg inn» i menyen", async ({ page }) => {
  await logIn(page, "bruker2@localfix.test", { next: REPORT_1 });
  await expect(menuButton(page)).toBeVisible();

  await tabTo(page, "button", "Meny", { max: 10 });
  await page.keyboard.press("Enter");
  const logOut = page.getByRole("menuitem", { name: "Logg ut", exact: true });
  await expect(logOut).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  const menu = await openMenu(page);
  await expect(menu.getByRole("menuitem")).toHaveText(["Logg inn"]);
  await expect(menu.getByText("bruker2@localfix.test")).toHaveCount(0);

  // Sesjonen er borte også på serveren: en ny innlasting viser en besøkende.
  await page.reload();
  await expect((await openMenu(page)).getByRole("menuitem")).toHaveText(["Logg inn"]);
});

test("next under /auth/ sender brukeren til lista, så skjemaet ikke står fast", async ({
  page,
}) => {
  await logIn(page, BRUKER1, { next: "/auth/login", expectedUrl: "/" });
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
});

test("«Logg inn» i menyen tar med spørringen i next", async ({ page }) => {
  await page.goto("/?category=waste");
  const menu = await openMenu(page);
  await expect(menu.getByRole("menuitem", { name: "Logg inn" })).toHaveAttribute(
    "href",
    "/auth/login?next=%2F%3Fcategory%3Dwaste",
  );
});

test("mens innloggingen pågår, viser knappen «Logger inn …», og Enter sender ikke på nytt", async ({
  page,
}) => {
  const tokenRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/token")) tokenRequests.push(request.url());
  });
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/auth/v1/token**", async (route) => {
    await released;
    await route.continue();
  });

  await page.goto("/auth/login");
  await emailField(page).fill(BRUKER1);
  await passwordField(page).fill(PASSWORD);
  await passwordField(page).press("Enter");

  const pendingButton = submitButton(page, "Logger inn …");
  await expect(pendingButton).toBeVisible();
  await expect(pendingButton).toBeDisabled();
  await passwordField(page).press("Enter");
  // Gir et eventuelt nytt kall tid til å starte før det telles.
  await page.waitForTimeout(500);
  expect(tokenRequests, "kall til /auth/v1/token").toHaveLength(1);

  release();
  await expect(page).toHaveURL("/");
  expect(tokenRequests).toHaveLength(1);
});

test("«Logg ut» logger bare ut denne nettleseren", async ({ page, browser, baseURL }) => {
  const other = await browser.newContext({ baseURL });
  try {
    const otherPage = await other.newPage();
    await logIn(page, BRUKER1);
    await logIn(otherPage, BRUKER1);

    await (await openMenu(page)).getByRole("menuitem", { name: "Logg ut" }).click();
    // Venter til lista er hentet på nytt uten sesjon. Overgangen i appen
    // testes i «Logg ut» med tastatur.
    await expect(async () => {
      await page.reload();
      await expect((await openMenu(page)).getByRole("menuitem")).toHaveText(["Logg inn"], {
        timeout: 1_000,
      });
    }).toPass();

    await otherPage.reload();
    const otherMenu = await openMenu(otherPage);
    await expect(otherMenu.getByText(BRUKER1, { exact: true })).toBeVisible();
    await expect(otherMenu.getByRole("menuitem")).toHaveText(["Logg ut"]);
  } finally {
    await other.close();
  }
});

test("en fremmed next sender brukeren til lista", async ({ page }) => {
  for (const next of ["//evil.example", "/\\evil.example", "https://evil.example"]) {
    await logIn(page, BRUKER1, { next, expectedUrl: "/" });
    await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  }
});

test("feil passord gir «Feil e-post eller passord.» over knappen", async ({ page }) => {
  await page.goto("/auth/login");
  await emailField(page).fill(BRUKER1);
  await passwordField(page).fill("feil-passord");
  await submitButton(page, "Logg inn").click();

  const alert = page.getByRole("alert").filter({ hasText: "Feil e-post eller passord." });
  await expect(alert).toBeVisible();
  await expect(alert).toBeFocused();
  await expect(page).toHaveURL("/auth/login");
  const alertBox = (await alert.boundingBox())!;
  const buttonBox = (await submitButton(page, "Logg inn").boundingBox())!;
  expect(alertBox.y + alertBox.height).toBeLessThanOrEqual(buttonBox.y);
  // Teksten fra Supabase vises aldri.
  await expect(page.getByText(/Invalid login credentials/)).toHaveCount(0);
  await expectA11yAtAllWidths(page);
});

test("tomme felt og en ugyldig e-postadresse gir feil ved feltet uten kall til Supabase", async ({
  page,
}) => {
  const requests = trackAuthRequests(page);
  await page.goto("/auth/login");
  await submitButton(page, "Logg inn").click();

  const emailError = page.getByText("Skriv inn e-postadressen din.", { exact: true });
  const passwordError = page.getByText("Skriv inn passordet ditt.", { exact: true });
  await expect(emailError).toBeVisible();
  await expect(passwordError).toBeVisible();
  await expect(emailField(page)).toBeFocused();
  await expect(emailField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(emailField(page)).toHaveAccessibleDescription("Skriv inn e-postadressen din.");
  await expect(passwordField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(passwordField(page)).toHaveAccessibleDescription("Skriv inn passordet ditt.");
  // Next har sin egen role="alert" for sidebytter, så bare main telles.
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await expectA11yAtAllWidths(page);

  // Matrisen: «abc» er ingen gyldig e-postadresse.
  await emailField(page).fill("abc");
  await passwordField(page).fill(PASSWORD);
  await submitButton(page, "Logg inn").click();
  await expect(
    page.getByText("Skriv inn en gyldig e-postadresse.", { exact: true }),
  ).toBeVisible();
  await expect(emailField(page)).toBeFocused();
  await expect(passwordField(page)).not.toHaveAttribute("aria-invalid");
  expect(requests, "kall til Supabase Auth").toEqual([]);
});

test("for mange forsøk og en nettverksfeil gir skjemafeil uten tekst fra Supabase", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await emailField(page).fill(BRUKER1);
  await passwordField(page).fill(PASSWORD);

  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        code: 429,
        error_code: "over_request_rate_limit",
        msg: "Request rate limit reached",
      }),
    }),
  );
  await submitButton(page, "Logg inn").click();
  await expect(
    page.getByRole("alert").filter({ hasText: "For mange forsøk. Vent litt og prøv igjen." }),
  ).toBeVisible();
  await expect(page.getByText(/rate limit/i)).toHaveCount(0);

  await page.unrouteAll();
  await page.route("**/auth/v1/token**", (route) => route.abort("failed"));
  await submitButton(page, "Logg inn").click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Noe gikk galt. Prøv igjen." }),
  ).toBeVisible();
  await expect(page).toHaveURL("/auth/login");
  await expect(submitButton(page, "Logg inn")).toBeEnabled();
});

test("registreringssiden har to felt, hjelpeteksten og samme next i lenkene", async ({
  page,
}) => {
  const requests = trackAuthRequests(page);
  const next = encodeURIComponent(REPORT_1);

  await page.goto(`/auth/login?next=${next}`);
  await expect(page.getByRole("link", { name: "Registrer konto", exact: true })).toHaveAttribute(
    "href",
    `/auth/sign-up?next=${next}`,
  );
  await page.getByRole("link", { name: "Registrer konto", exact: true }).click();
  await expect(page).toHaveURL(`/auth/sign-up?next=${next}`);

  await expect(page.getByRole("heading", { level: 1, name: "Registrer konto" })).toBeVisible();
  await expect(page).toHaveTitle("Registrer konto · LocalFix");
  await expect(page.locator("main input")).toHaveCount(2);
  await expect(emailField(page)).toHaveAttribute("autocomplete", "email");
  await expect(passwordField(page)).toHaveAttribute("autocomplete", "new-password");
  await expect(passwordField(page)).toHaveAccessibleDescription("Minst 6 tegn.");
  await expect(page.getByRole("link", { name: "Logg inn", exact: true })).toHaveAttribute(
    "href",
    `/auth/login?next=${next}`,
  );
  // Menyen beholder next fra adressen på /auth/*.
  const menu = await openMenu(page);
  await expect(menu.getByRole("menuitem", { name: "Logg inn" })).toHaveAttribute(
    "href",
    `/auth/login?next=${next}`,
  );
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
  await expectA11yAtAllWidths(page);

  await submitButton(page, "Registrer konto").click();
  await expect(page.getByText("Skriv inn e-postadressen din.", { exact: true })).toBeVisible();
  await expect(passwordField(page)).toHaveAccessibleDescription(
    "Minst 6 tegn. Skriv inn passordet ditt.",
  );
  await expect(emailField(page)).toBeFocused();
  await expectA11yAtAllWidths(page);
  expect(requests, "kall til Supabase Auth").toEqual([]);
});

test("skjemaene følger DESIGN.md: 16 px i feltene, 44 px trykkflater og maks 640 px", async ({
  page,
}) => {
  for (const path of ["/auth/login", "/auth/sign-up"]) {
    await page.goto(path);
    for (const field of [emailField(page), passwordField(page)]) {
      await expect(field).toHaveCSS("font-size", "16px");
      expect((await field.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const main = page.getByRole("main");
    for (const target of [main.getByRole("button"), main.getByRole("link")]) {
      expect((await target.boundingBox())!.height, `${path}`).toBeGreaterThanOrEqual(44);
    }
    expect((await main.boundingBox())!.width).toBeLessThanOrEqual(640);
  }
});
