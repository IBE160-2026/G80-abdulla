// Kjerneflyttesten (AR-14). Etter første `goto` brukes bare `page.keyboard`.
// Hver flate-story utvider testen med tastaturstegene sine (`tabTo` i
// keyboard.ts), axe-sjekken og breddesjekken. Den ligger i endrer-prosjektene,
// fordi den skal endre data fra Story 2.2. Fra Story 2.1 logger den inn til
// slutt med kjerneflytbrukeren for prosjektet (360 eller 1280).
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";
import { tabTo } from "./keyboard";
import { expectNoHorizontalScroll } from "./layout";

test("kjerneflyten med tastatur", async ({ page }) => {
  await page.goto("/");

  const listHeading = page.getByRole("heading", { level: 1, name: "Rapporter" });
  await expect(listHeading).toBeVisible();
  const cards = page.getByRole("main").getByRole("listitem").getByRole("link");
  await expect(cards).toHaveCount(8);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Story 1.4: Tab til topplinjelenken, menyknappen (Story 2.1) og så gjennom
  // alle kortlenkene, i rekkefølgen i lista. Hvert kort får fokus og rulles
  // inn i bildet.
  await tabTo(page, "link", "LocalFix · Campus Molde", { max: 5 });
  await tabTo(page, "button", "Meny", { max: 1 });
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const card = cards.nth(i);
    await expect(card).toBeFocused();
    await expect(card).toBeVisible();
    await expect(card).toBeInViewport();
  }

  // Story 1.5: Enter på kort 8 (rapport 1) åpner detaljsiden.
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/rapporter/20000000-0000-4000-8000-000000000001");
  await expect(
    page.getByRole("heading", { level: 1, name: "Full søppelkasse ved hovedinngangen" }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // «←» i topplinja tar brukeren tilbake til lista.
  await tabTo(page, "link", "Tilbake til lista", { max: 10 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();
  await expect(cards).toHaveCount(8);

  // I 360-prosjektet sjekkes også den smaleste bredden, 320 px (NFR-1).
  const narrow = test.info().project.name === "endrer-360";
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // Story 1.7: kortet for rapport 2 har bildeikonet. Tab dit og Enter åpner
  // detaljsiden med bildet mellom overskriften og beskrivelsen.
  const card2 = await tabTo(page, "link", /Slukkede gatelys på gangveien/, { max: 30 });
  await expect(card2.getByRole("img", { name: "Har bilde", exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/rapporter/20000000-0000-4000-8000-000000000002");
  await expect(
    page.getByRole("heading", { level: 1, name: "Slukkede gatelys på gangveien" }),
  ).toBeVisible();
  const image = page.getByRole("main").getByRole("img", { name: "Bilde fra rapporten", exact: true });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBeGreaterThan(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expect(image).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
  }

  // Story 2.1: tilbake til lista, åpne menyen, velg «Logg inn» og logg inn
  // med kjerneflytbrukeren for prosjektet. Etterpå er brukeren på lista med
  // e-postadressen i menyen.
  await tabTo(page, "link", "Tilbake til lista", { max: 10 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();

  await tabTo(page, "button", "Meny", { max: 5 });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Logg inn", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/auth/login?next=%2F");
  await expect(page.getByRole("heading", { level: 1, name: "Logg inn" })).toBeVisible();
  // Menyen tones ut når den lukkes. axe venter til den er borte.
  await expect(page.getByRole("menu")).toBeHidden();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  const email = narrow ? "kjerneflyt360@localfix.test" : "kjerneflyt1280@localfix.test";
  await tabTo(page, "textbox", "E-post", { max: 5 });
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await page.keyboard.type("localfix-test");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();

  // Passordfeltet som hadde fokus, er borte, og nettleseren fortsetter
  // derfra. Shift+Tab går opp til menyknappen i topplinja.
  await tabTo(page, "button", "Meny", { max: 15, reverse: true });
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu.getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Logg ut", exact: true })).toBeFocused();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});
