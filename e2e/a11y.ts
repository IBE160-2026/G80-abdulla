import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// WCAG-taggene i AD-15 (NFR-8).
export const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Kjører axe på siden og feiler bare på brudd med `impact` `serious` eller
 * `critical`. Feilmeldingen lister regel-id og antall noder for hvert brudd.
 */
export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} noder`);
  expect(serious, `axe fant brudd på ${page.url()}`).toEqual([]);
}
