// Lager skjermopptaket av kjerneflyten (Story 4.3), reserven i README for den
// som ikke får startet Docker: docs/skjermbilder/kjerneflyt.webm. Den viser en
// del av flyten i e2e/core-flow.spec.ts (AD-15), med mus i stedet for tastatur,
// i sakte tempo og uten tale, med en tekstlinje nederst som sier hva som skjer. Elementet som trykkes,
// rammes inn rett før trykket. Opptaket er 1280 × 720 og under 3 minutter.
//
// Appen må kjøre med seed-dataene og med KI i mock-modus (standard i
// .env.example). Skriptet starter ikke appen, kaller ikke Supabase CLI og er
// ikke en del av `npm test`. Det endrer data: bruker1 bekrefter rapport 8 og
// registrerer en rapport, og moderatoren flytter statusen og skjuler den.
// `npx supabase db reset` gir seed-dataene tilbake etterpå.
//
//   node scripts/opptak.mjs                          mot port 3000 (npm run dev eller next start)
//   node scripts/opptak.mjs http://localhost:3100    mot en annen adresse
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect as baseExpect } from "@playwright/test";

// npm run dev bygger hver side første gang den åpnes, så ventetiden er lang.
const expect = baseExpect.configure({ timeout: 30_000 });

const BASE_URL = new URL(process.argv[2] ?? "http://localhost:3000").origin;
const OUT = fileURLToPath(new URL("../docs/skjermbilder/", import.meta.url));
// Testbildet til seed-rapport 3 (CC0, uten metadata, se supabase/KILDER-seed-images.md).
const IMAGE = fileURLToPath(
  new URL(
    "../supabase/seed-images/10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000003.jpg",
    import.meta.url,
  ),
);
const PASSWORD = "localfix-test";
const SIZE = { width: 1280, height: 720 };
const STEPS = 7;

/** Teksten nederst og skjult dev-indikator, også etter en full sidelasting. */
function overlay() {
  const render = () => {
    if (!document.getElementById("opptak-stil")) {
      const style = document.createElement("style");
      style.id = "opptak-stil";
      style.textContent = `
        nextjs-portal { display: none !important; }
        #opptak-tekst {
          position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
          z-index: 2147483647; pointer-events: none; max-width: 90vw;
          padding: 10px 18px; border-radius: 8px;
          background: rgba(17, 24, 39, 0.88); color: #fff;
          font: 600 20px/1.4 system-ui, sans-serif; text-align: center;
        }`;
      document.head.append(style);
    }
    const text = sessionStorage.getItem("opptak-tekst");
    let box = document.getElementById("opptak-tekst");
    if (!text) return box?.remove();
    if (!box) {
      box = document.createElement("div");
      box.id = "opptak-tekst";
      document.body.append(box);
    }
    box.textContent = text;
  };
  window.__opptakTekst = render;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
}

const workDir = mkdtempSync(join(tmpdir(), "localfix-opptak-"));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL: BASE_URL,
  viewport: SIZE,
  recordVideo: { dir: workDir, size: SIZE },
});
await context.addInitScript(overlay);
const page = await context.newPage();
const main = page.getByRole("main");
const started = Date.now();
// Opptaket lagres bare når hele flyten gikk gjennom.
let complete = false;

const pause = (ms) => page.waitForTimeout(ms);

/** Viser tekstlinjen nederst og venter så den rekker å bli lest. */
async function caption(step, text) {
  await page.evaluate((value) => {
    sessionStorage.setItem("opptak-tekst", value);
    window.__opptakTekst?.();
  }, `${step}/${STEPS}  ${text}`);
  await pause(2500);
}

/** Rammer inn elementet et øyeblikk, så seeren ser hva som trykkes, og trykker. */
async function press(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => {
    element.style.outline = "4px solid #F59E0B";
    element.style.outlineOffset = "3px";
  });
  await pause(900);
  await locator.evaluate((element) => {
    element.style.outline = "";
    element.style.outlineOffset = "";
  });
  await locator.click();
}

/** Skriver i feltet tegn for tegn, i et tempo som kan følges. */
async function type(locator, text, delay = 45) {
  await press(locator);
  await locator.pressSequentially(text, { delay });
}

async function logIn(email) {
  await press(page.getByRole("banner").getByRole("button", { name: "Meny", exact: true }));
  await press(page.getByRole("menuitem", { name: "Logg inn", exact: true }));
  await expect(page.getByRole("heading", { level: 1, name: "Logg inn" })).toBeVisible();
  await type(page.getByLabel("E-post", { exact: true }), email);
  await type(page.getByLabel("Passord", { exact: true }), PASSWORD, 30);
  await press(page.getByRole("button", { name: "Logg inn", exact: true }));
  await expect(page).toHaveURL(`${BASE_URL}/`);
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  await pause(1200);
}

try {
  // 1. Lista, som en besøkende ser den.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  await caption(1, "En besøkende ser alle synlige rapporter, nyeste først");
  await page.mouse.wheel(0, 500);
  await pause(1800);
  await page.mouse.wheel(0, -500);
  await pause(1200);

  // 2. Logg inn som bruker1.
  await caption(2, "Logg inn som bruker1@localfix.test (passord localfix-test)");
  await logIn("bruker1@localfix.test");

  // 3. Filtrer og åpne en rapport.
  await caption(3, "Filtrer på «Vei og fortau» og åpne en rapport");
  await press(page.getByRole("button", { name: "Vei og fortau", exact: true }));
  await expect(page).toHaveURL(`${BASE_URL}/?category=roads_sidewalks`);
  await pause(1500);
  await press(main.getByRole("link", { name: /Glatt og ustrødd fortau langs bygg B/ }));
  await expect(
    page.getByRole("heading", { level: 1, name: "Glatt og ustrødd fortau langs bygg B" }),
  ).toBeVisible();
  await pause(1200);

  // 4. Bekreft rapporten.
  await caption(4, "«Jeg har også sett dette»: telleren går opp med én");
  await press(main.getByRole("button", { name: "Jeg har også sett dette", exact: true }));
  await expect(main.getByRole("button", { name: "Du har sett dette ✓", exact: true })).toBeVisible();
  await expect(main.getByText("2 har sett dette", { exact: true })).toBeVisible();
  await pause(2000);

  // 5. Registrer en ny rapport med KI-forslag og bilde.
  await caption(5, "Registrer et problem: KI (mock) foreslår kategori og oppsummering");
  await press(page.getByRole("banner").getByRole("link", { name: "Registrer problem", exact: true }));
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
  await type(
    page.getByLabel("Beskrivelse", { exact: true }),
    "Det er et dypt hull i veien ved sykkelstativet foran bygg C. Det fylles med vann når det regner.",
    35,
  );
  // Å forlate beskrivelsen henter forslaget.
  await page.keyboard.press("Tab");
  await expect(page.getByText("Foreslått av KI", { exact: true })).toBeVisible();
  await pause(2500);
  await type(page.getByLabel("Lokasjon", { exact: true }), "Sykkelstativet foran bygg C");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    press(page.getByRole("button", { name: "Legg til bilde", exact: true })),
  ]);
  await chooser.setFiles(IMAGE);
  await expect(page.getByRole("img", { name: "Forhåndsvisning av valgt bilde", exact: true })).toBeVisible();
  await pause(1500);
  await press(page.getByRole("button", { name: "Send inn", exact: true }));
  await expect(page).toHaveURL(/\/rapporter\/[0-9a-f-]{36}$/);
  const reportPath = new URL(page.url()).pathname;
  await expect(main.getByRole("img", { name: "Bilde fra rapporten", exact: true })).toBeVisible();
  await pause(3000);

  // 6. Moderatoren logger inn og sorterer på «Flest har sett».
  await caption(6, "Moderatoren logger inn og sorterer på «Flest har sett»");
  await press(page.getByRole("banner").getByRole("button", { name: "Meny", exact: true }));
  await press(page.getByRole("menuitem", { name: "Logg ut", exact: true }));
  await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  await expect(page.getByRole("menu")).toBeHidden();
  await pause(800);
  await logIn("moderator@localfix.test");
  await press(page.getByRole("combobox", { name: "Sortering", exact: true }));
  await press(page.getByRole("option", { name: "Flest har sett", exact: true }));
  await expect(page).toHaveURL(`${BASE_URL}/?sort=confirmations`);
  await pause(1500);
  await press(main.locator(`a[href="${reportPath}"]`));
  await expect(page).toHaveURL(`${BASE_URL}${reportPath}`);

  // 7. Status ett steg fram, og skjul rapporten med bekreftelsen.
  const panel = main.getByRole("region", { name: "Moderator", exact: true });
  await expect(panel).toContainText("Status: Ny");
  await caption(7, "Moderatoren flytter statusen ett steg og skjuler rapporten");
  await press(panel.getByRole("button", { name: "Under behandling →", exact: true }));
  await expect(panel).toContainText("Status: Under behandling");
  await pause(2000);
  await press(panel.getByRole("button", { name: "Skjul rapport", exact: true }));
  const dialog = page.getByRole("alertdialog", { name: "Skjule rapporten?" });
  await expect(dialog).toBeVisible();
  await pause(2500);
  await press(dialog.getByRole("button", { name: "Skjul rapport", exact: true }));
  await expect(panel.getByRole("button", { name: "Vis rapport", exact: true })).toBeVisible();
  await expect(main.getByText("Skjult", { exact: true })).toBeVisible();
  await pause(2000);
  await press(page.getByRole("link", { name: "Tilbake til lista", exact: true }));
  const card = main.locator(`a[href="${reportPath}"]`);
  await expect(card.getByText("Skjult", { exact: true })).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    sessionStorage.setItem("opptak-tekst", "Bare moderatoren ser den skjulte rapporten, merket «Skjult»");
    window.__opptakTekst?.();
  });
  await pause(4000);
  complete = true;
} finally {
  const video = page.video();
  // Videoen skrives ferdig når konteksten lukkes, og må lagres før nettleseren lukkes.
  await context.close();
  if (video && complete) {
    await video.saveAs(`${OUT}kjerneflyt.webm`);
    console.log(`Lagret ${OUT}kjerneflyt.webm (${Math.round((Date.now() - started) / 1000)} s)`);
  } else {
    console.error(
      "Opptaket ble ikke lagret. Kjør `npx supabase db reset`, sjekk at AI_PROVIDER=mock i .env, og prøv igjen.",
    );
  }
  await browser.close();
  rmSync(workDir, { recursive: true, force: true });
}
