// Legge ved et bilde (Story 2.4, FR-3, UX-DR10, AD-9, P-1): «Legg til bilde» med
// teksten om ansikter og bilskilt, forhåndsvisning og «Fjern bilde», feil fil
// avvist med en gang ved feltet (tom, feil type, ikke et bilde), store bilder
// gjort mindre i nettleseren før de velges (over 4 MiB, lengste side over
// 2048 px, over 40 megapiksler og med EXIF-orientering, beslutningen
// 2026-11-26), innsending av et bilde på nøyaktig 4 MiB uendret, EXIF fjernet
// fra den lagrede fila og bildet rettet etter orienteringen, bildet på
// detaljsiden og ikonet i lista, at en feilet innsending beholder bildet, og at
// serverens avvisning vises ved feltet. axe og breddesjekk på 360, 320 og
// 1280 px. Alle bilder lages med sharp (e2e/test-images.ts), og
// GPS-koordinatene er oppdiktet. Testene lager rapporter og bilder, så de
// ligger i endrer-prosjektene.
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import {
  EXIF_WORDS,
  gif,
  hugePng,
  jpegAtResizeThreshold,
  jpegOverLimit,
  jpegWithExif,
  plainJpeg,
  transparentPng,
} from "@/e2e/test-images";
import { IMAGE_RESIZE_THRESHOLD_BYTES } from "@/shared/lib/limits";
import { expectAccessibleLayout } from "../a11y";
import {
  category,
  description,
  isCreateReport,
  location,
  NEW_REPORT,
  openForm,
  submit,
} from "../report-form";

const HINT =
  "Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP. Store bilder gjøres mindre før de sendes.";

const addButton = (page: Page) => page.getByRole("button", { name: "Legg til bilde", exact: true });
const removeButton = (page: Page) => page.getByRole("button", { name: "Fjern bilde", exact: true });
const preview = (page: Page) =>
  page.getByRole("img", { name: "Forhåndsvisning av valgt bilde", exact: true });
const fileInput = (page: Page) => page.locator('input[type="file"]');
const imageError = (page: Page) => page.locator("#image-error");
const detailImage = (page: Page) =>
  page.getByRole("main").getByRole("img", { name: "Bilde fra rapporten", exact: true });

/** Velger en fil i filfeltet, slik et valg i filvelgeren gjør. */
async function pick(page: Page, name: string, mimeType: string, buffer: Buffer) {
  await fileInput(page).setInputFiles({ name, mimeType, buffer });
}

/** Målene til bildet i forhåndsvisningen, slik nettleseren leste det. */
const previewSize = (page: Page) =>
  preview(page).evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);

/**
 * Sender inn skjemaet, venter på detaljsiden og gir antall byte i forespørselen
 * med rapporten, så testen ser om bildet ble sendt uendret eller skalert.
 */
async function submitReport(page: Page): Promise<number> {
  const request = page.waitForRequest((r) => r.method() === "POST" && isCreateReport(r));
  await submit(page).click();
  const bytes = (await request).postDataBuffer()?.length ?? 0;
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  return bytes;
}

/** Den lagrede fila, hentet med den signerte lenken på detaljsiden. Alltid en JPEG her. */
async function storedJpeg(page: Page): Promise<Buffer> {
  await expect(detailImage(page)).toBeVisible();
  const src = await detailImage(page).getAttribute("src");
  const response = await page.request.get(src!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/jpeg");
  return response.body();
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

test("et bilde på nøyaktig 4 MiB sendes uendret og går gjennom innsendingen", async ({ page }) => {
  await openForm(page);
  await fillReport(page, randomUUID());
  const image = await jpegAtResizeThreshold();
  expect(image.length).toBe(IMAGE_RESIZE_THRESHOLD_BYTES);
  await pick(page, "akkurat-under.jpg", "image/jpeg", image);
  await expect(preview(page)).toBeVisible();
  await expect(imageError(page)).toHaveCount(0);

  // Hele fila er med i forespørselen, så bildet er ikke skalert.
  expect(await submitReport(page)).toBeGreaterThan(IMAGE_RESIZE_THRESHOLD_BYTES);
  const stored = await storedJpeg(page);
  const metadata = await sharp(stored).metadata();
  expect([metadata.width, metadata.height]).toEqual([40, 20]);
});

test.describe("store bilder gjøres mindre i nettleseren før de velges", () => {
  test("en fil over 5 MiB blir en liten JPEG og lagres", async ({ page }) => {
    await openForm(page);
    await fillReport(page, randomUUID());
    await pick(page, "fra-telefonen.jpg", "image/jpeg", await jpegOverLimit());
    await expect(preview(page)).toBeVisible();
    await expect(imageError(page)).toHaveCount(0);
    await expect.poll(() => previewSize(page)).toEqual([40, 20]);

    expect(await submitReport(page)).toBeLessThan(IMAGE_RESIZE_THRESHOLD_BYTES);
    const metadata = await sharp(await storedJpeg(page)).metadata();
    expect([metadata.width, metadata.height]).toEqual([40, 20]);
  });

  test("4000 × 3000 blir 2048 × 1536", async ({ page }) => {
    await openForm(page);
    await fillReport(page, randomUUID());
    await pick(page, "stort.jpg", "image/jpeg", await plainJpeg(4000, 3000));
    await expect(preview(page)).toBeVisible({ timeout: 15_000 });
    await expect(imageError(page)).toHaveCount(0);
    await expect.poll(() => previewSize(page)).toEqual([2048, 1536]);
    await expectAccessibleLayout(page);

    await submitReport(page);
    const metadata = await sharp(await storedJpeg(page)).metadata();
    expect([metadata.width, metadata.height]).toEqual([2048, 1536]);
  });

  test("en PNG over 40 megapiksler avvises ikke, men blir en JPEG på 2048 × 1536", async ({
    page,
  }) => {
    await openForm(page);
    await fillReport(page, randomUUID());
    await pick(page, "enormt.png", "image/png", await hugePng(8000, 6000));
    await expect(preview(page)).toBeVisible({ timeout: 15_000 });
    await expect(imageError(page)).toHaveCount(0);
    await expect.poll(() => previewSize(page)).toEqual([2048, 1536]);

    await submitReport(page);
    const metadata = await sharp(await storedJpeg(page)).metadata();
    expect(metadata.format).toBe("jpeg");
    expect([metadata.width, metadata.height]).toEqual([2048, 1536]);
  });

  test("en gjennomsiktig PNG får hvit bakgrunn, ikke svart", async ({ page }) => {
    await openForm(page);
    await fillReport(page, randomUUID());
    // 2100 px bred er over 2048 px, så bildet skaleres og blir en JPEG.
    await pick(page, "utklipp.png", "image/png", await transparentPng(2100, 100));
    await expect(preview(page)).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => previewSize(page)).toEqual([2048, 98]);

    await submitReport(page);
    const { data } = await sharp(await storedJpeg(page)).raw().toBuffer({ resolveWithObject: true });
    // Første piksel (R, G, B) er hvit, ikke svart.
    expect([...data.subarray(0, 3)].every((value) => value >= 250)).toBe(true);
  });

  test("orientering 6: et stort bilde skaleres stående og lagres uten EXIF", async ({ page }) => {
    await openForm(page);
    await fillReport(page, randomUUID());
    // 3000 × 2000 med orientering 6 står som 2000 × 3000, og blir 1365 × 2048.
    const original = await jpegWithExif({ width: 3000, height: 2000, orientation: 6 });
    for (const word of EXIF_WORDS) expect(original.includes(Buffer.from(word))).toBe(true);
    await pick(page, "staaende.jpg", "image/jpeg", original);
    await expect(preview(page)).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => previewSize(page)).toEqual([1365, 2048]);

    await submitReport(page);
    const stored = await storedJpeg(page);
    const metadata = await sharp(stored).metadata();
    expect([metadata.width, metadata.height]).toEqual([1365, 2048]);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    for (const word of EXIF_WORDS) expect(stored.includes(Buffer.from(word)), word).toBe(false);
  });
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
