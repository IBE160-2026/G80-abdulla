// Kjerneflyttesten (AR-14). Etter første `goto` brukes bare `page.keyboard`.
// Hver flate-story utvider testen med tastaturstegene sine (`tabTo` i
// keyboard.ts), axe-sjekken og breddesjekken. Den ligger i endrer-prosjektene,
// fordi den skal endre data fra Story 2.2. Fra Story 2.1 logger den inn til
// slutt med kjerneflytbrukeren for prosjektet (360 eller 1280). Fra Story 2.2
// registrerer den en rapport, bare med tastatur. endrer-360 og endrer-1280
// deler databasen, så lista har flere rapporter enn seed når den andre kjører.
// Stegene som åpner seed-kort, finner dem på innhold og ikke på plassering.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";
import { tabTo } from "./keyboard";
import { expectNoHorizontalScroll } from "./layout";

test("kjerneflyten med tastatur", async ({ page }) => {
  // Lista har minst de åtte seed-rapportene. Flere kommer fra tidligere
  // kjøringer mot samme database, og de nyeste står øverst.
  const SEED_CARDS = 8;
  const wide = (page.viewportSize()?.width ?? 0) >= 640;
  await page.goto("/");

  const listHeading = page.getByRole("heading", { level: 1, name: "Rapporter" });
  await expect(listHeading).toBeVisible();
  const cards = page.getByRole("main").getByRole("listitem").getByRole("link");
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(SEED_CARDS);
  const cardCount = await cards.count();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Story 1.4: Tab til topplinjelenken, menyknappen (Story 2.1) og så gjennom
  // alle kortlenkene, i rekkefølgen i lista. Hvert kort får fokus og rulles
  // inn i bildet.
  await tabTo(page, "link", "LocalFix · Campus Molde", { max: 5 });
  // Story 2.2: fra 640 px står «Registrer problem» i topplinja, foran menyen.
  if (wide) await tabTo(page, "link", "Registrer problem", { max: 1 });
  await tabTo(page, "button", "Meny", { max: 1 });
  for (let i = 0; i < cardCount; i++) {
    await page.keyboard.press("Tab");
    const card = cards.nth(i);
    await expect(card).toBeFocused();
    await expect(card).toBeVisible();
    await expect(card).toBeInViewport();
  }

  // Story 1.5: Enter på det siste kortet, det eldste (rapport 1), åpner
  // detaljsiden.
  await expect(cards.last()).toHaveAttribute(
    "href",
    "/rapporter/20000000-0000-4000-8000-000000000001",
  );
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
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(SEED_CARDS);

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
  const card2 = await tabTo(page, "link", /Slukkede gatelys på gangveien/, { max: 100 });
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
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  // Story 2.2: registrer en rapport bare med tastatur. Under 640 px er
  // inngangen den flytende «+»-knappen etter lista, fra 640 px lenka i
  // topplinja foran menyen. Teksten er unik per kjøring.
  const unique = randomUUID();
  const text = `Kjerneflyt ${unique} hull i veien`;
  await tabTo(page, "link", "Registrer problem", wide ? { max: 3, reverse: true } : { max: 100 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/rapporter/ny");
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
  await expect(page.getByLabel("Beskrivelse", { exact: true })).toBeFocused();
  await page.keyboard.type(text);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Kategori", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Søppel", exact: true })).toBeFocused();
  // Ett trykk om gangen, og vent til neste valg har fokus.
  for (const name of ["Belysning", "Vei og fortau", "Skadeverk"]) {
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Kategori", exact: true })).toHaveText("Skadeverk");

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Lokasjon", { exact: true })).toBeFocused();
  await page.keyboard.type("Utenfor kjerneflyttesten");
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await page.keyboard.press("Tab");
  const send = page.getByRole("button", { name: "Send inn", exact: true });
  await expect(send).toBeFocused();
  await expect(send).toBeEnabled();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  await expect(
    page.locator("[data-sonner-toast]").getByText("Rapporten er sendt inn", { exact: true }),
  ).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Skadeverk", exact: true })).toBeVisible();
  await expect(main.getByText(text, { exact: true })).toBeVisible();
  await expect(main.getByText("1 har sett dette", { exact: true })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // «←» går til lista, og rapporten står øverst med status Ny.
  await tabTo(page, "link", "Tilbake til lista", { max: 10 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();
  await expect(cards.first()).toContainText(text);
  await expect(cards.first()).toContainText("Ny");
});
