// Detaljsiden når bildeobjektet mangler (Story 1.7): rapport 4 peker på et
// bilde som ikke finnes i bucketen. Storage gir da en feil, signReportImage
// gir null, og siden vises uten bilde og uten feilside. Testen endrer
// databasen med e2e/fixtures/bilde-mangler.sql og ligger derfor i prosjektet
// reset. afterAll tilbakestiller databasen, så seed-dataene er der igjen.
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { resetDb, runSqlFile } from "../db";

const REPORT_URL = "/rapporter/20000000-0000-4000-8000-000000000004";
// `db reset` tar rundt et halvt minutt.
const RESET_TIMEOUT = 180_000;

test.afterAll(() => {
  test.setTimeout(RESET_TIMEOUT);
  resetDb();
});

test("rapport 4 med et bilde som mangler, gir 200 uten bilde og uten feilside", async ({
  page,
}) => {
  runSqlFile("bilde-mangler.sql");

  const response = await page.goto(REPORT_URL);
  expect(response?.status()).toBe(200);
  const main = page.getByRole("main");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skadeverk");
  await expect(
    main.getByText("Noen har tagget ned veggen på sykkelskuret med svart spraymaling.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(main.getByText("1 har sett dette", { exact: true })).toBeVisible();

  // Ingen <img> og ingen signert lenke, og ikke feilsiden.
  await expect(main.locator("img")).toHaveCount(0);
  expect(await page.content()).not.toMatch(/\/storage\/v1\/object\/sign\//);
  await expect(page.getByText("Noe gikk galt. Prøv igjen.")).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
});
