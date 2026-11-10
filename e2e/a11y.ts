import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// WCAG-taggene i AD-15 (NFR-8).
export const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Kjører axe på siden og feiler bare på brudd med `impact` `serious` eller
 * `critical`. Feilmeldingen lister regel-id, antall noder og velgerne til
 * nodene for hvert brudd.
 */
export async function expectNoSeriousA11yViolations(page: Page) {
  // En toast (Sonner) tones inn og ut. Mens den gjør det, regner axe
  // fargekontrasten ut fra en halvgjennomsiktig farge og gir et falskt brudd
  // på `color-contrast`. Derfor venter vi til alle toaster er helt synlige
  // eller borte.
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("[data-sonner-toast]")).every(
      (toast) => getComputedStyle(toast).opacity === "1",
    ),
  );
  const results = await new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes.length} ${v.nodes.length === 1 ? "node" : "noder"}: ${v.nodes
          .map((node) => node.target.join(" "))
          .join(", ")}`,
    );
  expect(serious, `axe fant brudd på ${page.url()}`).toEqual([]);
}
