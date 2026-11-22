import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { expectNoHorizontalScroll } from "./layout";

// WCAG-taggene i AD-15 (NFR-8).
export const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Så lenge `waitForAnimations` venter før den feiler og sier hva som kjører. */
const ANIMATION_TIMEOUT = 10_000;

/**
 * Venter til alle endelige CSS-animasjoner og -overganger på siden er ferdige,
 * som en meny som tones inn eller ut. Uendelige animasjoner, som skjelettet
 * mens lista laster, blir aldri ferdige og telles ikke. Er noe fortsatt i gang
 * etter 10 s, feiler den og lister elementet og animasjonen eller egenskapen,
 * i stedet for at testen bare får tidsavbrudd.
 */
export async function waitForAnimations(page: Page) {
  const running = () =>
    document
      .getAnimations()
      .filter(
        (animation) =>
          animation.playState === "running" &&
          animation.effect?.getComputedTiming().endTime !== Infinity,
      )
      .map((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        const element = target
          ? `${target.tagName.toLowerCase()}${target.className ? `.${String(target.className).trim().split(/\s+/).slice(0, 3).join(".")}` : ""}`
          : "ukjent element";
        const name =
          (animation as CSSAnimation).animationName ??
          (animation as CSSTransition).transitionProperty ??
          "ukjent animasjon";
        return `${element} (${name})`;
      });
  try {
    await page.waitForFunction(
      () =>
        document
          .getAnimations()
          .every(
            (animation) =>
              animation.playState !== "running" ||
              animation.effect?.getComputedTiming().endTime === Infinity,
          ),
      undefined,
      { timeout: ANIMATION_TIMEOUT },
    );
  } catch {
    const still = await page.evaluate(running);
    throw new Error(
      `Animasjonene ble ikke ferdige på ${ANIMATION_TIMEOUT} ms: ${still.join(", ") || "ingen funnet ved feilen"}`,
    );
  }
}

/**
 * Kjører axe på siden når toaster og animasjoner er ferdige, og feiler bare på
 * brudd med `impact` `serious` eller `critical`. Feilmeldingen lister
 * regel-id, antall noder og velgerne til nodene for hvert brudd.
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
  // Det samme gjelder menyen i topplinja, som tones inn og ut på 150 ms. Det
  // var rotårsaken til at «en besøkende ser «Logg inn» i menyen …» i
  // innlogging.spec.ts var ustabil (epic-2-retro-item-6).
  await waitForAnimations(page);
  // Etter en navigasjon på klientsiden settes tittelen litt etter at innholdet
  // vises. Kjører axe før det, får vi et falskt brudd på `document-title`
  // (CI på Story 4.3, `/?mine=true` i core-flow.spec.ts).
  await page.waitForFunction(() => document.title.trim() !== "");
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

/**
 * axe og breddesjekk på siden, og i 360-prosjektet også på 320 px (WCAG 1.4.10).
 * Bredden settes tilbake til 360 px etterpå.
 */
export async function expectAccessibleLayout(page: Page) {
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);
  if (page.viewportSize()!.width === 360) {
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoSeriousA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await page.setViewportSize({ width: 360, height: 800 });
  }
}
