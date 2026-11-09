// Den skjulte rapporten 7 med bilde for innloggede brukere (Story 1.7, AD-6).
// Forfatteren (bruker1) er en vanlig bruker og får 404 uten signert lenke.
// Moderatoren ser rapporten og bildet, og bildeikonet på kortet i lista.
// Innloggingen bruker skjemaet fra startpakken (`/auth/login`), som Story 2.1
// erstatter. Testene endrer ingen data.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";

const REPORT_7 = "/rapporter/20000000-0000-4000-8000-000000000007";
const PASSWORD = "localfix-test";
const SIGNED_LINK = /\/storage\/v1\/object\/sign\//;

async function logIn(page: Page, email: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/");
}

test("forfatteren av den skjulte rapporten 7 får 404 og ingen signert lenke", async ({
  page,
}) => {
  await logIn(page, "bruker1@localfix.test");

  // Samme økt i request: HTML-en og RSC-nyttelasten, slik klientnavigasjonen
  // henter den. Next svarer 200 på RSC-forespørselen, og 404-tilstanden står i
  // nyttelasten.
  const html = await page.request.get(REPORT_7);
  expect(html.status(), "status for HTML-en").toBe(404);
  const rsc = await page.request.get(REPORT_7, { headers: { RSC: "1" } });
  for (const [name, response] of [
    ["HTML-en", html],
    ["RSC-nyttelasten", rsc],
  ] as const) {
    const body = await response.text();
    expect(body, name).toContain("Fant ikke rapporten.");
    expect(body, name).not.toMatch(SIGNED_LINK);
    expect(body, name).not.toContain("report-images");
    expect(body, name).not.toContain("Blinkende lys i trappa");
  }

  await page.goto(REPORT_7);
  await expect(
    page.getByRole("heading", { level: 1, name: "Fant ikke rapporten." }),
  ).toBeVisible();
});

test("moderatoren ser bildet på den skjulte rapporten 7 og ikonet på kortet", async ({
  page,
}) => {
  await logIn(page, "moderator@localfix.test");

  // Lista: kortene for rapport 2, 3 og den skjulte 7 har bildeikonet.
  const icon = { name: "Har bilde", exact: true };
  await expect(page.locator(`a[href="${REPORT_7}"]`).getByRole("img", icon)).toBeVisible();
  await expect(page.getByRole("main").getByRole("img", icon)).toHaveCount(3);

  const response = await page.goto(REPORT_7);
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Blinkende lys i trappa" }),
  ).toBeVisible();
  const image = page
    .getByRole("main")
    .getByRole("img", { name: "Bilde fra rapporten", exact: true });
  await expect(image).toBeVisible();
  expect(await image.getAttribute("src")).toMatch(SIGNED_LINK);
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBeGreaterThan(0);
  await expectNoSeriousA11yViolations(page);
});
