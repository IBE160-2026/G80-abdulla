import { defineConfig, devices } from "@playwright/test";

// Playwright-oppsettet (AD-15). `npm run test:e2e` tilbakestiller den lokale
// databasen, bygger appen, starter `next start` på port 3100 og kjører testene
// i e2e/ i fast rekkefølge: lesetester, så tester som endrer data, så tester
// med egen `db reset`. Supabase må kjøre (`npx supabase start`).
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

const SMALL = { width: 360, height: 800 };
const LARGE = { width: 1280, height: 800 };

export default defineConfig({
  testDir: "e2e",
  // Testene deler én database, så de kjører én og én.
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  // Playwright legger **/ foran mønstrene og sammenligner med hele stien, så
  // de starter med e2e/. Ellers kunne en mappe som heter les, endrer eller
  // reset et sted i stien til klonen trekke testene inn i feil prosjekt.
  projects: [
    { name: "les-360", testMatch: "e2e/les/**/*.spec.ts", use: { viewport: SMALL } },
    { name: "les-1280", testMatch: "e2e/les/**/*.spec.ts", use: { viewport: LARGE } },
    {
      name: "endrer-360",
      testMatch: ["e2e/core-flow.spec.ts", "e2e/endrer/**/*.spec.ts"],
      dependencies: ["les-360", "les-1280"],
      use: { viewport: SMALL },
    },
    {
      name: "endrer-1280",
      testMatch: ["e2e/core-flow.spec.ts", "e2e/endrer/**/*.spec.ts"],
      dependencies: ["les-360", "les-1280"],
      use: { viewport: LARGE },
    },
    {
      // Tester som kjører `db reset` selv: lista med andre data enn seed
      // (Story 1.4) og et bilde som mangler i bucketen (Story 1.7).
      name: "reset",
      testMatch: "e2e/reset/**/*.spec.ts",
      dependencies: ["endrer-360", "endrer-1280"],
      use: { viewport: LARGE },
    },
  ],
  webServer: {
    // Én kjede med && garanterer rekkefølgen reset → build → start. Playwright
    // kjører kommandoen gjennom cmd.exe på Windows og sh ellers, så kjeden
    // virker også når npm test startes fra Windows PowerShell 5.1, som ikke
    // har &&. Next leser .env selv.
    command: `npx supabase db reset && npx next build && npx next start -p ${PORT}`,
    url: BASE_URL,
    // Port 3100, så en åpen `npm run dev` på 3000 aldri blir testet ved et uhell.
    reuseExistingServer: false,
    // Et kaldt bygg kan ta flere minutter.
    timeout: 600_000,
    // Satt her, så en KI-nøkkel i .env aldri brukes i test. Next overstyrer
    // ikke variabler som allerede finnes i miljøet.
    env: { AI_PROVIDER: "mock" },
  },
});
