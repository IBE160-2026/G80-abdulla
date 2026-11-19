// Tester at cn() kjenner fontstørrelsene fra tailwind.config.ts (Story 1.4),
// så en fontstørrelse og en tekstfarge ikke fjerner hverandre.
import { expect, test } from "vitest";
import { cn } from "./utils";

test("cn beholder både fontstørrelsen og tekstfargen", () => {
  expect(cn("text-badge", "text-status-new-foreground")).toBe(
    "text-badge text-status-new-foreground",
  );
});

test("cn lar en tokenstørrelse erstatte en Tailwind-størrelse", () => {
  expect(cn("text-xs text-foreground", "text-badge")).toBe(
    "text-foreground text-badge",
  );
});
