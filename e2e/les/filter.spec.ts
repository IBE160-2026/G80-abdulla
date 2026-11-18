// Filter og sortering i lista (Story 3.1, FR-6, SM-4). Testene leser
// seed-dataene i supabase/seed.sql og endrer ingenting, og kjører som
// besøkende, så rapport 7 (skjult) er aldri med.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { expectNoHorizontalScroll } from "../layout";

const reportId = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

type Category = "waste" | "lighting" | "roads_sidewalks" | "vandalism" | "other";
type Status = "new" | "in_progress" | "resolved";

// Fasiten, skrevet for hånd fra supabase/seed.sql: de åtte synlige
// rapportene med kategori, status, antall bekreftelser og opprettelsestid.
// Rapport 7 er skjult. Det er ikke hentet fra appens spørring.
const SEED: { n: number; category: Category; status: Status; confirmations: number; created: string }[] = [
  { n: 1, category: "waste", status: "new", confirmations: 2, created: "2026-10-20T08:15:00Z" },
  { n: 2, category: "lighting", status: "in_progress", confirmations: 2, created: "2026-10-21T17:40:00Z" },
  { n: 3, category: "roads_sidewalks", status: "resolved", confirmations: 1, created: "2026-10-22T07:30:00Z" },
  { n: 4, category: "vandalism", status: "new", confirmations: 0, created: "2026-10-24T12:05:00Z" },
  { n: 5, category: "other", status: "in_progress", confirmations: 0, created: "2026-10-26T10:00:00Z" },
  { n: 6, category: "waste", status: "resolved", confirmations: 1, created: "2026-10-27T15:20:00Z" },
  { n: 8, category: "roads_sidewalks", status: "in_progress", confirmations: 0, created: "2026-11-02T07:10:00Z" },
  { n: 9, category: "other", status: "new", confirmations: 0, created: "2026-11-05T09:45:00Z" },
];

const CATEGORIES: Category[] = ["waste", "lighting", "roads_sidewalks", "vandalism", "other"];
const STATUSES: Status[] = ["new", "in_progress", "resolved"];
const SORTS = ["newest", "confirmations"] as const;
type Sort = (typeof SORTS)[number];

const CATEGORY_NAMES = ["Søppel", "Belysning", "Vei og fortau", "Skadeverk", "Annet"];
const STATUS_NAMES = ["Ny", "Under behandling", "Løst"];

/** Forventet rekkefølge (rapportnumre) for en kombinasjon, regnet fra tabellen over. */
function expectedOrder(category: Category | null, status: Status | null, sort: Sort): number[] {
  const rows = SEED.filter(
    (r) => (category === null || r.category === category) && (status === null || r.status === status),
  );
  rows.sort((a, b) => {
    if (sort === "confirmations" && a.confirmations !== b.confirmations) {
      return b.confirmations - a.confirmations;
    }
    return b.created.localeCompare(a.created);
  });
  return rows.map((r) => r.n);
}

function href(category: Category | null, status: Status | null, sort: Sort): string {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (status) query.set("status", status);
  if (sort !== "newest") query.set("sort", sort);
  const text = query.toString();
  return text ? `/?${text}` : "/";
}

const cardLinks = (page: Page) => page.getByRole("main").getByRole("listitem").getByRole("link");
const chip = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const sortSelect = (page: Page) => page.getByRole("combobox", { name: "Sortering", exact: true });

async function shownReports(page: Page): Promise<number[]> {
  const hrefs = await cardLinks(page).evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href") ?? ""),
  );
  // Siste del av uuid-en er rapportnummeret, med nuller foran.
  return hrefs.map((h) => Number(h.split("-").pop()));
}

async function expectPressed(page: Page, pressed: string[]) {
  for (const name of ["Alle", ...CATEGORY_NAMES, ...STATUS_NAMES]) {
    await expect(chip(page, name), `brikken «${name}»`).toHaveAttribute(
      "aria-pressed",
      pressed.includes(name) ? "true" : "false",
    );
  }
}

test("hver kombinasjon av kategori, status og sortering gir forventet antall og rekkefølge", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const categories: (Category | null)[] = [null, ...CATEGORIES];
  const statuses: (Status | null)[] = [null, ...STATUSES];
  let combinations = 0;
  for (const category of categories) {
    for (const status of statuses) {
      for (const sort of SORTS) {
        combinations++;
        const url = href(category, status, sort);
        const expected = expectedOrder(category, status, sort);
        await page.goto(url);
        await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
        if (expected.length === 0) {
          await expect(page.getByText("Ingen rapporter matcher filteret.", { exact: true }), url).toBeVisible();
          await expect(cardLinks(page), url).toHaveCount(0);
          await expect(page.getByText(/^\d+ rapport/), url).toHaveCount(0);
        } else {
          await expect(cardLinks(page), url).toHaveCount(expected.length);
          const noun = expected.length === 1 ? "rapport" : "rapporter";
          await expect(page.getByText(`${expected.length} ${noun}`, { exact: true }), url).toBeVisible();
          expect(await shownReports(page), url).toEqual(expected);
        }
      }
    }
  }
  expect(combinations).toBe(6 * 4 * 2);
});

test("noen utvalg er skrevet ut for hånd, og likt antall gir nyeste først", async ({ page }) => {
  const cases: [string, number[]][] = [
    ["/", [9, 8, 6, 5, 4, 3, 2, 1]],
    ["/?sort=confirmations", [2, 1, 6, 3, 9, 8, 5, 4]],
    ["/?category=waste&sort=confirmations", [1, 6]],
    ["/?status=in_progress&sort=confirmations", [2, 8, 5]],
    ["/?category=roads_sidewalks&status=resolved", [3]],
    ["/?category=other&status=new", [9]],
    ["/?category=lighting", [2]],
  ];
  for (const [url, order] of cases) {
    await page.goto(url);
    await expect(cardLinks(page), url).toHaveCount(order.length);
    expect(await shownReports(page), url).toEqual(order);
    expect(await cardLinks(page).first().getAttribute("href"), url).toBe(`/rapporter/${reportId(order[0])}`);
  }
  // Den skjulte rapporten 7 er aldri med for en besøkende.
  await page.goto("/?category=lighting&sort=confirmations");
  await expect(page.locator(`a[href="/rapporter/${reportId(7)}"]`)).toHaveCount(0);
});

test("brikkene og sorteringen viser tilstanden fra URL-en, med aria-pressed", async ({ page }) => {
  await page.goto("/");
  await expectPressed(page, ["Alle"]);
  await expect(sortSelect(page)).toHaveText("Nyeste");

  await page.goto("/?category=lighting&status=in_progress&sort=confirmations");
  await expectPressed(page, ["Belysning", "Under behandling"]);
  await expect(sortSelect(page)).toHaveText("Flest har sett");
  await expect(cardLinks(page)).toHaveCount(1);
});

test("ukjente verdier i URL-en ignoreres, og lista vises som uten dem", async ({ page }) => {
  for (const url of [
    "/?category=Lighting",
    "/?category=Belysning",
    "/?category=waste&category=lighting",
    "/?category=",
    "/?status=",
    "/?status=NEW",
    "/?sort=oldest",
    "/?sort=Confirmations",
    "/?mine=true",
  ]) {
    await page.goto(url);
    await expect(cardLinks(page), url).toHaveCount(8);
    await expectPressed(page, ["Alle"]);
    await expect(sortSelect(page), url).toHaveText("Nyeste");
  }
  // Én ukjent verdi fjerner bare seg selv.
  await page.goto("/?category=ukjent&status=resolved&sort=confirmations");
  await expectPressed(page, ["Løst"]);
  await expect(sortSelect(page)).toHaveText("Flest har sett");
  // Likt antall bekreftelser (én hver) gir nyeste først.
  expect(await shownReports(page)).toEqual([6, 3]);
});

test("trykk på brikkene bytter, slår av og nullstiller, og sorteringen og filtrene beholder hverandre", async ({
  page,
}) => {
  await page.goto("/");

  await chip(page, "Belysning").click();
  await expect(page).toHaveURL("/?category=lighting");
  await expect(chip(page, "Belysning")).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "false");
  // Fokus blir på brikken som ble trykket.
  await expect(chip(page, "Belysning")).toBeFocused();

  await chip(page, "Under behandling").click();
  await expect(page).toHaveURL("/?category=lighting&status=in_progress");
  await expectPressed(page, ["Belysning", "Under behandling"]);

  await chip(page, "Søppel").click();
  await expect(page).toHaveURL("/?category=waste&status=in_progress");
  await expectPressed(page, ["Søppel", "Under behandling"]);

  await chip(page, "Søppel").click();
  await expect(page).toHaveURL("/?status=in_progress");
  await expectPressed(page, ["Under behandling"]);

  // Sorteringen beholder filteret.
  await sortSelect(page).click();
  await page.getByRole("option", { name: "Flest har sett", exact: true }).click();
  await expect(page).toHaveURL("/?status=in_progress&sort=confirmations");
  await expect(sortSelect(page)).toHaveText("Flest har sett");
  await expectPressed(page, ["Under behandling"]);

  // Et filter beholder sorteringen.
  await chip(page, "Annet").click();
  await expect(page).toHaveURL("/?category=other&status=in_progress&sort=confirmations");
  await expect(sortSelect(page)).toHaveText("Flest har sett");

  // «Alle» fjerner kategori og status og beholder sorteringen.
  await chip(page, "Alle").click();
  await expect(page).toHaveURL("/?sort=confirmations");
  await expectPressed(page, ["Alle"]);
  await expect(sortSelect(page)).toHaveText("Flest har sett");
  await expect(cardLinks(page)).toHaveCount(8);

  // Tilbake til standard sortering gir en ren URL.
  await sortSelect(page).click();
  await page.getByRole("option", { name: "Nyeste", exact: true }).click();
  await expect(page).toHaveURL("/");
});

test("to raske trykk før serveren har svart beholder begge filtrene", async ({ page }) => {
  await page.goto("/");
  // Forsinker serversvaret, som på et tregt mobilnett: det andre trykket
  // kommer før propen har fått det første valget.
  await page.route(/_rsc=/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await chip(page, "Belysning").click();
  await chip(page, "Under behandling").click();
  await expect(page).toHaveURL("/?category=lighting&status=in_progress");
  await expectPressed(page, ["Belysning", "Under behandling"]);
  expect(await shownReports(page)).toEqual([2]);
});

test("en omlasting og en delt lenke gir samme visning", async ({ page, context }) => {
  await page.goto("/");
  await chip(page, "Vei og fortau").click();
  await chip(page, "Under behandling").click();
  await expect(page).toHaveURL("/?category=roads_sidewalks&status=in_progress");
  await page.reload();
  await expectPressed(page, ["Vei og fortau", "Under behandling"]);
  expect(await shownReports(page)).toEqual([8]);

  const other = await context.newPage();
  await other.goto(page.url());
  await expectPressed(other, ["Vei og fortau", "Under behandling"]);
  expect(await shownReports(other)).toEqual([8]);
});

test("et filter uten treff viser beskjeden og «Nullstill filter», som beholder sorteringen", async ({
  page,
}) => {
  await page.goto("/?category=vandalism&status=resolved&sort=confirmations");
  await expect(page.getByText("Ingen rapporter matcher filteret.", { exact: true })).toBeVisible();
  await expect(cardLinks(page)).toHaveCount(0);
  await expect(page.getByText("Ingen rapporter ennå. Har du sett noe som bør fikses?")).toHaveCount(0);
  const reset = page.getByRole("link", { name: "Nullstill filter", exact: true });
  await expect(reset).toHaveAttribute("href", "/?sort=confirmations");

  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await reset.click();
  await expect(page).toHaveURL("/?sort=confirmations");
  await expect(cardLinks(page)).toHaveCount(8);
  await expectPressed(page, ["Alle"]);
  await expect(sortSelect(page)).toHaveText("Flest har sett");

  // Uten sortering går lenka til /.
  await page.goto("/?category=vandalism&status=resolved");
  await expect(page.getByRole("link", { name: "Nullstill filter", exact: true })).toHaveAttribute("href", "/");
});

test("lista med aktive filtre har ingen alvorlige axe-funn, ingen horisontal scrolling og trykkflater på 44 px", async ({
  page,
}) => {
  await page.goto("/?category=waste&status=new&sort=confirmations");
  await expect(cardLinks(page)).toHaveCount(1);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  for (const name of ["Alle", ...CATEGORY_NAMES, ...STATUS_NAMES]) {
    const box = await chip(page, name).boundingBox();
    expect(box?.height, `brikken «${name}»`).toBeGreaterThanOrEqual(44);
  }
  const select = await sortSelect(page).boundingBox();
  expect(select?.height).toBeGreaterThanOrEqual(44);

  // Brikkeraden kan rulles sideveis inne i seg selv når den er bredere enn
  // skjermen, og siden får aldri horisontal scrolling (NFR-1).
  const group = page.getByRole("group", { name: "Filtrer rapportene", exact: true });
  await expect(group.getByRole("group", { name: "Kategori", exact: true }).getByRole("button")).toHaveCount(5);
  await expect(group.getByRole("group", { name: "Status", exact: true }).getByRole("button")).toHaveCount(3);
  const { scrollWidth, clientWidth } = await group.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  if ((page.viewportSize()?.width ?? 0) < 640) {
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  }
  await expectNoHorizontalScroll(page);
});
