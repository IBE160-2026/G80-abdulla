// Tester detaljsiden (Story 1.5) uten Supabase: en ugyldig id gir notFound()
// uten noe databasekall, og en id uten rad gir også notFound().
import { beforeEach, expect, test, vi } from "vitest";

const getReport = vi.fn();
const NOT_FOUND = new Error("NEXT_NOT_FOUND");

vi.mock("@/lib/supabase/reports", () => ({ getReport }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

const { default: ReportPage } = await import("./page");

const render = (id: string) => ReportPage({ params: Promise.resolve({ id }) });

beforeEach(() => {
  getReport.mockReset();
});

test.each(["abc", "123", "20000000-0000-4000-8000-0000000000010"])(
  "ugyldig id %s gir notFound() uten databasekall",
  async (id) => {
    await expect(render(id)).rejects.toBe(NOT_FOUND);
    expect(getReport).not.toHaveBeenCalled();
  },
);

test("en gyldig id uten rad gir notFound() etter ett oppslag", async () => {
  getReport.mockResolvedValue(null);
  await expect(render("20000000-0000-4000-8000-000000000007")).rejects.toBe(NOT_FOUND);
  expect(getReport).toHaveBeenCalledExactlyOnceWith("20000000-0000-4000-8000-000000000007");
});

test("store bokstaver i id-en slås opp med små", async () => {
  getReport.mockResolvedValue(null);
  await expect(render("ABCDEF00-0000-4000-8000-00000000000A")).rejects.toBe(NOT_FOUND);
  expect(getReport).toHaveBeenCalledExactlyOnceWith("abcdef00-0000-4000-8000-00000000000a");
});
