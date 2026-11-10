// Legge ved et bilde (Story 2.4, FR-3, UX-DR10, AD-9, P-1): «Legg til bilde» med
// teksten om ansikter og bilskilt, forhåndsvisning og «Fjern bilde», feil fil
// avvist med en gang ved feltet (tom, feil type, ikke et bilde, for stor, for
// store dimensjoner), innsending av et bilde på nøyaktig 5 MiB (grensen for
// forespørselsstørrelse), EXIF fjernet fra den lagrede fila og bildet rettet
// etter orienteringen, bildet på detaljsiden og ikonet i lista, at en feilet
// innsending beholder bildet, og at serverens avvisning vises ved feltet. axe og
// breddesjekk på 360, 320 og 1280 px. Alle bilder lages med sharp
// (lib/test-images.ts), og GPS-koordinatene er oppdiktet. Testene lager
// rapporter og bilder, så de ligger i endrer-prosjektene.
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import {
  EXIF_WORDS,
  gif,
  hugePng,
  jpegAtLimit,
  jpegOverLimit,
  jpegWithExif,
  plainJpeg,
} from "../../lib/test-images";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn } from "../auth";
import { expectNoHorizontalScroll } from "../layout";

const NEW_REPORT = "/rapporter/ny";
const HINT = "Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP, maks 5 MB.";

const description = (page: Page) => page.getByLabel("Beskrivelse", { exact: true });
const location = (page: Page) => page.getByLabel("Lokasjon", { exact: true });
const category = (page: Page) => page.getByRole("combobox", { name: "Kategori", exact: true });
const submit = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: /^(Send inn|Sender …)$/ });
const addButton = (page: Page) => page.getByRole("button", { name: "Legg til bilde", exact: true });
const removeButton = (page: Page) => page.getByRole("button", { name: "Fjern bilde", exact: true });
const preview = (page: Page) =>
  page.getByRole("img", { name: "Forhåndsvisning av valgt bilde", exact: true });
const fileInput = (page: Page) => page.locator('input[type="file"]');
const imageError = (page: Page) => page.locator("#image-error");
const detailImage = (page: Page) =>
  page.getByRole("main").getByRole("img", { name: "Bilde fra rapporten", exact: true });

async function openForm(page: Page) {
  await logIn(page, "bruker2@localfix.test", { next: NEW_REPORT });
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
}

/** Velger en fil i filfeltet, slik et valg i filvelgeren gjør. */
async function pick(page: Page, name: string, mimeType: string, buffer: Buffer) {
  await fileInput(page).setInputFiles({ name, mimeType, buffer });
}

/** axe og breddesjekk, og også 320 px i 360-prosjektet. */
async function expectAccessibleLayout(page: Page) {
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (page.viewportSize()!.width === 360) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }
}

/** Fyller beskrivelse (mock-forslag: «hull» gir Vei og fortau) og lokasjon. */
async function fillReport(page: Page, unique: string) {
  await description(page).fill(`Hull i veien ${unique}`);
  await description(page).blur();
  await expect(category(page)).toHaveText("Vei og fortau");
  await location(page).fill("Gangveien ved bygg A");
  await expect(submit(page)).toBeEnabled();
}

test("knappen, teksten under og valget: forhåndsvisning, fjerne og velge igjen", async ({ page }) => {
  await openForm(page);

  await expect(addButton(page)).toBeVisible();
  await expect(page.getByText(HINT, { exact: true })).toBeVisible();
  await expect(addButton(page)).toHaveAccessibleDescription(HINT);
  // Ingen `capture`, så mobilen tilbyr både kamera og bibliotek.
  await expect(fileInput(page)).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  await expect(fileInput(page)).not.toHaveAttribute("capture");
  await expect(preview(page)).toHaveCount(0);
  await expect(addButton(page)).toHaveCSS("height", "44px");

  await pick(page, "problem.jpg", "image/jpeg", await plainJpeg(300, 200));
  await expect(preview(page)).toBeVisible();
  await expect(preview(page)).toHaveAttribute("src", /^blob:/);
  expect(await preview(page).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(300);
  await expect(removeButton(page)).toBeVisible();
  await expect(addButton(page)).toHaveCount(0);
  await expect(imageError(page)).toHaveCount(0);
  await expect(preview(page)).toHaveCSS("border-radius", "12px");
  await expectAccessibleLayout(page);

  // «Fjern bilde» gir fokus tilbake til «Legg til bilde», og samme fil kan velges igjen.
  await removeButton(page).click();
  await expect(preview(page)).toHaveCount(0);
  await expect(addButton(page)).toBeFocused();
  await pick(page, "problem.jpg", "image/jpeg", await plainJpeg(300, 200));
  await expect(preview(page)).toBeVisible();
});

test("«Legg til bilde» åpner filvelgeren, også med tastatur", async ({ page }) => {
  await openForm(page);
  await addButton(page).focus();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.keyboard.press("Enter"),
  ]);
  expect(chooser.isMultiple()).toBe(false);
  await chooser.setFiles({ name: "tastatur.jpg", mimeType: "image/jpeg", buffer: await plainJpeg() });
  await expect(preview(page)).toBeVisible();
});

test.describe("feil fil avvises med en gang, med melding ved feltet", () => {
  const cases = [
    {
      name: "en tom fil",
      file: async () => ({ name: "tom.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(0) }),
      message: "Fila er tom. Velg et annet bilde.",
    },
    {
      name: "en GIF (feil type)",
      file: async () => ({ name: "animasjon.gif", mimeType: "image/gif", buffer: await gif() }),
      message: "Bildet må være JPEG, PNG eller WebP.",
    },
    {
      name: "en tekstfil",
      file: async () => ({
        name: "tekst.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("ikke et bilde"),
      }),
      message: "Bildet må være JPEG, PNG eller WebP.",
    },
    {
      name: "tekst omdøpt til .jpg (ikke et gyldig bilde)",
      file: async () => ({
        name: "falsk.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("ikke et bilde"),
      }),
      message: "Fila er ikke et gyldig bilde.",
    },
    {
      name: "5 MiB + 1 byte",
      file: async () => ({ name: "stor.jpg", mimeType: "image/jpeg", buffer: await jpegOverLimit() }),
      message: "Bildet er for stort. Maks 5 MB.",
    },
    {
      name: "et bilde med svært store dimensjoner",
      file: async () => ({
        name: "enormt.png",
        mimeType: "image/png",
        buffer: await hugePng(9000, 9000),
      }),
      message: "Bildet har for store dimensjoner.",
    },
  ];

  for (const { name, file, message } of cases) {
    test(name, async ({ page }) => {
      await openForm(page);
      await fileInput(page).setInputFiles(await file());

      await expect(imageError(page)).toHaveText(message);
      await expect(preview(page)).toHaveCount(0);
      await expect(addButton(page)).toHaveAttribute("aria-invalid", "true");
      await expect(addButton(page)).toHaveAccessibleDescription(new RegExp(`${HINT}.*${message}`));
      await expectAccessibleLayout(page);

      // Et gyldig valg fjerner meldingen.
      await pick(page, "ok.jpg", "image/jpeg", await plainJpeg());
      await expect(preview(page)).toBeVisible();
      await expect(imageError(page)).toHaveCount(0);
    });
  }

  test("et avvist valg erstatter ikke bildet som allerede er valgt", async ({ page }) => {
    await openForm(page);
    await pick(page, "ok.jpg", "image/jpeg", await plainJpeg(300, 200));
    await expect(preview(page)).toBeVisible();

    await pick(page, "animasjon.gif", "image/gif", await gif());
    await expect(imageError(page)).toHaveText("Bildet må være JPEG, PNG eller WebP.");
    await expect(preview(page)).toBeVisible();
    expect(await preview(page).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(300);
  });
});

test("rapporten sendes med bilde: EXIF er borte, bildet er rettet, og lista og detaljsiden viser det", async ({
  page,
}) => {
  await openForm(page);
  const unique = randomUUID();
  await fillReport(page, unique);
  // 40 × 20 med orientering 6 skal stå som 20 × 40 etter behandlingen.
  const original = await jpegWithExif({ orientation: 6 });
  for (const word of EXIF_WORDS) expect(original.includes(Buffer.from(word))).toBe(true);
  await pick(page, "fra-telefonen.jpg", "image/jpeg", original);
  await expect(preview(page)).toBeVisible();
  await expectAccessibleLayout(page);

  await submit(page).click();
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  await expect(
    page.locator("[data-sonner-toast]").getByText("Rapporten er sendt inn", { exact: true }),
  ).toBeVisible();

  // Bildet vises på detaljsiden, slik Story 1.7 viser det.
  await expect(detailImage(page)).toBeVisible();
  await expect
    .poll(() => detailImage(page).evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expectAccessibleLayout(page);

  // Den lagrede fila, hentet med den signerte lenken: ingen EXIF, GPS, enhet eller tidspunkt.
  const src = await detailImage(page).getAttribute("src");
  const response = await page.request.get(src!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/jpeg");
  const stored = await response.body();
  const metadata = await sharp(stored).metadata();
  expect(metadata.exif).toBeUndefined();
  for (const word of EXIF_WORDS) expect(stored.includes(Buffer.from(word)), word).toBe(false);
  expect([metadata.width, metadata.height]).toEqual([20, 40]);
  expect(metadata.orientation).toBeUndefined();

  // Stien i URL-en er <author_id>/<uuid>.jpg, og endelsen kommer fra innholdet.
  expect(new URL(src!).pathname).toMatch(
    /\/report-images\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/,
  );

  // Lista viser ikonet, og aldri selve bildet.
  await page.goto("/");
  const card = page.getByRole("main").getByRole("listitem").filter({ hasText: unique });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("img", { name: "Har bilde", exact: true })).toBeVisible();
  await expect(card.locator("img")).toHaveCount(0);
});

test("et bilde på nøyaktig 5 MiB går gjennom innsendingen", async ({ page }) => {
  await openForm(page);
  const unique = randomUUID();
  await fillReport(page, unique);
  const image = await jpegAtLimit();
  expect(image.length).toBe(5_242_880);
  await pick(page, "nesten-for-stort.jpg", "image/jpeg", image);
  await expect(preview(page)).toBeVisible();
  await expect(imageError(page)).toHaveCount(0);

  await submit(page).click();
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(detailImage(page)).toBeVisible();
  await expect
    .poll(() => detailImage(page).evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test("uten bilde lagres rapporten uten bildeikon", async ({ page }) => {
  await openForm(page);
  const unique = randomUUID();
  await fillReport(page, unique);
  await submit(page).click();
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  await expect(detailImage(page)).toHaveCount(0);

  await page.goto("/");
  const card = page.getByRole("main").getByRole("listitem").filter({ hasText: unique });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("img", { name: "Har bilde", exact: true })).toHaveCount(0);
});

test("feiler innsendingen, beholder skjemaet alt, også bildet", async ({ page }) => {
  await openForm(page);
  const unique = randomUUID();
  await fillReport(page, unique);
  await pick(page, "beholdes.jpg", "image/jpeg", await plainJpeg(300, 200));
  await expect(preview(page)).toBeVisible();

  // Det første kallet med rapporten (kroppen har «location») avbrytes, som et nettverksbrudd.
  let aborted = false;
  await page.route(`**${NEW_REPORT}`, async (route) => {
    const body = route.request().postDataBuffer()?.toString("latin1") ?? "";
    if (route.request().method() === "POST" && !aborted && body.includes('"location"')) {
      aborted = true;
      await route.abort();
      return;
    }
    await route.continue();
  });

  await submit(page).click();
  await expect(
    page.locator("[data-sonner-toast]").getByText("Kunne ikke sende inn. Prøv igjen.", { exact: true }),
  ).toBeVisible();
  expect(aborted).toBe(true);
  await expect(page).toHaveURL(NEW_REPORT);
  await expect(preview(page)).toBeVisible();
  expect(await preview(page).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(300);
  await expect(description(page)).toHaveValue(`Hull i veien ${unique}`);
  await expect(location(page)).toHaveValue("Gangveien ved bygg A");
  await expect(category(page)).toHaveText("Vei og fortau");
  await expect(imageError(page)).toHaveCount(0);

  // Et nytt forsøk går gjennom, med samme bilde.
  await expect(submit(page)).toBeEnabled();
  await submit(page).click();
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  await expect(detailImage(page)).toBeVisible();
});

test("serveren avviser en fil skjemaet slapp gjennom, og meldingen står ved bildefeltet", async ({
  page,
}) => {
  await openForm(page);
  const unique = randomUUID();
  await fillReport(page, unique);
  // GIF-innhold under typen image/jpeg: nettleseren viser den, skjemaet godtar den
  // etter typen, men serveren leser typen fra innholdet og avviser den.
  await pick(page, "lureri.jpg", "image/jpeg", await gif());
  await expect(preview(page)).toBeVisible();
  await expect(imageError(page)).toHaveCount(0);

  await submit(page).click();
  await expect(imageError(page)).toHaveText(
    "Bildet kan ikke brukes. Velg et JPEG-, PNG- eller WebP-bilde på høyst 5 MB.",
  );
  await expect(page).toHaveURL(NEW_REPORT);
  await expect(preview(page)).toHaveCount(0);
  await expect(addButton(page)).toBeFocused();
  await expect(addButton(page)).toHaveAttribute("aria-invalid", "true");
  // Resten beholdes, og rapporten kan sendes uten bilde.
  await expect(description(page)).toHaveValue(`Hull i veien ${unique}`);
  await expect(submit(page)).toBeEnabled();
  await expectAccessibleLayout(page);
});
