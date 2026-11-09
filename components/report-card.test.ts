// Tester rapportkortet (Story 1.4) uten nettleser: at metadatalinja regner
// den relative tiden fra created_at og `now` kortet får, ikke fra
// status_changed_at eller klokka på maskinen.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { Report } from "@/lib/supabase/types";
import { ReportCard } from "./report-card";

const NOW = new Date("2026-11-09T12:00:00Z");

const report: Report = {
  id: "20000000-0000-4000-8000-000000000002",
  description: "To gatelys langs gangveien er slukket.",
  location: "Gangveien mot studentboligene",
  category: "lighting",
  summary: "Slukkede gatelys på gangveien",
  status: "in_progress",
  hidden: false,
  // To døgn før NOW. Statusen ble endret for fem timer siden, så et kort som
  // brukte status_changed_at, ville vist «5 timer siden».
  created_at: "2026-11-07T11:00:00+00:00",
  status_changed_at: "2026-11-09T07:00:00+00:00",
  confirmation_count: 2,
  seen_count: 3,
  confirmed_by_me: false,
  authored_by_me: false,
};

test("kortet viser seen_count og tiden siden created_at, regnet fra now", () => {
  const html = renderToStaticMarkup(createElement(ReportCard, { report, now: NOW }));
  expect(html).toContain("3 har sett dette · 2 dager siden");
  expect(html).not.toContain("timer siden");
  expect(html).toContain(`href="/rapporter/${report.id}"`);
});

test("kortet bruker now fra parameteren, ikke klokka", () => {
  const later = new Date("2026-11-30T12:00:00Z");
  const html = renderToStaticMarkup(createElement(ReportCard, { report, now: later }));
  expect(html).toContain("3 har sett dette · 3 uker siden");
});
