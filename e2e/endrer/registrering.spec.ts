// Registrering (Story 2.1, FR-1): en ny konto med tilfeldig e-postadresse er
// innlogget med en gang, kommer tilbake til `next` og er ikke moderator.
// Registreringen gjøres bare med tastatur. I tillegg e-post i bruk og for
// kort passord. Testene lager kontoer, så de ligger i endrer-prosjektene.
// Kontoene blir liggende til neste `db reset`.
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { PASSWORD } from "../auth";
import { tabTo } from "../keyboard";
import { expectNoHorizontalScroll } from "../layout";

const REPORT_1 = "/rapporter/20000000-0000-4000-8000-000000000001";

const emailField = (page: Page) => page.getByLabel("E-post", { exact: true });
const passwordField = (page: Page) => page.getByLabel("Passord", { exact: true });
const submitButton = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: "Registrer konto", exact: true });

test("en ny konto er innlogget med en gang, uten «Moderator», og er tilbake på next", async ({
  page,
}) => {
  const email = `ny-${randomUUID()}@localfix.test`;
  await page.goto(`/auth/sign-up?next=${encodeURIComponent(REPORT_1)}`);

  // Bare tastatur: Tab til e-postfeltet, skriv, Tab til passordet og Enter.
  await tabTo(page, "textbox", "E-post", { max: 10 });
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await expect(passwordField(page)).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(REPORT_1);
  await expect(
    page.getByRole("heading", { level: 1, name: "Full søppelkasse ved hovedinngangen" }),
  ).toBeVisible();

  // Menyen med tastatur: e-postadressen og «Logg ut», ikke «Moderator».
  // Passordfeltet som hadde fokus, er borte, så Shift+Tab går opp til
  // menyknappen.
  await tabTo(page, "button", "Meny", { max: 10, reverse: true });
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu.getByText(email, { exact: true })).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText(["Logg ut"]);
  await expect(menu.getByText("Moderator")).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  await page.keyboard.press("Escape");

  // Sesjonen gjelder også på serveren etter en ny innlasting.
  await page.reload();
  await page.getByRole("banner").getByRole("button", { name: "Meny" }).click();
  await expect(page.getByRole("menu").getByText(email, { exact: true })).toBeVisible();
});

test("en e-postadresse som er i bruk, gir feil ved e-postfeltet", async ({ page }) => {
  await page.goto("/auth/sign-up");
  await emailField(page).fill("bruker1@localfix.test");
  await passwordField(page).fill(PASSWORD);
  await submitButton(page).click();

  await expect(
    page.getByText("Det finnes allerede en konto med denne e-postadressen.", { exact: true }),
  ).toBeVisible();
  await expect(emailField(page)).toBeFocused();
  await expect(emailField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(emailField(page)).toHaveAccessibleDescription(
    "Det finnes allerede en konto med denne e-postadressen.",
  );
  await expect(page).toHaveURL("/auth/sign-up");
  await expect(page.getByText(/already registered/i)).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});

test("et passord på 5 tegn gir feil ved passordfeltet uten kall til Supabase", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/")) requests.push(request.url());
  });

  await page.goto("/auth/sign-up");
  await emailField(page).fill(`kort-${randomUUID()}@localfix.test`);
  await passwordField(page).fill("12345");
  await submitButton(page).click();

  await expect(page.getByText("Passordet må ha minst 6 tegn.", { exact: true })).toBeVisible();
  await expect(passwordField(page)).toBeFocused();
  await expect(passwordField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(passwordField(page)).toHaveAccessibleDescription(
    "Minst 6 tegn. Passordet må ha minst 6 tegn.",
  );
  await expect(emailField(page)).not.toHaveAttribute("aria-invalid");
  expect(requests, "kall til Supabase Auth").toEqual([]);
  await expectNoSeriousA11yViolations(page);
});
