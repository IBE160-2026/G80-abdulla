// Kjerneflyttesten (AR-14). Etter første `goto` brukes bare `page.keyboard`.
// Hver flate-story utvider testen med tastaturstegene sine (`tabTo` i
// keyboard.ts), axe-sjekken og breddesjekken. Den ligger i endrer-prosjektene,
// fordi den skal endre data fra Story 2.2. Fra Story 2.1 logger den inn til
// slutt med kjerneflytbrukeren for prosjektet (360 eller 1280). Fra Story 2.2
// registrerer den en rapport, bare med tastatur. Fra Story 2.3 bruker den
// mock-forslaget for kategori og oppsummering. Fra Story 2.4 legger den ved et
// bilde: knappen nås med tastatur, men valget av fil er unntatt kravet om bare
// tastatur (filvelgeren er nettleserens egen), og bildet vises på detaljsiden
// og som ikon i lista. Fra Story 4.1 logger moderatoren inn til slutt,
// sorterer på «Flest har sett» og flytter statusen ett steg på rapporten
// testen registrerte. Fra Story 4.2 skjuler moderatoren rapporten, også
// bekreftelsen i dialogen, så hele AD-15-flyten går. endrer-360 og endrer-1280
// deler databasen, så lista har flere rapporter enn seed når den andre kjører.
// Stegene som åpner seed-kort, finner dem på innhold og ikke på plassering.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";
import { plainJpeg } from "./test-images";
import { tabTo } from "./keyboard";
import { expectNoHorizontalScroll } from "./layout";

test("kjerneflyten med tastatur", async ({ page }) => {
  // Hele AD-15-flyten med axe ved hvert steg (og ved 320 px i endrer-360) tar
  // over standardgrensen på 30 s etter Story 4.2.
  test.setTimeout(90_000);
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
  // Story 3.1: etter menyen kommer sorteringen og de ni filterbrikkene, før kortene.
  await tabTo(page, "combobox", "Sortering", { max: 1 });
  for (const name of [
    "Alle",
    "Søppel",
    "Belysning",
    "Vei og fortau",
    "Skadeverk",
    "Annet",
    "Ny",
    "Under behandling",
    "Løst",
  ]) {
    await tabTo(page, "button", name, { max: 1 });
  }
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

  // Story 3.1: filtrer og sorter bare med tastatur. Etter «←» står fokus øverst
  // på siden, så brikkene nås med Tab. Rapportene fra andre tester har ingen
  // bekreftelser, så rapport 2 og 1 (to hver) er øverst på «Flest har sett».
  await tabTo(page, "button", "Belysning", { max: 20 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/?category=lighting");
  await expect(page.getByRole("button", { name: "Belysning", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Belysning", exact: true })).toBeFocused();
  await expect(cards.filter({ hasText: "Slukkede gatelys på gangveien" })).toHaveCount(1);
  await expect(cards.filter({ hasNotText: "Belysning" })).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await tabTo(page, "button", "Alle", { max: 3, reverse: true });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Alle", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await tabTo(page, "combobox", "Sortering", { max: 3, reverse: true });
  // Piltastene før valglista har åpnet og gitt fokus til valget, går tapt.
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Nyeste", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Flest har sett", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/?sort=confirmations");
  await expect(page.getByRole("combobox", { name: "Sortering", exact: true })).toHaveText("Flest har sett");
  await expect(cards.nth(0)).toHaveAttribute("href", "/rapporter/20000000-0000-4000-8000-000000000002");
  await expect(cards.nth(1)).toHaveAttribute("href", "/rapporter/20000000-0000-4000-8000-000000000001");
  await expectNoSeriousA11yViolations(page);

  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Flest har sett", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("option", { name: "Nyeste", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("combobox", { name: "Sortering", exact: true })).toHaveText("Nyeste");
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(SEED_CARDS);

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
  // Mock-forslaget: «hull» gir Vei og fortau, og oppsummeringen er første setning.
  const summary = `Kjerneflyt ${unique} rettet med tastatur`;
  await tabTo(page, "link", "Registrer problem", wide ? { max: 3, reverse: true } : { max: 100 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/rapporter/ny");
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
  await expect(page.getByLabel("Beskrivelse", { exact: true })).toBeFocused();
  await page.keyboard.type(text);

  // Story 2.3: å forlate beskrivelsen henter forslaget. Kategorien velges av
  // mock-forslaget, med pillen, opplesningen og en oppsummering, og fokus står
  // fortsatt på kategorivalget.
  await page.keyboard.press("Tab");
  const categoryField = page.getByRole("combobox", { name: "Kategori", exact: true });
  await expect(categoryField).toBeFocused();
  await expect(categoryField).toHaveText("Vei og fortau");
  await expect(page.getByText("Foreslått av KI", { exact: true })).toBeVisible();
  await expect(page.locator('p[aria-live="polite"]')).toHaveText("Kategori foreslått: Vei og fortau");
  await expect(categoryField).toBeFocused();
  // Teksten står også i beskrivelsen (textarea), så bare avsnittet med oppsummeringen teller.
  await expect(page.getByText(text, { exact: true }).and(page.locator("p"))).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // Tab til «Endre», Enter åpner oppsummeringen, og Ctrl+A og skriving bytter den ut.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Endre", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Oppsummering", { exact: true })).toBeFocused();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(summary);

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Lokasjon", { exact: true })).toBeFocused();
  await page.keyboard.type("Utenfor kjerneflyttesten");
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Story 2.4: Tab til «Legg til bilde», og Enter åpner filvelgeren. Selve valget
  // av fil er unntatt kravet om bare tastatur. Etterpå står fokus på «Fjern bilde».
  await page.keyboard.press("Tab");
  const addImage = page.getByRole("button", { name: "Legg til bilde", exact: true });
  await expect(addImage).toBeFocused();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.keyboard.press("Enter"),
  ]);
  await chooser.setFiles({
    name: "kjerneflyt.jpg",
    mimeType: "image/jpeg",
    buffer: await plainJpeg(300, 200),
  });
  await expect(
    page.getByRole("img", { name: "Forhåndsvisning av valgt bilde", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Fjern bilde", exact: true })).toBeFocused();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  await page.keyboard.press("Tab");
  const send = page.getByRole("button", { name: "Send inn", exact: true });
  await expect(send).toBeFocused();
  await expect(send).toBeEnabled();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  // Story 4.1: moderatoren åpner denne rapporten til slutt.
  const reportPath = new URL(page.url()).pathname;
  await expect(
    page.locator("[data-sonner-toast]").getByText("Rapporten er sendt inn", { exact: true }),
  ).toBeVisible();
  const main = page.getByRole("main");
  // Overskriften er oppsummeringen brukeren skrev, og beskrivelsen står under.
  await expect(main.getByRole("heading", { level: 1, name: summary, exact: true })).toBeVisible();
  await expect(main.getByText(text, { exact: true })).toBeVisible();
  await expect(main.getByText("1 har sett dette", { exact: true })).toBeVisible();
  // Story 3.3: rapportøren kan ikke bekrefte sin egen rapport.
  await expect(main.getByRole("button", { name: "Din rapport", exact: true })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  // Bildet står på detaljsiden (SM-1).
  const detailImage = main.getByRole("img", { name: "Bilde fra rapporten", exact: true });
  await expect(detailImage).toBeVisible();
  await expect
    .poll(() => detailImage.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(300);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // «←» går til lista, og rapporten står øverst med status Ny. Etter innsendingen
  // fortsetter Tab fra stedet der «Send inn» sto, og bekreftknappen (Story 3.3)
  // og toasten står etter det, så topplinja nås med Shift+Tab.
  await tabTo(page, "link", "Tilbake til lista", { max: 10, reverse: true });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();
  await expect(cards.first()).toContainText(summary);
  await expect(cards.first()).toContainText("Ny");
  // Og lista viser bildeikonet, aldri selve bildet.
  await expect(cards.first().getByRole("img", { name: "Har bilde", exact: true })).toBeVisible();
  await expect(cards.first().locator("img")).toHaveCount(0);

  // Story 3.2: «Mine rapporter» er første brikke for en innlogget bruker og
  // slås på med Enter. Lista viser da bare brukerens egne rapporter: den nye
  // øverst, og ingen av seed-rapportene til bruker1 og bruker2.
  await tabTo(page, "button", "Mine rapporter", { max: 20 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/?mine=true");
  const mine = page.getByRole("button", { name: "Mine rapporter", exact: true });
  await expect(mine).toHaveAttribute("aria-pressed", "true");
  await expect(mine).toBeFocused();
  await expect(cards.first()).toContainText(summary);
  await expect(cards.filter({ hasText: "Slukkede gatelys på gangveien" })).toHaveCount(0);
  await expect(cards.filter({ hasText: "Full søppelkasse ved hovedinngangen" })).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Story 3.3: bekreft en annens rapport bare med tastatur. Enter på «Mine
  // rapporter» slår den av, og Tab går gjennom kortene til rapport 2 (bruker2s
  // rapport). Kjerneflytbrukeren for prosjektet har ikke bekreftet den, og
  // hvert prosjekt har sin egen bruker. Telleren er seed-tallet pluss det
  // første prosjektet har lagt til, så den leses først. Telleren går opp med
  // én, og knappen beholder fokus som «Du har sett dette ✓».
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(mine).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(SEED_CARDS);
  await tabTo(page, "link", /Slukkede gatelys på gangveien/, { max: 100 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/rapporter/20000000-0000-4000-8000-000000000002");
  const seenText = page.getByRole("main").locator('[aria-live="polite"]');
  await expect(seenText).toHaveText(/^\d+ har sett dette$/);
  const seenBefore = Number.parseInt((await seenText.textContent()) ?? "", 10);
  await tabTo(page, "button", "Jeg har også sett dette", { max: 20 });
  await page.keyboard.press("Enter");
  await expect(seenText).toHaveText(`${seenBefore + 1} har sett dette`);
  const confirmed = page.getByRole("main").getByRole("button", { name: "Du har sett dette ✓", exact: true });
  await expect(confirmed).toHaveAttribute("aria-disabled", "true");
  await expect(confirmed).toBeFocused();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Story 4.1: logg ut, logg inn som moderator, sorter på «Flest har sett»,
  // åpne rapporten testen registrerte og flytt statusen ett steg, bare med
  // tastatur. Begge prosjektene bruker moderatoren, men hver sin rapport.
  await tabTo(page, "button", "Meny", { max: 20, reverse: true });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Logg ut", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();
  // Menyen er lukket, og fokus står på menyknappen eller et sted før den.
  await expect(page.getByRole("menu")).toBeHidden();
  const menuButton = page.getByRole("banner").getByRole("button", { name: "Meny", exact: true });
  const menuFocused = await menuButton.evaluate((element) => element === document.activeElement);
  if (!menuFocused) await tabTo(page, "button", "Meny", { max: 5 });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Logg inn", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/auth/login?next=%2F");
  // Menyen tones ut og gir fokus tilbake til menyknappen når den er borte, så
  // Tab venter til den er lukket (se openMenu i auth.ts).
  await expect(page.getByRole("menu")).toBeHidden();
  await tabTo(page, "textbox", "E-post", { max: 5 });
  await page.keyboard.type("moderator@localfix.test");
  await page.keyboard.press("Tab");
  await page.keyboard.type("localfix-test");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(listHeading).toBeVisible();

  // Som etter forrige innlogging: Shift+Tab til menyen, og sorteringen står
  // rett etter den. «Mine rapporter» vises først når siden er hentet på nytt
  // med sesjonen, så Tab venter på den.
  await expect(page.getByRole("button", { name: "Mine rapporter", exact: true })).toBeVisible();
  await tabTo(page, "button", "Meny", { max: 15, reverse: true });
  await tabTo(page, "combobox", "Sortering", { max: 1 });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("option", { name: "Nyeste", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Flest har sett", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/?sort=confirmations");

  await tabTo(page, "link", new RegExp(summary), { max: 300 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(reportPath);
  const moderatorPanel = main.getByRole("region", { name: "Moderator", exact: true });
  await expect(moderatorPanel).toContainText("Status: Ny");
  await expect(main.getByText("Ny", { exact: true })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await tabTo(page, "button", "Under behandling →", { max: 30 });
  await page.keyboard.press("Enter");
  await expect(main.getByText("Under behandling", { exact: true })).toBeVisible();
  await expect(moderatorPanel).toContainText("Status: Under behandling");
  await expect(moderatorPanel.getByRole("button")).toHaveText(["← Ny", "Løst →", "Skjul rapport"]);
  await expect(moderatorPanel.getByRole("button", { name: "← Ny", exact: true })).toBeFocused();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (narrow) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }

  // Story 4.2: skjul rapporten med tastatur, også bekreftelsen i dialogen.
  // Dialogen åpner med fokus på «Avbryt», og Tab går til «Skjul rapport» i
  // dialogen. Etter skjulingen står fokus på «Vis rapport», og detaljsiden
  // viser «Skjult».
  await tabTo(page, "button", "Skjul rapport", { max: 3 });
  await page.keyboard.press("Enter");
  const hideDialog = page.getByRole("alertdialog", { name: "Skjule rapporten?" });
  await expect(hideDialog.getByRole("button", { name: "Avbryt", exact: true })).toBeFocused();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  await page.keyboard.press("Tab");
  await expect(hideDialog.getByRole("button", { name: "Skjul rapport", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(hideDialog).toHaveCount(0);
  await expect(moderatorPanel.getByRole("button", { name: "Vis rapport", exact: true })).toBeFocused();
  await expect(main.getByText("Skjult", { exact: true })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
});
