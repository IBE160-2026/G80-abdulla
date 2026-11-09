// Tester rapportkortet (Story 1.4) uten nettleser: at metadatalinja regner
// den relative tiden fra created_at og `now` kortet får, ikke fra
// status_changed_at eller klokka på maskinen, og at bildeikonet står sist i
// metadatalinja når rapporten har bilde (Story 1.7).
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
  has_image: false,
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

test("kortet uten bilde har ikke bildeikonet", () => {
  const html = renderToStaticMarkup(createElement(ReportCard, { report, now: NOW }));
  expect(html).not.toContain("Har bilde");
  expect(html).not.toContain("<svg");
});

test("kortet med bilde har bildeikonet sist i metadatalinja, lest som «Har bilde»", () => {
  const html = renderToStaticMarkup(
    createElement(ReportCard, { report: { ...report, has_image: true }, now: NOW }),
  );
  const svg = html.match(/<svg[^>]*>/g) ?? [];
  expect(svg).toHaveLength(1);
  expect(svg[0]).toContain('role="img"');
  expect(svg[0]).toContain('aria-label="Har bilde"');
  expect(svg[0]).toContain('width="16"');
  expect(svg[0]).toContain('height="16"');
  // lucide skjuler ikonet for skjermlesere bare når det mangler aria-prop.
  expect(svg[0]).not.toContain("aria-hidden");
  // Ikonet står sist i metadatalinja, rett etter den relative tiden.
  expect(html).toMatch(/3 har sett dette · 2 dager siden<svg[^>]*>.*?<\/svg><\/p>/);
});
