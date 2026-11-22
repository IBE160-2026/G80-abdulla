// «Mine rapporter» i lista (Story 3.2, FR-6, SM-4). Testene leser seed-dataene
// i supabase/seed.sql og endrer ingenting. De logger inn med seed-brukerne
// (bruker1, bruker2 og moderatoren) og sjekker lista mot en fasit skrevet for
// hånd, ikke mot spørringen appen bruker.
import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";
import { logIn } from "../auth";
import { expectNoHorizontalScroll } from "../layout";
import { cardLinks, chip, shownReports, sortSelect } from "../list";

type Category = "waste" | "lighting" | "roads_sidewalks" | "vandalism" | "other";
type Status = "new" | "in_progress" | "resolved";
type Author = "bruker1" | "bruker2";

// Fasiten, skrevet for hånd fra supabase/seed.sql: alle ni rapportene med
// forfatter, kategori, status, antall bekreftelser og opprettelsestid.
// bruker1 har rapport 1, 3, 5 og 7, bruker2 har 2, 4, 6, 8 og 9. Rapport 7
// er skjult, så den vises for ingen av dem (bare moderatoren ser skjulte).
const SEED: {
  n: number;
  author: Author;
  category: Category;
  status: Status;
  confirmations: number;
  created: string;
  hidden?: true;
}[] = [
  { n: 1, author: "bruker1", category: "waste", status: "new", confirmations: 2, created: "2026-10-20T08:15:00Z" },
  { n: 2, author: "bruker2", category: "lighting", status: "in_progress", confirmations: 2, created: "2026-10-21T17:40:00Z" },
  { n: 3, author: "bruker1", category: "roads_sidewalks", status: "resolved", confirmations: 1, created: "2026-10-22T07:30:00Z" },
  { n: 4, author: "bruker2", category: "vandalism", status: "new", confirmations: 0, created: "2026-10-24T12:05:00Z" },
  { n: 5, author: "bruker1", category: "other", status: "in_progress", confirmations: 0, created: "2026-10-26T10:00:00Z" },
  { n: 6, author: "bruker2", category: "waste", status: "resolved", confirmations: 1, created: "2026-10-27T15:20:00Z" },
  { n: 7, author: "bruker1", category: "lighting", status: "new", confirmations: 1, created: "2026-10-30T19:45:00Z", hidden: true },
  { n: 8, author: "bruker2", category: "roads_sidewalks", status: "in_progress", confirmations: 0, created: "2026-11-02T07:10:00Z" },
  { n: 9, author: "bruker2", category: "other", status: "new", confirmations: 0, created: "2026-11-05T09:45:00Z" },
];

const CATEGORIES: Category[] = ["waste", "lighting", "roads_sidewalks", "vandalism", "other"];
const STATUSES: Status[] = ["new", "in_progress", "resolved"];
const SORTS = ["newest", "confirmations"] as const;
type Sort = (typeof SORTS)[number];

const CATEGORY_NAMES = ["Søppel", "Belysning", "Vei og fortau", "Skadeverk", "Annet"];
const STATUS_NAMES = ["Ny", "Under behandling", "Løst"];
const MINE = "Mine rapporter";

const NO_OWN = "Du har ikke registrert noen rapporter ennå.";
const NO_MATCH = "Ingen rapporter matcher filteret.";

/**
 * Forventet rekkefølge (rapportnumre) for en innlogget bruker med «Mine
 * rapporter» på eller av, regnet fra tabellen over. Skjulte rapporter er
 * aldri med, for ingen av testbrukerne er moderator.
 */
function expectedOrder(
  author: Author | null,
  category: Category | null,
  status: Status | null,
  sort: Sort,
): number[] {
  const rows = SEED.filter(
    (r) =>
      !r.hidden &&
      (author === null || r.author === author) &&
      (category === null || r.category === category) &&
      (status === null || r.status === status),
  );
  rows.sort((a, b) => {
    if (sort === "confirmations" && a.confirmations !== b.confirmations) {
      return b.confirmations - a.confirmations;
    }
    return b.created.localeCompare(a.created);
  });
  return rows.map((r) => r.n);
}

function href(category: Category | null, status: Status | null, mine: boolean, sort: Sort): string {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (status) query.set("status", status);
  if (mine) query.set("mine", "true");
  if (sort !== "newest") query.set("sort", sort);
  const text = query.toString();
  return text ? `/?${text}` : "/";
}

const filterGroup = (page: Page) => page.getByRole("group", { name: "Filtrer rapportene", exact: true });

async function expectPressed(page: Page, pressed: string[]) {
  for (const name of [MINE, "Alle", ...CATEGORY_NAMES, ...STATUS_NAMES]) {
    await expect(chip(page, name), `brikken «${name}»`).toHaveAttribute(
      "aria-pressed",
      pressed.includes(name) ? "true" : "false",
    );
  }
}

const email = (user: Author | "moderator") => `${user}@localfix.test`;

test("en besøkende ser ikke «Mine rapporter», og mine=true i URL-en gir lista som uten filteret", async ({
  page,
}) => {
  await page.goto("/");
  await expect(chip(page, "Alle")).toBeVisible();
  await expect(chip(page, MINE)).toHaveCount(0);
  await expect(filterGroup(page).getByRole("button")).toHaveCount(9);
  await expect(filterGroup(page).getByRole("button").first()).toHaveText("Alle");

  for (const url of ["/?mine=true", "/?mine=true&sort=confirmations", "/?category=waste&mine=true"]) {
    await page.goto(url);
    await expect(chip(page, MINE), url).toHaveCount(0);
    // Som uten filteret: bare kategorien (om noen) og sorteringen gjelder.
    const category = url.includes("category") ? "waste" : null;
    const sort: Sort = url.includes("confirmations") ? "confirmations" : "newest";
    const expected = expectedOrder(null, category, null, sort);
    await expect(cardLinks(page), url).toHaveCount(expected.length);
    expect(await shownReports(page), url).toEqual(expected);
  }
});

test("«Mine rapporter» er første brikke for en innlogget bruker, foran «Alle»", async ({ page }) => {
  await logIn(page, email("bruker1"));
  await expect(chip(page, MINE)).toBeVisible();
  await expect(filterGroup(page).getByRole("button")).toHaveCount(10);
  await expect(filterGroup(page).getByRole("button").first()).toHaveText(MINE);
  await expectPressed(page, ["Alle"]);
  // Uten mine=true i URL-en er brikken ikke trykket, og lista er ufiltrert.
  await expect(cardLinks(page)).toHaveCount(8);
});

for (const author of ["bruker1", "bruker2"] as const) {
  test(`hver kombinasjon med «Mine rapporter» som ${author} gir forventet antall og rekkefølge`, async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await logIn(page, email(author));
    const categories: (Category | null)[] = [null, ...CATEGORIES];
    const statuses: (Status | null)[] = [null, ...STATUSES];
    let combinations = 0;
    for (const category of categories) {
      for (const status of statuses) {
        for (const sort of SORTS) {
          combinations++;
          const url = href(category, status, true, sort);
          const expected = expectedOrder(author, category, status, sort);
          await page.goto(url);
          await expect(page.getByRole("heading", { level: 1, name: "Rapporter" })).toBeVisible();
          await expect(chip(page, MINE), url).toHaveAttribute("aria-pressed", "true");
          if (expected.length === 0) {
            // Bare «Mine rapporter» aktiv gir den egne beskjeden, ellers filterbeskjeden.
            const message = category === null && status === null ? NO_OWN : NO_MATCH;
            await expect(page.getByText(message, { exact: true }), url).toBeVisible();
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
}

test("noen utvalg er skrevet ut for hånd, og den skjulte rapporten 7 vises aldri", async ({ page }) => {
  await logIn(page, email("bruker1"));
  const cases: [string, number[]][] = [
    ["/?mine=true", [5, 3, 1]],
    ["/?mine=true&sort=confirmations", [1, 3, 5]],
    ["/?category=waste&mine=true", [1]],
    ["/?status=in_progress&mine=true", [5]],
    ["/?category=other&status=in_progress&mine=true", [5]],
  ];
  for (const [url, order] of cases) {
    await page.goto(url);
    await expect(cardLinks(page), url).toHaveCount(order.length);
    expect(await shownReports(page), url).toEqual(order);
  }
  // Rapport 7 er bruker1 sin og belysning, men skjult: ingen treff.
  await page.goto("/?category=lighting&mine=true");
  await expect(page.getByText(NO_MATCH, { exact: true })).toBeVisible();
  await expect(cardLinks(page)).toHaveCount(0);
  await page.goto("/?mine=true");
  await expect(page.locator('a[href$="000000000007"]')).toHaveCount(0);

  // Bekreftelser teller ikke som egne rapporter: bruker2 har bekreftet rapport
  // 1, 3 og 7 (som er bruker1 sine), og ingen av dem er med.
  await logIn(page, email("bruker2"));
  await page.goto("/?mine=true&sort=confirmations");
  expect(await shownReports(page)).toEqual([2, 6, 9, 8, 4]);
  await expect(page.locator('a[href$="000000000001"], a[href$="000000000003"]')).toHaveCount(0);
  await page.goto("/?category=waste&status=resolved&mine=true");
  expect(await shownReports(page)).toEqual([6]);
  await expectPressed(page, [MINE, "Søppel", "Løst"]);
});

test("trykk på «Mine rapporter» slår den på og av, og kategori, status og sortering beholder den", async ({
  page,
}) => {
  await logIn(page, email("bruker2"));

  await chip(page, MINE).click();
  await expect(page).toHaveURL("/?mine=true");
  await expect(chip(page, MINE)).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, MINE)).toBeFocused();
  await expect(cardLinks(page)).toHaveCount(5);

  await chip(page, "Søppel").click();
  await expect(page).toHaveURL("/?category=waste&mine=true");
  await expectPressed(page, [MINE, "Søppel"]);
  expect(await shownReports(page)).toEqual([6]);

  await sortSelect(page).click();
  await page.getByRole("option", { name: "Flest har sett", exact: true }).click();
  await expect(page).toHaveURL("/?category=waste&mine=true&sort=confirmations");

  // «Alle» fjerner kategori og status, men endrer ikke «Mine rapporter».
  await chip(page, "Alle").click();
  await expect(page).toHaveURL("/?mine=true&sort=confirmations");
  await expectPressed(page, [MINE, "Alle"]);
  await expect(cardLinks(page)).toHaveCount(5);

  // Et nytt trykk slår «Mine rapporter» av og beholder sorteringen.
  await chip(page, MINE).click();
  await expect(page).toHaveURL("/?sort=confirmations");
  await expectPressed(page, ["Alle"]);
  await expect(cardLinks(page)).toHaveCount(8);
});

test("en omlasting og en delt lenke gir samme visning med «Mine rapporter»", async ({ page, context }) => {
  await logIn(page, email("bruker2"));
  await chip(page, MINE).click();
  await chip(page, "Under behandling").click();
  await expect(page).toHaveURL("/?status=in_progress&mine=true");
  await page.reload();
  await expectPressed(page, [MINE, "Under behandling"]);
  expect(await shownReports(page)).toEqual([8, 2]);

  // Samme innlogging i en ny fane gir samme visning.
  const other = await context.newPage();
  await other.goto(page.url());
  await expectPressed(other, [MINE, "Under behandling"]);
  expect(await shownReports(other)).toEqual([8, 2]);
});

test("en bruker uten egne rapporter får beskjeden og «Registrer problem», uten axe-funn", async ({ page }) => {
  // Moderatoren har ingen egne rapporter i seed.
  await logIn(page, email("moderator"));
  await page.goto("/?mine=true");
  await expect(chip(page, MINE)).toHaveAttribute("aria-pressed", "true");
  const message = page.getByText(NO_OWN, { exact: true });
  await expect(message).toBeVisible();
  await expect(cardLinks(page)).toHaveCount(0);
  await expect(page.getByText(NO_MATCH, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Ingen rapporter ennå. Har du sett noe som bør fikses?")).toHaveCount(0);
  // Bare «Mine rapporter» er aktiv, så det er ikke noe «Nullstill filter».
  await expect(page.getByRole("link", { name: "Nullstill filter", exact: true })).toHaveCount(0);
  const register = message.locator("xpath=..").getByRole("link", { name: "Registrer problem", exact: true });
  await expect(register).toHaveAttribute("href", "/rapporter/ny");

  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Er en kategori eller status også aktiv, står filterbeskjeden i stedet, og
  // «Nullstill filter» fjerner «Mine rapporter» og beholder sorteringen.
  await page.goto("/?status=resolved&mine=true&sort=confirmations");
  await expect(page.getByText(NO_MATCH, { exact: true })).toBeVisible();
  await expect(page.getByText(NO_OWN, { exact: true })).toHaveCount(0);
  const reset = page.getByRole("link", { name: "Nullstill filter", exact: true });
  await expect(reset).toHaveAttribute("href", "/?sort=confirmations");
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  await reset.click();
  await expect(page).toHaveURL("/?sort=confirmations");
  await expectPressed(page, ["Alle"]);
  await expect(sortSelect(page)).toHaveText("Flest har sett");
  // Moderatoren ser også den skjulte rapport 7, så lista uten filter har ni kort.
  await expect(cardLinks(page)).toHaveCount(9);

  // Uten sortering går lenka til /.
  await page.goto("/?category=vandalism&mine=true");
  await expect(page.getByRole("link", { name: "Nullstill filter", exact: true })).toHaveAttribute("href", "/");
});

test("lista med «Mine rapporter» og andre filtre har ingen alvorlige axe-funn, ingen horisontal scrolling og trykkflater på 44 px", async ({
  page,
}) => {
  await logIn(page, email("bruker2"));
  await page.goto("/?category=waste&status=resolved&mine=true&sort=confirmations");
  await expect(cardLinks(page)).toHaveCount(1);
  await expectNoSeriousA11yViolations(page);
  await expectNoHorizontalScroll(page);

  for (const name of [MINE, "Alle", ...CATEGORY_NAMES, ...STATUS_NAMES]) {
    const box = await chip(page, name).boundingBox();
    expect(box?.height, `brikken «${name}»`).toBeGreaterThanOrEqual(44);
  }
  // Brikkeraden ruller sideveis inne i seg selv på smal skjerm.
  const { scrollWidth, clientWidth } = await filterGroup(page).evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  if ((page.viewportSize()?.width ?? 0) < 640) {
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  }
});

test("«Mine rapporter» nås og slås på bare med tastatur", async ({ page }) => {
  await logIn(page, email("bruker2"));
  await page.goto("/");
  await expect(chip(page, MINE)).toBeVisible();
  // Sorteringen er først i fokusrekkefølgen etter topplinja, så brikkene.
  await page.keyboard.press("Tab");
  let reached = false;
  for (let i = 0; i < 12; i++) {
    if (await chip(page, MINE).evaluate((element) => element === document.activeElement)) {
      reached = true;
      break;
    }
    await page.keyboard.press("Tab");
  }
  expect(reached, "«Mine rapporter» fikk fokus med Tab").toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/?mine=true");
  await expect(chip(page, MINE)).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, MINE)).toBeFocused();
});
