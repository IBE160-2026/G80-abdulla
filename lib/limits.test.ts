// Tester at charCount teller som char_length i Postgres (AD-4), så skjemaet
// og CHECK-uttrykkene gir samme svar. supabase/tests/begrensninger.sql
// sjekker at databasen godtar 1000 emoji. Til slutt at minste passordlengde
// er den samme som i supabase/config.toml (Story 2.1).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import {
  charCount,
  DESCRIPTION_MAX,
  LOCATION_MAX,
  MIN_PASSWORD_LENGTH,
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
  { name: "kombinert tegn", input: "e\u0301", expected: 2 },
  // Familie-emoji: tre personer og to ZWJ, fem kodepunkter.
  { name: "emoji med ZWJ", input: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", expected: 5 },
])("charCount teller kodepunkter: $name", ({ input, expected }) => {
  expect(charCount(input)).toBe(expected);
});

test("1000 emoji er 1000 tegn, akkurat på grensen", () => {
  const description = "😀".repeat(DESCRIPTION_MAX);
  expect(description.length).toBe(2000);
  expect(charCount(description)).toBe(DESCRIPTION_MAX);
});

test("MIN_PASSWORD_LENGTH er lik minimum_password_length i supabase/config.toml", () => {
  const config = readFileSync(
    fileURLToPath(new URL("../supabase/config.toml", import.meta.url)),
    "utf8",
  );
  const values = [
    ...config.matchAll(/^minimum_password_length\s*=\s*(\d+)\s*$/gm),
  ].map((match) => Number(match[1]));
  // Én linje i [auth], og den er lik konstanten.
  expect(values).toEqual([MIN_PASSWORD_LENGTH]);
  expect(MIN_PASSWORD_LENGTH).toBe(6);
});
