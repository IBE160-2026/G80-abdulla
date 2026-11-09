// Detaljsiden (Story 1.5). Testene leser seed-dataene i supabase/seed.sql som
// besøkende og endrer ingenting. Tidspunktene er i norsk tid: sommertid
// (UTC+2) til og med 25. oktober 2026, vintertid (UTC+1) etter.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { expectNoHorizontalScroll } from "../layout";

const reportId = (n: number) => `20000000-0000-4000-8000-00000000000${n}`;
const reportUrl = (n: number) => `/rapporter/${reportId(n)}`;

// Forfatterne av seed-rapportene. De skal aldri sendes til nettleseren (AD-5).
const AUTHOR_IDS = [
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
];

const main = (page: Page) => page.getByRole("main");
const backLink = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: "Tilbake til lista", exact: true });

/** Sjekker at main viser feltet med nøyaktig denne teksten. */
async function expectField(page: Page, text: string) {
  await expect(main(page).getByText(text, { exact: true })).toBeVisible();
}

test("rapport 2 viser alle feltene, «Sist oppdatert» fra statusendringen og telleren", async ({
  page,
}) => {
  const response = await page.goto(reportUrl(2));
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Rapport · LocalFix");

  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();
  await expectField(page, "Belysning");
  await expectField(page, "Under behandling");
  await expectField(page, "Sist oppdatert 23. oktober kl. 11:00");
  await expectField(
    page,
    "To gatelys langs gangveien mot studentboligene er slukket. Det er helt mørkt der om kvelden.",
  );
  await expectField(page, "Hvor: Gangveien mot studentboligene");
  await expectField(page, "Registrert 21. oktober kl. 19:40");
  await expectField(page, "3 har sett dette");

  // Topplinja beholder «LocalFix · Campus Molde», med «←» foran.
  await expect(
    page.getByRole("banner").getByRole("link", { name: "LocalFix · Campus Molde" }),
  ).toHaveAttribute("href", "/");
  await expect(backLink(page)).toHaveAttribute("href", "/");

  await expectNoSeriousA11yViolations(page);
});

test("rapport 1 har aldri fått ny status, så «Sist oppdatert» er registreringstidspunktet", async ({
  page,
}) => {
  await page.goto(reportUrl(1));
  await expect(
    page.getByRole("heading", { level: 1, name: "Full søppelkasse ved hovedinngangen" }),
  ).toBeVisible();
  await expectField(page, "Ny");
  await expectField(page, "Sist oppdatert 20. oktober kl. 10:15");
  await expectField(page, "Registrert 20. oktober kl. 10:15");
  await expectField(page, "3 har sett dette");
});

test("rapport 8 viser «Sist oppdatert» i vintertid", async ({ page }) => {
  await page.goto(reportUrl(8));
  await expectField(page, "Sist oppdatert 3. november kl. 13:00");
  await expectField(page, "Registrert 2. november kl. 08:10");
  await expectField(page, "1 har sett dette");
});

test("rapport 4 uten oppsummering har kategorinavnet som overskrift og beskrivelsen under", async ({
  page,
}) => {
  await page.goto(reportUrl(4));
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText("Skadeverk");
  const description = main(page).getByText(
    "Noen har tagget ned veggen på sykkelskuret med svart spraymaling.",
    { exact: true },
  );
  await expect(description).toBeVisible();
  const headingBox = (await heading.boundingBox())!;
  const descriptionBox = (await description.boundingBox())!;
  expect(descriptionBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height);
});

test("rapport 5 vises som ren tekst med linjeskift og uten horisontal scrolling", async ({
  page,
}) => {
  await page.goto(reportUrl(5));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Annet");

  const description = main(page).getByText(/^Det lekker vann fra taket/);
  await expect(description).toContainText("<b>fet</b> <script>alert(1)</script>");
  await expect(main(page).locator("b, script")).toHaveCount(0);
  await expect(description).toHaveCSS("white-space", "pre-line");

  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const { lines, scrollWidth, clientWidth } = await description.evaluate((element) => ({
      lines: element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight),
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    // Tre avsnitt med tomme linjer mellom, så linjeskiftene er bevart.
    expect(lines, `beskrivelsen er ${lines} linjer høy ved ${width} px`).toBeGreaterThan(3);
    expect(
      scrollWidth,
      `beskrivelsen er bredere enn avsnittet ved ${width} px`,
    ).toBeLessThanOrEqual(clientWidth);
    await expectNoHorizontalScroll(page);
  }
});

test("detaljsiden følger DESIGN.md: bredden, margen og «Sist oppdatert» rett under statusmerket", async ({
  page,
}) => {
  await page.goto(reportUrl(2));
  const viewport = page.viewportSize()!;

  const article = main(page).locator("article");
  const box = (await article.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(640 - 2 * 16);
  expect(box.x).toBeGreaterThanOrEqual(16);
  if (viewport.width < 640 + 2 * 16) {
    expect(box.x).toBe(16);
    expect(box.x + box.width).toBe(viewport.width - 16);
  }

  const badge = main(page).getByText("Under behandling", { exact: true });
  await expect(badge).toHaveCSS("background-color", "rgb(255, 241, 214)");
  await expect(badge).toHaveCSS("color", "rgb(122, 75, 0)");
  const badgeBox = (await badge.boundingBox())!;
  const updated = (await main(page)
    .getByText("Sist oppdatert 23. oktober kl. 11:00", { exact: true })
    .boundingBox())!;
  const gap = updated.y - (badgeBox.y + badgeBox.height);
  expect(gap, "avstanden fra statusmerket til «Sist oppdatert»").toBeGreaterThanOrEqual(0);
  expect(gap, "avstanden fra statusmerket til «Sist oppdatert»").toBeLessThanOrEqual(12);

  // «←» har en trykkflate på minst 44 × 44 px.
  const back = (await backLink(page).boundingBox())!;
  expect(back.width).toBeGreaterThanOrEqual(44);
  expect(back.height).toBeGreaterThanOrEqual(44);
});

for (const { name, path } of [
  { name: "skjult rapport 7", path: reportUrl(7) },
  { name: "uuid som ikke finnes", path: "/rapporter/20000000-0000-4000-8000-000000000099" },
  { name: "ugyldig id abc", path: "/rapporter/abc" },
  { name: "ugyldig id 123", path: "/rapporter/123" },
  { name: "uuid med ett tegn for mye", path: `${reportUrl(1)}0` },
]) {
  test(`${name} gir 404 med «Fant ikke rapporten.» og lenke til lista`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Fant ikke rapporten." }),
    ).toBeVisible();
    await expect(
      main(page).getByRole("link", { name: "Tilbake til lista", exact: true }),
    ).toHaveAttribute("href", "/");
    await expect(backLink(page)).toBeVisible();
    // Den skjulte rapporten røper ikke innholdet sitt.
    await expect(page.getByText("Blinkende lys i trappa")).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });
}

test("404-siden har ingen alvorlige axe-funn", async ({ page }) => {
  await page.goto(reportUrl(7));
  await expect(
    page.getByRole("heading", { level: 1, name: "Fant ikke rapporten." }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("detaljsiden sender ikke forfatterne eller bildestien, caches ikke og har ikke lista sine Skeleton-kort", async ({
  request,
}) => {
  const html = await request.get(reportUrl(1));
  expect(html.status()).toBe(200);
  expect(html.headers()["cache-control"]).toContain("no-store");
  const htmlBody = await html.text();
  // Kontroll: svaret har faktisk rapporten.
  expect(htmlBody).toContain("Full søppelkasse ved hovedinngangen");

  // RSC-nyttelasten, slik klientnavigasjonen henter den.
  const rsc = await request.get(reportUrl(1), { headers: { RSC: "1" } });
  expect(rsc.headers()["content-type"]).toContain("text/x-component");
  expect(rsc.headers()["cache-control"]).toContain("no-store");
  const rscBody = await rsc.text();
  expect(rscBody).toContain("Full søppelkasse ved hovedinngangen");

  for (const [name, body] of [
    ["HTML-en", htmlBody],
    ["RSC-nyttelasten", rscBody],
  ]) {
    for (const forbidden of [...AUTHOR_IDS, "author_id", "user_id", "image_path"]) {
      expect(body, `${name} inneholder ${forbidden}`).not.toContain(forbidden);
    }
    // Lastegrensen til lista gjelder ikke detaljsiden.
    expect(body, `${name} har lista sine Skeleton-kort`).not.toContain("Laster rapportene");
    expect(body, `${name} har lista sine Skeleton-kort`).not.toContain("animate-pulse");
  }
});

test("«←» etter trykk på et kort går tilbake i historikken til lista", async ({ page }) => {
  await page.goto("/");
  // Klikket skal være en klientnavigasjon, så appen må være hydrert.
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    (window as unknown as { samme: boolean }).samme = true;
  });

  await page.locator(`a[href="${reportUrl(2)}"]`).click();
  await expect(page).toHaveURL(reportUrl(2));
  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();
  // Samme dokument: Next lastet ikke siden på nytt.
  expect(
    await page.evaluate(() => (window as unknown as { samme?: boolean }).samme),
  ).toBe(true);

  await backLink(page).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();

  // «←» gikk tilbake i historikken, så fram-knappen gir detaljsiden igjen.
  await page.goForward();
  await expect(page).toHaveURL(reportUrl(2));
  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();
});

test("«←» etter en direkte lenke går til lista", async ({ page }) => {
  await page.goto(reportUrl(2));
  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();
  await backLink(page).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
});

test("«←» etter direkte lenke, logoen og nettleserens tilbakeknapp går til lista i appen", async ({
  page,
  baseURL,
}) => {
  await page.goto(reportUrl(2));
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "LocalFix · Campus Molde" })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(reportUrl(2));
  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();

  // Detaljsiden var første side i appen, så «←» går til lista og ikke ut av
  // appen.
  await backLink(page).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
});

test("Ctrl- eller Cmd-klikk på «←» åpner lista i en ny fane", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator(`a[href="${reportUrl(2)}"]`).click();
  await expect(page).toHaveURL(reportUrl(2));
  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();

  const [newPage] = await Promise.all([
    context.waitForEvent("page"),
    backLink(page).click({ modifiers: ["ControlOrMeta"] }),
  ]);
  await newPage.waitForLoadState();
  await expect(newPage).toHaveURL("/");
  await expect(page).toHaveURL(reportUrl(2));
  await newPage.close();
});

test("lista har ikke «←» i topplinja", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  await expect(backLink(page)).toHaveCount(0);
});
