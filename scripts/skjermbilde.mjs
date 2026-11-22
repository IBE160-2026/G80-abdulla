// Lager skjermbildene i README (Story 4.3, AR-16) fra seed-dataene:
//
//   docs/skjermbilder/liste-360.png               lista på 360 px, som besøkende
//   docs/skjermbilder/detalj-moderator-1280.png   detaljsiden til rapport 2 på
//                                                 1280 px, med moderatorpanelet
//
// Appen må kjøre med seed-dataene (`npx supabase db reset` gir dem tilbake).
// Skriptet starter ikke appen og kaller ikke Supabase CLI, og det endrer ingen
// data: det logger bare inn som moderatoren.
//
//   node scripts/skjermbilde.mjs                          mot port 3000 (npm run dev eller next start)
//   node scripts/skjermbilde.mjs http://localhost:3100    mot en annen adresse
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, expect as baseExpect } from "@playwright/test";

// npm run dev bygger hver side første gang den åpnes, så ventetiden er lang.
const expect = baseExpect.configure({ timeout: 30_000 });

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const OUT = fileURLToPath(new URL("../docs/skjermbilder/", import.meta.url));
const REPORT_2 = "/rapporter/20000000-0000-4000-8000-000000000002";
// Dev-indikatoren til Next (npm run dev) skal ikke med på bildet.
const HIDE_DEV = "nextjs-portal { display: none !important; }";

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  // Lista på 360 px, som en besøkende ser den.
  const small = await browser.newPage({
    baseURL: BASE_URL,
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
  });
  await small.goto("/");
  await expect(small.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
  await expect(small.getByRole("main").getByRole("listitem")).toHaveCount(8);
  await small.addStyleTag({ content: HIDE_DEV });
  await small.screenshot({ path: `${OUT}liste-360.png` });
  console.log(`Lagret ${OUT}liste-360.png`);

  // Detaljsiden til rapport 2 på 1280 px, innlogget som moderatoren.
  const large = await browser.newPage({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 800 },
  });
  await large.goto(`/auth/login?next=${encodeURIComponent(REPORT_2)}`);
  await large.getByLabel("E-post", { exact: true }).fill("moderator@localfix.test");
  await large.getByLabel("Passord", { exact: true }).fill("localfix-test");
  await large.getByRole("button", { name: "Logg inn", exact: true }).click();
  await expect(large).toHaveURL(`${BASE_URL}${REPORT_2}`);
  const main = large.getByRole("main");
  await expect(main.getByRole("region", { name: "Moderator", exact: true })).toBeVisible();
  const image = main.getByRole("img", { name: "Bilde fra rapporten", exact: true });
  await expect
    .poll(() => image.evaluate((img) => img.complete && img.naturalWidth))
    .toBeGreaterThan(0);
  await large.addStyleTag({ content: HIDE_DEV });
  await large.screenshot({ path: `${OUT}detalj-moderator-1280.png`, fullPage: true });
  console.log(`Lagret ${OUT}detalj-moderator-1280.png`);
} finally {
  await browser.close();
}
