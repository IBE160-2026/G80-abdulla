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

test("tabTo feiler og navngir rolle og navn når elementet mangler", async ({
  page,
}) => {
  await page.setContent(BUTTONS);
  await expect(tabTo(page, "button", "Fjerde", { max: 5 })).rejects.toThrow(
    "tabTo: button «Fjerde» fikk ikke fokus etter 5 trykk på Tab.",
  );
});
