// Forsiden er rapportlista (Story 1.4). Testene leser seed-dataene i
// supabase/seed.sql og endrer ingenting.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { expectNoHorizontalScroll } from "../layout";

const reportId = (n: number) => `20000000-0000-4000-8000-00000000000${n}`;

// De synlige seed-rapportene, nyeste først. Rapport 7 er skjult.
// Teksten er summary, eller description når summary er NULL.
const EXPECTED = [
  { n: 9, category: "Annet", status: "Ny", seen: 1, text: "Skiltet som viser vei til biblioteket har falt ned" },
  { n: 8, category: "Vei og fortau", status: "Under behandling", seen: 1, text: "Glatt og ustrødd fortau langs bygg B" },
  { n: 6, category: "Søppel", status: "Løst", seen: 2, text: "Glasskår ved benkene" },
  { n: 5, category: "Annet", status: "Under behandling", seen: 1, text: "Det lekker vann fra taket i gangen utenfor rom 214." },
  { n: 4, category: "Skadeverk", status: "Ny", seen: 1, text: "Noen har tagget ned veggen på sykkelskuret" },
  { n: 3, category: "Vei og fortau", status: "Løst", seen: 2, text: "Hull i asfalten ved P2" },
  { n: 2, category: "Belysning", status: "Under behandling", seen: 3, text: "Slukkede gatelys på gangveien" },
  { n: 1, category: "Søppel", status: "Ny", seen: 3, text: "Full søppelkasse ved hovedinngangen" },
];

// Forfatterne av seed-rapportene. De skal aldri sendes til nettleseren (AD-5).
const AUTHOR_IDS = [
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
];

const cardLinks = (page: Page) =>
  page.getByRole("main").getByRole("listitem").getByRole("link");

test("forsiden svarer 200, har topplinja, overskriften og ingen alvorlige axe-funn", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("banner").getByRole("link", { name: "LocalFix · Campus Molde" }),
  ).toHaveAttribute("href", "/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Rapporter" }),
  ).toBeVisible();
  await expect(cardLinks(page)).toHaveCount(EXPECTED.length);
  await expectNoSeriousA11yViolations(page);
});

test("lista viser de synlige rapportene nyeste først, med kategori, status og antall", async ({
  page,
}) => {
  await page.goto("/");
  const links = cardLinks(page);
  await expect(links).toHaveCount(EXPECTED.length);
  await expect(page.getByText("8 rapporter", { exact: true })).toBeVisible();
  await expect(page.getByText(/Lista viser bare de/)).toHaveCount(0);

  for (const [i, report] of EXPECTED.entries()) {
    const link = links.nth(i);
    await expect(link).toHaveAttribute("href", `/rapporter/${reportId(report.n)}`);
    await expect(link).toContainText(report.category);
    await expect(link).toContainText(report.status);
    await expect(link).toContainText(report.text);
    await expect(link).toContainText(`${report.seen} har sett dette · `);
  }

  // Den skjulte rapporten 7 vises ikke for en besøkende.
  await expect(page.locator(`a[href="/rapporter/${reportId(7)}"]`)).toHaveCount(0);
  await expect(page.getByText("Blinkende lys i trappa")).toHaveCount(0);
});

test("rapport 5 vises som ren tekst på høyst to linjer, uten horisontal scrolling", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator(`a[href="/rapporter/${reportId(5)}"]`);
  await expect(card).toContainText("<b>fet</b> <script>alert(1)</script>");
  await expect(card.locator("b, script")).toHaveCount(0);

  const text = card.getByText(/^Det lekker vann fra taket/);
  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const lines = await text.evaluate((element) => {
      const style = getComputedStyle(element);
      return element.getBoundingClientRect().height / parseFloat(style.lineHeight);
    });
    expect(lines, `rapport 5 er ${lines} linjer høy ved ${width} px`).toBeLessThanOrEqual(2.05);
    await expectNoHorizontalScroll(page);
  }
});

test("lista følger DESIGN.md: bakgrunn, kortene, bredden og trykkflatene", async ({
  page,
}) => {
  await page.goto("/");
  const links = cardLinks(page);
  await expect(links).toHaveCount(EXPECTED.length);

  const viewport = page.viewportSize()!;
  const styles = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const card = document.querySelector("main li > a > div")!;
    const cardStyle = getComputedStyle(card);
    return {
      background: body.backgroundColor,
      cardBackground: cardStyle.backgroundColor,
      borderWidth: cardStyle.borderTopWidth,
      borderStyle: cardStyle.borderTopStyle,
      borderColor: cardStyle.borderTopColor,
      radius: cardStyle.borderTopLeftRadius,
      shadow: cardStyle.boxShadow,
    };
  });
  const { shadow, ...rest } = styles;
  expect(rest).toEqual({
    background: "rgb(245, 247, 250)",
    cardBackground: "rgb(255, 255, 255)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgb(220, 226, 232)",
    radius: "12px",
  });
  // Tailwinds shadow-none gir gjennomsiktige skygger på 0 px, ikke «none».
  // Begge betyr at kortet ikke har skygge.
  expect(shadow).toMatch(/^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/);

  // Statusmerkene har fargene fra DESIGN.md (bakgrunn / tekst).
  for (const { n, status, background, color } of [
    { n: 9, status: "Ny", background: "rgb(227, 238, 249)", color: "rgb(31, 78, 121)" },
    { n: 8, status: "Under behandling", background: "rgb(255, 241, 214)", color: "rgb(122, 75, 0)" },
    { n: 6, status: "Løst", background: "rgb(226, 243, 230)", color: "rgb(30, 107, 52)" },
  ]) {
    const badge = page
      .locator(`a[href="/rapporter/${reportId(n)}"]`)
      .getByText(status, { exact: true });
    await expect(badge, `statusmerket «${status}»`).toHaveCSS("background-color", background);
    await expect(badge, `statusmerket «${status}»`).toHaveCSS("color", color);
  }

  for (const box of await links.evaluateAll((elements) =>
    elements.map((element) => {
      const { left, right, height } = element.getBoundingClientRect();
      return { left, right, height };
    }),
  )) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.right - box.left).toBeLessThanOrEqual(640 - 2 * 16);
    expect(box.left).toBeGreaterThanOrEqual(16);
    if (viewport.width < 640 + 2 * 16) {
      expect(box.left).toBe(16);
      expect(box.right).toBe(viewport.width - 16);
    }
  }
});

test("siden sender ikke forfatternes uuid og caches ikke", async ({ request }) => {
  const html = await request.get("/");
  expect(html.headers()["cache-control"]).toContain("no-store");
  const htmlBody = await html.text();
  // Kontroll: svaret har faktisk rapportene.
  expect(htmlBody).toContain(reportId(1));

  // RSC-nyttelasten, slik klientnavigasjonen henter den. Next svarer med en
  // omdirigering til /?_rsc, som request følger med samme hoder.
  const rsc = await request.get("/", { headers: { RSC: "1" } });
  expect(rsc.headers()["content-type"]).toContain("text/x-component");
  expect(rsc.headers()["cache-control"]).toContain("no-store");
  const rscBody = await rsc.text();
  expect(rscBody).toContain(reportId(1));

  for (const id of AUTHOR_IDS) {
    expect(htmlBody, `HTML-en inneholder forfatter-uuid ${id}`).not.toContain(id);
    expect(rscBody, `RSC-nyttelasten inneholder forfatter-uuid ${id}`).not.toContain(id);
  }
});
