// Tester at charCount teller som char_length i Postgres (AD-4), så skjemaet
// og CHECK-uttrykkene gir samme svar. supabase/tests/begrensninger.sql
// sjekker at databasen godtar 1000 emoji.
import { expect, test } from "vitest";
import {
  charCount,
  DESCRIPTION_MAX,
  LOCATION_MAX,
  SUMMARY_MAX,
} from "./limits";

test("grensene er de samme som i databasen", () => {
  expect(DESCRIPTION_MAX).toBe(1000);
  expect(LOCATION_MAX).toBe(200);
  expect(SUMMARY_MAX).toBe(300);
});

test.each([
  { name: "tom tekst", input: "", expected: 0 },
  { name: "vanlig tekst med æøå", input: "Søppel på fortauet", expected: 18 },
  { name: "én emoji (to UTF-16-enheter)", input: "😀", expected: 1 },
  // e + kombinerende akutt aksent: to kodepunkter, som char_length.
  { name: "kombinert tegn", input: "é", expected: 2 },
  // Familie-emoji: tre personer og to ZWJ, fem kodepunkter.
  { name: "emoji med ZWJ", input: "👨‍👩‍👧", expected: 5 },
])("charCount teller kodepunkter: $name", ({ input, expected }) => {
  expect(charCount(input)).toBe(expected);
});

test("1000 emoji er 1000 tegn, akkurat på grensen", () => {
  const description = "😀".repeat(DESCRIPTION_MAX);
  expect(description.length).toBe(2000);
  expect(charCount(description)).toBe(DESCRIPTION_MAX);
});
