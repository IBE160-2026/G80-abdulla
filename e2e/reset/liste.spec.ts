// Rapportlista med andre data enn seed (Story 1.4): ytelsen med 100 ekstra
// rapporter (NFR-6), avkortet liste og tom database. Testene endrer databasen
// med fixturene i e2e/fixtures/ og ligger derfor i prosjektet reset, som
// kjører sist. afterAll tilbakestiller databasen, så seed-dataene er der igjen.
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { RESET_TIMEOUT, resetDb, runSqlFile } from "../db";

// Seed har 8 synlige rapporter (og én skjult).
const SEED_VISIBLE = 8;

test.afterAll(() => {
  test.setTimeout(RESET_TIMEOUT);
  resetDb();
});

test("lista med 100 ekstra rapporter er lastet på under 2000 ms", async ({
  page,
}) => {
  test.setTimeout(RESET_TIMEOUT);
  resetDb();
  runSqlFile("rapporter-100.sql");

  // getByRole tar bare med elementer som er synlige for skjermlesere, så
  // telleren når 108 først når hele lista er vist, ikke mens den strømmes inn.
  const cards = page.getByRole("main").getByRole("listitem");
  const start = performance.now();
  await page.goto("/");
  await expect(cards).toHaveCount(SEED_VISIBLE + 100);
  await expect(cards.last()).toBeVisible();
  const ms = Math.round(performance.now() - start);

  test.info().annotations.push({ type: "ytelse", description: `${ms} ms` });
  console.log(`Lista med ${SEED_VISIBLE + 100} rapporter: ${ms} ms`);
  expect(ms, `Lista brukte ${ms} ms`).toBeLessThan(2000);
});

test("med over 500 synlige rapporter viser lista 500 og sier at den er avkortet", async ({
  page,
}) => {
  test.setTimeout(RESET_TIMEOUT);
  resetDb();
  runSqlFile("rapporter-500.sql");

  await page.goto("/");
  const cards = page.getByRole("main").getByRole("listitem");
  await expect(cards).toHaveCount(500);
  // De nyeste beholdes: seed-rapportene øverst (rapport 9 først) og så
  // fixture-rapport 1–492. Rapport 493–500 er de eldste og faller ut.
  // (\D|$) gjør at 49 ikke treffer 492, og 492 ikke treffer 4920.
  await expect(cards.first().getByRole("link")).toHaveAttribute(
    "href",
    "/rapporter/20000000-0000-4000-8000-000000000009",
  );
  await expect(page.getByText(/^Testrapport nummer 492(\D|$)/)).toHaveCount(1);
  await expect(page.getByText(/^Testrapport nummer 493(\D|$)/)).toHaveCount(0);
  await expect(page.getByText("500 rapporter", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Lista viser bare de 500 første rapportene.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("tom database gir tomtilstanden uten antall", async ({ page }) => {
  runSqlFile("tom.sql");

  await page.goto("/");
  await expect(
    page.getByText("Ingen rapporter ennå. Har du sett noe som bør fikses?", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("list")).toHaveCount(0);
  await expect(page.getByText(/^\d+ rapport(er)?$/)).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
});
