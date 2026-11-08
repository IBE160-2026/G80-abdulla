// Tester REPORT_COLUMNS (AD-5): lista sender aldri author_id eller image_path
// til nettleseren, men har alle de andre kolonnene i visningen. Typesjekken
// kjøres av `npx tsc --noEmit`, kjøretidssjekken av Vitest.
import { expect, expectTypeOf, test } from "vitest";
import { REPORT_COLUMNS, type Report, type ReportRow } from "./types";

type Split<S extends string> = S extends `${infer Head}, ${infer Tail}`
  ? Head | Split<Tail>
  : S;

test("REPORT_COLUMNS er kolonnene i Report, uten author_id og image_path", () => {
  expectTypeOf<Split<typeof REPORT_COLUMNS>>().toEqualTypeOf<keyof Report>();
  expectTypeOf<Exclude<keyof ReportRow, keyof Report>>().toEqualTypeOf<
    "author_id" | "image_path"
  >();

  const columns = REPORT_COLUMNS.split(", ");
  expect(columns).not.toContain("author_id");
  expect(columns).not.toContain("image_path");
  expect(new Set(columns).size).toBe(columns.length);
});

test("tilleggskolonnene i visningen er ikke nullbare", () => {
  expectTypeOf<Report["confirmation_count"]>().toEqualTypeOf<number>();
  expectTypeOf<Report["seen_count"]>().toEqualTypeOf<number>();
  expectTypeOf<Report["confirmed_by_me"]>().toEqualTypeOf<boolean>();
  expectTypeOf<Report["authored_by_me"]>().toEqualTypeOf<boolean>();
  expectTypeOf<Report["summary"]>().toEqualTypeOf<string | null>();
});
