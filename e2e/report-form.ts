// Felles hjelpere for skjemaet for en ny rapport (`/rapporter/ny`), brukt av
// spec-filene i e2e/endrer/. Samlet her etter retroen for Epic 3 (handlingspunkt
// 2, `epic-3-retro-item-16`), siden hver story hadde laget sin egen kopi.
import { expect, type Page } from "@playwright/test";
import { logIn } from "./auth";

export const NEW_REPORT = "/rapporter/ny";

// Kategoriene i den rekkefølgen lista viser dem.
const CATEGORY_ORDER = ["Søppel", "Belysning", "Vei og fortau", "Skadeverk", "Annet"];

export const description = (page: Page) => page.getByLabel("Beskrivelse", { exact: true });
export const location = (page: Page) => page.getByLabel("Lokasjon", { exact: true });
export const category = (page: Page) =>
  page.getByRole("combobox", { name: "Kategori", exact: true });
export const submit = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: /^(Send inn|Sender …)$/ });

/**
 * Skiller de to Server Action-kallene til skjemaet: `createReport` har feltet
 * «location» i kroppen, forslagskallet bare beskrivelsen.
 */
export const isCreateReport = (request: { postData(): string | null }) =>
  (request.postData() ?? "").includes('"location"');

/**
 * Logger inn som bruker2 og åpner skjemaet. Skjemaet åpnes med fokus i
 * beskrivelsesfeltet (EXPERIENCE.md).
 */
export async function openForm(page: Page) {
  await logIn(page, "bruker2@localfix.test", { next: NEW_REPORT });
  await expect(page.getByRole("heading", { level: 1, name: "Ny rapport" })).toBeVisible();
  await expect(description(page)).toBeFocused();
}

/**
 * Velger en kategori med tastatur: åpner lista, piler `downs` ganger fra
 * «Søppel» og trykker Enter. Etterpå viser feltet `label` og har fokus.
 */
export async function chooseCategory(page: Page, label: string, downs: number) {
  await category(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  // Fokus flyttes til første valg når lista har åpnet. Piltastene før det
  // går tapt.
  await expect(page.getByRole("option", { name: "Søppel", exact: true })).toBeFocused();
  // Ett trykk om gangen, og vent til neste valg har fokus.
  for (let i = 1; i <= downs; i++) {
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: CATEGORY_ORDER[i], exact: true })).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(category(page)).toHaveText(label);
  await expect(category(page)).toBeFocused();
}
