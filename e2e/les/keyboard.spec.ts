// Tester Tab-hjelperen på en egen side, siden appen ennå ikke har fokuserbare
// elementer.
import { expect, test } from "@playwright/test";
import { tabTo } from "../keyboard";

const BUTTONS = `
  <main>
    <button type="button">Første</button>
    <button type="button">Andre</button>
    <button type="button">Tredje</button>
  </main>
`;

test("tabTo finner knappen med riktig navn", async ({ page }) => {
  await page.setContent(BUTTONS);
  await tabTo(page, "button", "Andre");
  await expect(page.getByRole("button", { name: "Andre" })).toBeFocused();
});

test("tabTo virker når to elementer har samme rolle og navn", async ({
  page,
}) => {
  await page.setContent(`
    <main>
      <button type="button">Første</button>
      <button type="button">Lagre</button>
      <button type="button">Lagre</button>
    </main>
  `);
  const focused = await tabTo(page, "button", "Lagre");
  await expect(focused).toBeFocused();
  await expect(page.getByRole("button", { name: "Lagre" }).first()).toBeFocused();
});

test("tabTo feiler og navngir rolle og navn når elementet mangler", async ({
  page,
}) => {
  await page.setContent(BUTTONS);
  await expect(tabTo(page, "button", "Fjerde", { max: 5 })).rejects.toThrow(
    "tabTo: button «Fjerde» fikk ikke fokus etter 5 trykk på Tab.",
  );
});

test("tabTo med reverse går bakover med Shift+Tab", async ({ page }) => {
  await page.setContent(BUTTONS);
  await page.getByRole("button", { name: "Tredje" }).focus();
  await tabTo(page, "button", "Første", { reverse: true, max: 2 });
  await expect(page.getByRole("button", { name: "Første" })).toBeFocused();
  await expect(tabTo(page, "button", "Tredje", { reverse: true, max: 1 })).rejects.toThrow(
    "tabTo: button «Tredje» fikk ikke fokus etter 1 trykk på Shift+Tab.",
  );
});
