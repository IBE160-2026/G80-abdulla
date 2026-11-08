// Tester at hjelperne for axe og bredde feiler når de skal, og lar være når de
// ikke skal (I/O-matrisen i Story 1.2). Sidene lages i testen, så appen ikke
// trenger å ha feilene.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { A11Y_TAGS, expectNoSeriousA11yViolations } from "../a11y";
import { expectNoHorizontalScroll } from "../layout";

const html = (body: string) =>
  `<!doctype html><html lang="nb"><head><title>Test</title></head><body><main>${body}</main></body></html>`;

// Et 1×1 PNG-bilde, så siden ikke trenger nettverk.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

test("axe-hjelperen feiler på critical og lister regel-id og antall noder", async ({
  page,
}) => {
  await page.setContent(html(`<img src="${PNG}">`));
  await expect(expectNoSeriousA11yViolations(page)).rejects.toThrow(
    /image-alt \(critical\): 1 node:/,
  );
});

test("axe-hjelperen feiler på serious og lister regel-id og antall noder", async ({
  page,
}) => {
  await page.setContent(
    html(`<p style="color: #eeeeee; background: #ffffff">Lav kontrast</p>`),
  );
  await expect(expectNoSeriousA11yViolations(page)).rejects.toThrow(
    /color-contrast \(serious\): 1 node:/,
  );
});

test("axe-hjelperen feiler ikke på funn med impact moderate", async ({
  page,
}) => {
  // html-xml-lang-mismatch er en WCAG 2 A-regel (3.1.1) med impact moderate.
  // Først sjekkes det at axe faktisk finner bruddet, ellers ville testen
  // bestått uten å teste noe.
  await page.setContent(
    `<!doctype html><html lang="nb" xml:lang="en"><head><title>Test</title></head><body><main><p>Tekst</p></main></body></html>`,
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(A11Y_TAGS)
    .analyze();
  expect(violations.map((v) => `${v.id}:${v.impact}`)).toContain(
    "html-xml-lang-mismatch:moderate",
  );
  await expectNoSeriousA11yViolations(page);
});

test("breddehjelperen feiler og oppgir bredden når siden er for bred", async ({
  page,
}) => {
  await page.setContent(html(`<div style="width: 2000px">Bred</div>`));
  await expect(expectNoHorizontalScroll(page)).rejects.toThrow(
    /scrollWidth \d+ px er større enn clientWidth \d+ px/,
  );
});

test("breddehjelperen godtar en side som får plass", async ({ page }) => {
  await page.setContent(html(`<p>Smal</p>`));
  await expectNoHorizontalScroll(page);
});
