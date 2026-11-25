// Den skjulte rapporten 7 med bilde for innloggede brukere (Story 1.7, AD-6).
// Forfatteren (bruker1) er en vanlig bruker og får 404 uten signert lenke.
// Moderatoren ser rapporten og bildet, og bildeikonet på kortet i lista.
// Innloggingen bruker den felles hjelperen i e2e/auth.ts (Story 2.1). Testene
// endrer ingen data.
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn } from "../auth";

const REPORT_7 = "/rapporter/20000000-0000-4000-8000-000000000007";
const SIGNED_LINK = /\/storage\/v1\/object\/sign\//;

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

// Layouten sender bare e-posten og om brukeren er moderator til menyen (AD-3,
// AD-5). Id-en til den innloggede brukeren skal aldri stå i HTML-en eller
// RSC-nyttelasten. Kodereview av gruppe A: de andre lekkasjetestene er anonyme,
// så `viewer` er `null` der.
const BRUKER1_ID = "10000000-0000-4000-8000-000000000002";

for (const path of ["/", "/rapporter/20000000-0000-4000-8000-000000000001"]) {
  test(`id-en til den innloggede brukeren står ikke i HTML eller RSC på ${path}`, async ({
    page,
  }) => {
    await logIn(page, "bruker1@localfix.test");

    const html = await page.request.get(path);
    expect(html.status(), "status for HTML-en").toBe(200);
    const rsc = await page.request.get(path, { headers: { RSC: "1" } });
    expect(rsc.status(), "status for RSC-nyttelasten").toBe(200);
    for (const [name, response] of [
      ["HTML-en", html],
      ["RSC-nyttelasten", rsc],
    ] as const) {
      const body = await response.text();
      // Kontroll: menyen får e-posten, så brukeren er faktisk med i svaret.
      expect(body, `${name} har e-posten`).toContain("bruker1@localfix.test");
      expect(body, name).not.toContain(BRUKER1_ID);
    }
  });
}

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
