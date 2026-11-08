import { expect, type Page } from "@playwright/test";

/** Feiler når siden kan scrolles sidelengs ved gjeldende bredde (NFR-1). */
export async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `Horisontal scrolling: scrollWidth ${scrollWidth} px er større enn clientWidth ${clientWidth} px`,
  ).toBeLessThanOrEqual(clientWidth);
}
