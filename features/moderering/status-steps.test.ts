// Tester nabostatusene i moderatorpanelet (Story 4.1, UX-DR15): bare ett steg
// fram eller tilbake, tilbake først, med navnene fra shared/report/labels.ts.
import { expect, test } from "vitest";
import { neighbourStatuses, STATUS_ORDER } from "./status-steps";

test("rekkefølgen er enumen i databasen", () => {
  expect(STATUS_ORDER).toEqual(["new", "in_progress", "resolved"]);
});

test("Ny gir bare «Under behandling →»", () => {
  expect(neighbourStatuses("new")).toEqual([{ to: "in_progress", label: "Under behandling →" }]);
});

test("Under behandling gir «← Ny» og «Løst →», tilbake først", () => {
  expect(neighbourStatuses("in_progress")).toEqual([
    { to: "new", label: "← Ny" },
    { to: "resolved", label: "Løst →" },
  ]);
});

test("Løst gir bare «← Under behandling»", () => {
  expect(neighbourStatuses("resolved")).toEqual([
    { to: "in_progress", label: "← Under behandling" },
  ]);
});

test("ingen status tilbyr et hopp eller seg selv", () => {
  for (const status of STATUS_ORDER) {
    for (const { to } of neighbourStatuses(status)) {
      expect(Math.abs(STATUS_ORDER.indexOf(to) - STATUS_ORDER.indexOf(status))).toBe(1);
    }
  }
});
