// Tester detaljsiden (Story 1.5) uten Supabase: en ugyldig id gir notFound()
// uten noe databasekall, og en id uten rad gir også notFound(). Rapporten og
// den signerte lenken sendes videre til ReportDetail (Story 1.7). Om brukeren
// er innlogget, sendes også videre (Story 3.3), og Auth leses først etter at
// rapporten er funnet. Moderatorpanelet (Story 4.1) settes inn etter
// bekreftelsen bare for moderatoren.
import { beforeEach, expect, test, vi } from "vitest";

const getReport = vi.fn();
const getViewer = vi.fn();
const NOT_FOUND = new Error("NEXT_NOT_FOUND");

vi.mock("@/features/rapporter/queries", () => ({ getReport }));
vi.mock("@/shared/supabase/auth", () => ({ getViewer }));
// Siden importerer ConfirmSection, som importerer Server Action-en og
// dermed Supabase-klienten, som krever miljøvariabler.
vi.mock("@/features/bekreftelser/actions", () => ({ confirmReport: vi.fn() }));
vi.mock("@/features/moderering/actions", () => ({ setReportStatus: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

const { default: ReportPage } = await import("./page");
const { ReportDetail } = await import("@/features/rapporter/components/report-detail");
const { ConfirmSection } = await import("@/features/bekreftelser/components/confirm-section");
const { StatusPanel } = await import("@/features/moderering/components/status-panel");

const render = (id: string) => ReportPage({ params: Promise.resolve({ id }) });

type Slot = { type: unknown; props: Record<string, unknown> };
/** Innholdet siden gir ReportDetail som children, uten tomme plasser (false). */
const slots = (page: Awaited<ReturnType<typeof render>>): Slot[] =>
  [page.props.children.props.children].flat().filter(Boolean);

beforeEach(() => {
  getReport.mockReset();
  getViewer.mockReset();
  getViewer.mockResolvedValue({ user: null, isModerator: false });
});

test.each(["abc", "123", "20000000-0000-4000-8000-0000000000010"])(
  "ugyldig id %s gir notFound() uten databasekall",
  async (id) => {
    await expect(render(id)).rejects.toBe(NOT_FOUND);
    expect(getReport).not.toHaveBeenCalled();
    expect(getViewer).not.toHaveBeenCalled();
  },
);

test("en gyldig id uten rad gir notFound() etter ett oppslag", async () => {
  getReport.mockResolvedValue(null);
  await expect(render("20000000-0000-4000-8000-000000000007")).rejects.toBe(NOT_FOUND);
  expect(getReport).toHaveBeenCalledExactlyOnceWith("20000000-0000-4000-8000-000000000007");
  expect(getViewer).not.toHaveBeenCalled();
});

test("store bokstaver i id-en slås opp med små", async () => {
  getReport.mockResolvedValue(null);
  await expect(render("ABCDEF00-0000-4000-8000-00000000000A")).rejects.toBe(NOT_FOUND);
  expect(getReport).toHaveBeenCalledExactlyOnceWith("abcdef00-0000-4000-8000-00000000000a");
});

test("en synlig rapport gir ReportDetail med rapporten og den signerte lenken", async () => {
  const report = { id: "20000000-0000-4000-8000-000000000002", has_image: true };
  const imageUrl = "http://127.0.0.1:54321/storage/v1/object/sign/report-images/x.jpg?token=t";
  getReport.mockResolvedValue({ report, imageUrl });
  const page = await render("20000000-0000-4000-8000-000000000002");
  const detail = page.props.children;
  expect(detail.type).toBe(ReportDetail);
  expect(detail.props.report).toBe(report);
  expect(detail.props.imageUrl).toBe(imageUrl);
});

test("bekreftelsen settes inn i ReportDetail som children, med tallene fra rapporten", async () => {
  const report = {
    id: "20000000-0000-4000-8000-000000000002",
    seen_count: 4,
    confirmed_by_me: false,
    authored_by_me: true,
    hidden: false,
  };
  getReport.mockResolvedValue({ report, imageUrl: null });
  const page = await render("20000000-0000-4000-8000-000000000002");
  const [confirm, ...rest] = slots(page);
  expect(rest).toEqual([]);
  expect(confirm.type).toBe(ConfirmSection);
  expect(confirm.props).toEqual({
    reportId: report.id,
    seenCount: 4,
    confirmedByMe: false,
    authoredByMe: true,
    hidden: false,
    isSignedIn: false,
  });
});

test("en innlogget bruker gir isSignedIn true, en besøkende false", async () => {
  const report = { id: "20000000-0000-4000-8000-000000000002", has_image: false };
  getReport.mockResolvedValue({ report, imageUrl: null });
  getViewer.mockResolvedValue({ user: { id: "u1", email: "bruker1@localfix.test" }, isModerator: false });
  const signedIn = await render("20000000-0000-4000-8000-000000000002");
  expect(slots(signedIn)[0].props.isSignedIn).toBe(true);
  getViewer.mockResolvedValue({ user: null, isModerator: false });
  const visitor = await render("20000000-0000-4000-8000-000000000002");
  expect(slots(visitor)[0].props.isSignedIn).toBe(false);
});

test("moderatoren får StatusPanel etter bekreftelsen, med id-en og statusen", async () => {
  const report = { id: "20000000-0000-4000-8000-000000000002", status: "in_progress", hidden: false };
  getReport.mockResolvedValue({ report, imageUrl: null });
  getViewer.mockResolvedValue({ user: { id: "m1", email: "moderator@localfix.test" }, isModerator: true });
  const page = await render("20000000-0000-4000-8000-000000000002");
  const [confirm, panel, ...rest] = slots(page);
  expect(confirm.type).toBe(ConfirmSection);
  expect(panel.type).toBe(StatusPanel);
  expect(panel.props).toEqual({ reportId: report.id, status: "in_progress" });
  expect(rest).toEqual([]);
});

test("en vanlig bruker og en besøkende får ikke StatusPanel", async () => {
  const report = { id: "20000000-0000-4000-8000-000000000002", status: "new", hidden: false };
  getReport.mockResolvedValue({ report, imageUrl: null });
  for (const viewer of [
    { user: { id: "u1", email: "bruker1@localfix.test" }, isModerator: false },
    { user: null, isModerator: false },
  ]) {
    getViewer.mockResolvedValue(viewer);
    const page = await render("20000000-0000-4000-8000-000000000002");
    expect(slots(page).map((slot) => slot.type)).toEqual([ConfirmSection]);
  }
});

test("en rapport uten bilde gir ReportDetail med imageUrl null", async () => {
  const report = { id: "20000000-0000-4000-8000-000000000001", has_image: false };
  getReport.mockResolvedValue({ report, imageUrl: null });
  const page = await render("20000000-0000-4000-8000-000000000001");
  expect(page.props.children.props.report).toBe(report);
  expect(page.props.children.props.imageUrl).toBeNull();
});
